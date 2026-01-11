// ============================================================
// USE LIVEKIT HOOK - Connect to Voice AI Agent
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to connect to LiveKit voice agent
 * @param {string} livekitUrl - LiveKit server URL
 * @param {Function} getToken - Function to get auth token
 */
const useLiveKit = (livekitUrl, getToken) => {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState(null);
    
    const roomRef = useRef(null);
    const audioElementsRef = useRef([]);

    /**
     * Connect to LiveKit room
     */
    const connect = useCallback(async () => {
        if (connected || connecting) return;
        
        setConnecting(true);
        setError(null);
        
        try {
            // Dynamically import LiveKit client
            const LivekitClient = await import('livekit-client');
            
            const token = await getToken();
            const room = new LivekitClient.Room();
            
            // Handle audio tracks from AI agent
            room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === 'audio') {
                    const audioEl = track.attach();
                    audioEl.play();
                    document.body.appendChild(audioEl);
                    audioElementsRef.current.push(audioEl);
                }
            });
            
            // Handle track unsubscribe
            room.on(LivekitClient.RoomEvent.TrackUnsubscribed, (track) => {
                track.detach().forEach(el => el.remove());
            });
            
            // Handle data messages from agent
            room.on(LivekitClient.RoomEvent.DataReceived, (payload, participant) => {
                try {
                    const data = JSON.parse(new TextDecoder().decode(payload));
                    handleAgentMessage(data);
                } catch (e) {
                    console.error("Error parsing agent message:", e);
                }
            });
            
            // Handle speaking state
            room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged, (speakers) => {
                const agentSpeaking = speakers.some(s => s.identity?.includes('agent'));
                setAiSpeaking(agentSpeaking);
            });
            
            // Connect to room
            await room.connect(livekitUrl, token);
            roomRef.current = room;
            
            // Enable microphone
            await room.localParticipant.setMicrophoneEnabled(true);
            
            setConnected(true);
            setTranscript("Connected! Say 'I want to do push ups' to start.");
            
        } catch (err) {
            console.error("LiveKit connection failed:", err);
            setError(err.message);
            setTranscript("Connection failed. Check your configuration.");
        } finally {
            setConnecting(false);
        }
    }, [livekitUrl, getToken, connected, connecting]);

    /**
     * Handle messages from the voice agent
     */
    const handleAgentMessage = useCallback((data) => {
        switch (data.type) {
            case 'transcript':
                setTranscript(data.text);
                break;
            case 'speaking_start':
                setAiSpeaking(true);
                break;
            case 'speaking_end':
                setAiSpeaking(false);
                break;
            case 'exercise_start':
                // Agent wants to start an exercise - trigger in parent
                if (data.onExerciseStart) {
                    data.onExerciseStart(data.exerciseId);
                }
                break;
            case 'exercise_end':
                if (data.onExerciseEnd) {
                    data.onExerciseEnd();
                }
                break;
        }
    }, []);

    /**
     * Send pose data to the agent
     */
    const sendPoseData = useCallback((data) => {
        if (!roomRef.current || !connected) return;
        
        try {
            const encoder = new TextEncoder();
            const payload = encoder.encode(JSON.stringify(data));
            roomRef.current.localParticipant.publishData(payload, { reliable: true });
        } catch (err) {
            console.error("Error sending pose data:", err);
        }
    }, [connected]);

    /**
     * Send exercise selection to agent
     */
    const sendExerciseSelected = useCallback((exerciseId) => {
        sendPoseData({
            type: 'exercise_selected',
            exerciseId
        });
    }, [sendPoseData]);

    /**
     * Send rep count to agent
     */
    const sendRepCounted = useCallback((reps) => {
        sendPoseData({
            type: 'rep_counted',
            reps
        });
    }, [sendPoseData]);

    /**
     * Send form update to agent
     */
    const sendFormUpdate = useCallback((formData) => {
        sendPoseData({
            type: 'pose_update',
            ...formData
        });
    }, [sendPoseData]);

    /**
     * Disconnect from LiveKit
     */
    const disconnect = useCallback(() => {
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
        
        // Clean up audio elements
        audioElementsRef.current.forEach(el => el.remove());
        audioElementsRef.current = [];
        
        setConnected(false);
        setAiSpeaking(false);
        setTranscript("Disconnected. Click to reconnect.");
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        connected,
        connecting,
        aiSpeaking,
        transcript,
        error,
        connect,
        disconnect,
        sendPoseData,
        sendExerciseSelected,
        sendRepCounted,
        sendFormUpdate
    };
};

export default useLiveKit;