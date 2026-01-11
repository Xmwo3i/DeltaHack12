// ============================================================
// ANALYZE VIEW - Exercise Analysis Page
// ============================================================

import React from 'react';
import VideoOverlay from '../components/VideoOverlay';
import ExercisePreview from '../components/ExercisePreview';
import VoiceSettings from '../components/VoiceSettings';
import FeedbackPanel from '../components/FeedbackPanel';
import InstructionsPanel from '../components/InstructionsPanel';
import Loading from '../components/Loading';
import usePoseDetection from '../hooks/usePoseDetection';

const AnalyzeView = ({ 
    exercise, 
    onBack, 
    onRep, 
    voiceOn, 
    setVoiceOn, 
    speaking, 
    coachMsg 
}) => {
    const {
        videoRef,
        canvasRef,
        ready,
        accuracy,
        phase,
        reps,
        feedback,
        fps,
        stopCamera
    } = usePoseDetection(exercise, onRep);

    const handleBack = () => {
        stopCamera();
        onBack();
    };

    return (
        <>
            {/* Back Button */}
            <div className="back-btn" onClick={handleBack}>
                ← Back
            </div>

            <div className="analysis">
                {/* Video Section */}
                <div className="video-box">
                    <video 
                        ref={videoRef} 
                        playsInline 
                        style={{ transform: 'scaleX(-1)' }} 
                    />
                    <canvas 
                        ref={canvasRef} 
                        style={{ transform: 'scaleX(-1)' }} 
                    />

                    {ready ? (
                        <VideoOverlay
                            fps={fps}
                            accuracy={accuracy}
                            phase={phase}
                            reps={reps}
                            speaking={speaking}
                            coachMsg={coachMsg}
                        />
                    ) : (
                        <Loading message="Loading camera..." />
                    )}
                </div>

                {/* Side Panel */}
                <div className="panel">
                    <ExercisePreview exercise={exercise} />
                    
                    <VoiceSettings 
                        voiceOn={voiceOn} 
                        setVoiceOn={setVoiceOn} 
                    />
                    
                    <FeedbackPanel feedback={feedback} />
                    
                    <InstructionsPanel tips={exercise.tips} />

                    <button 
                        className="btn btn-danger btn-full" 
                        onClick={handleBack}
                    >
                        End Workout
                    </button>
                </div>
            </div>
        </>
    );
};

export default AnalyzeView;