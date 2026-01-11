// ============================================================
// APP - Main Application with Voice AI Integration
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BrowseView from './components/BrowseView';
import AnalyzeView from './components/AnalyzeView';
import VoiceAgent from './components/VoiceAgent';
import useLiveKit from './hooks/useLiveKit';
import { getExerciseById } from './data/exercises';

// ============================================================
// CONFIGURATION - Update these for your setup
// ============================================================

const LIVEKIT_URL = "wss://your-project.livekit.cloud"; // Replace with your LiveKit URL

// Token fetcher - In production, fetch from your backend
const getToken = async () => {
    // Option 1: Fetch from your backend
    // const response = await fetch('/api/livekit-token');
    // return await response.text();
    
    // Option 2: For development, you can generate tokens using lk cli:
    // lk token create --room formfit --identity user --api-key <key> --api-secret <secret>
    return "YOUR_TOKEN_HERE";
};

// ============================================================
// APP COMPONENT
// ============================================================

const App = () => {
    // View State
    const [view, setView] = useState('browse'); // 'browse' | 'analyze'
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [category, setCategory] = useState('All');
    const [totalReps, setTotalReps] = useState(0);
    
    // LiveKit Voice Agent
    const {
        connected,
        connecting,
        aiSpeaking,
        transcript,
        connect,
        disconnect,
        sendExerciseSelected,
        sendRepCounted,
        sendFormUpdate
    } = useLiveKit(LIVEKIT_URL, getToken);

    // ============================================================
    // HANDLERS
    // ============================================================

    /**
     * Handle exercise selection (from UI or voice command)
     */
    const handleSelectExercise = useCallback((exercise) => {
        setSelectedExercise(exercise);
        setView('analyze');
        
        // Notify voice agent
        if (connected) {
            sendExerciseSelected(exercise.id);
        }
    }, [connected, sendExerciseSelected]);

    /**
     * Handle going back to browse view
     */
    const handleBack = useCallback(() => {
        setView('browse');
        setSelectedExercise(null);
    }, []);

    /**
     * Handle rep counted
     */
    const handleRep = useCallback(() => {
        setTotalReps(prev => {
            const newTotal = prev + 1;
            
            // Notify voice agent
            if (connected) {
                sendRepCounted(newTotal);
            }
            
            return newTotal;
        });
    }, [connected, sendRepCounted]);

    /**
     * Handle form update from pose detection
     */
    const handleFormUpdate = useCallback((formData) => {
        if (connected) {
            sendFormUpdate(formData);
        }
    }, [connected, sendFormUpdate]);

    /**
     * Handle voice command to start exercise
     * This would be triggered by the agent via data channel
     */
    const handleVoiceExerciseStart = useCallback((exerciseId) => {
        const exercise = getExerciseById(exerciseId);
        if (exercise) {
            handleSelectExercise(exercise);
        }
    }, [handleSelectExercise]);

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="app">
            <Header totalReps={totalReps} connected={connected} />

            <main className="main">
                {view === 'browse' ? (
                    <div className="browse-layout">
                        {/* Main Content */}
                        <div className="browse-content">
                            <BrowseView
                                category={category}
                                setCategory={setCategory}
                                onSelectExercise={handleSelectExercise}
                            />
                        </div>
                        
                        {/* Voice Agent Sidebar */}
                        <div className="voice-sidebar">
                            <VoiceAgent
                                connected={connected}
                                connecting={connecting}
                                aiSpeaking={aiSpeaking}
                                transcript={transcript}
                                onConnect={connect}
                                onDisconnect={disconnect}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="analyze-layout">
                        <AnalyzeView
                            exercise={selectedExercise}
                            onBack={handleBack}
                            onRep={handleRep}
                            onFormUpdate={handleFormUpdate}
                            voiceConnected={connected}
                            aiSpeaking={aiSpeaking}
                            transcript={transcript}
                        />
                        
                        {/* Voice Agent Panel */}
                        <div className="voice-panel-fixed">
                            <VoiceAgent
                                connected={connected}
                                connecting={connecting}
                                aiSpeaking={aiSpeaking}
                                transcript={transcript}
                                onConnect={connect}
                                onDisconnect={disconnect}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;