// ============================================================
// USE POSE DETECTION HOOK
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAngles, evaluateForm, drawSkeleton, getAccuracyColor } from '../utils/poseUtils';
import voiceCoach from '../utils/VoiceCoach';

const usePoseDetection = (exercise, onRep) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const poseRef = useRef(null);
    const phaseHistory = useRef([]);
    const lastFeedbackTime = useRef(0);
    const frameCount = useRef(0);
    const lastFpsTime = useRef(Date.now());
    const processingRef = useRef(false);

    const [ready, setReady] = useState(false);
    const [accuracy, setAccuracy] = useState(0);
    const [phase, setPhase] = useState('READY');
    const [reps, setReps] = useState(0);
    const [feedback, setFeedback] = useState([]);
    const [fps, setFps] = useState(0);

    const onResults = useCallback((results) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        // FPS counter
        frameCount.current++;
        const now = Date.now();
        if (now - lastFpsTime.current >= 1000) {
            setFps(frameCount.current);
            frameCount.current = 0;
            lastFpsTime.current = now;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks;
            const angles = getAngles(landmarks);
            
            if (angles) {
                const { accuracy: acc, phase: ph, feedback: fb } = evaluateForm(angles, exercise);
                
                setAccuracy(Math.round(acc));
                setPhase(ph);
                setFeedback(fb);

                // Voice feedback every 6 seconds
                if (now - lastFeedbackTime.current > 6000) {
                    voiceCoach.speak(voiceCoach.getFeedback(acc, fb));
                    lastFeedbackTime.current = now;
                }

                // Rep counting
                phaseHistory.current.push(ph);
                if (phaseHistory.current.length > 12) {
                    phaseHistory.current.shift();
                }
                
                const phases = Object.keys(exercise.phases);
                if (phases.length >= 2 && phaseHistory.current.length >= 6) {
                    const h = phaseHistory.current;
                    const recent = h.slice(-6);
                    const hasP0 = recent.slice(0, 3).includes(phases[0]);
                    const hasP1 = recent.slice(3).includes(phases[1]);
                    
                    if (hasP0 && hasP1 && h[h.length - 1] !== h[h.length - 2]) {
                        setReps(r => {
                            const newReps = r + 1;
                            voiceCoach.announceRep(newReps);
                            onRep?.();
                            return newReps;
                        });
                        phaseHistory.current = [ph];
                    }
                }

                // Draw skeleton
                const color = getAccuracyColor(acc);
                drawSkeleton(ctx, landmarks, canvas.width, canvas.height, color);
            }
        }
    }, [exercise, onRep]);

    const initPose = useCallback(async () => {
        // Initialize MediaPipe Pose
        const pose = new window.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
        });

        pose.setOptions({
            modelComplexity: 0, // LITE model for speed
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);
        poseRef.current = pose;

        return pose;
    }, [onResults]);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });

            const video = videoRef.current;
            if (!video) return;

            video.srcObject = stream;
            await video.play();

            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            setReady(true);
            voiceCoach.announceStart(exercise.name);

            // Process frames
            let skip = 0;
            const processFrame = async () => {
                if (!poseRef.current) return;
                
                skip++;
                if (skip % 2 === 0 && !processingRef.current) {
                    processingRef.current = true;
                    await poseRef.current.send({ image: video });
                    processingRef.current = false;
                }
                
                requestAnimationFrame(processFrame);
            };
            processFrame();

        } catch (err) {
            console.error("Camera error:", err);
            alert("Camera access denied. Please allow camera permissions.");
        }
    }, [exercise]);

    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        voiceCoach.announceEnd(exercise.name, reps);
    }, [exercise, reps]);

    // Initialize on mount
    useEffect(() => {
        const setup = async () => {
            await initPose();
            await startCamera();
        };
        
        setup();

        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            poseRef.current?.close();
            voiceCoach.stop();
        };
    }, []);

    return {
        videoRef,
        canvasRef,
        ready,
        accuracy,
        phase,
        reps,
        feedback,
        fps,
        stopCamera
    };
};

export default usePoseDetection;