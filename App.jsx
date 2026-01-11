// ============================================================
// APP - Main Application Component
// ============================================================

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BrowseView from './components/BrowseView';
import AnalyzeView from './components/AnalyzeView';
import voiceCoach from './utils/VoiceCoach';

const App = () => {
    // App State
    const [view, setView] = useState('browse'); // 'browse' | 'analyze'
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [category, setCategory] = useState('All');
    const [totalReps, setTotalReps] = useState(0);
    
    // Voice Coach State
    const [voiceOn, setVoiceOn] = useState(true);
    const [speaking, setSpeaking] = useState(false);
    const [coachMsg, setCoachMsg] = useState("");

    // Initialize voice coach callbacks
    useEffect(() => {
        voiceCoach.onChange = (isSpeaking, message) => {
            setSpeaking(isSpeaking);
            setCoachMsg(message);
        };
    }, []);

    // Update voice coach enabled state
    useEffect(() => {
        voiceCoach.setEnabled(voiceOn);
    }, [voiceOn]);

    // Handlers
    const handleSelectExercise = (exercise) => {
        setSelectedExercise(exercise);
        setView('analyze');
    };

    const handleBack = () => {
        setView('browse');
        setSelectedExercise(null);
    };

    const handleRep = () => {
        setTotalReps(prev => prev + 1);
    };

    return (
        <div className="app">
            <Header totalReps={totalReps} />

            <main className="main">
                {view === 'browse' ? (
                    <BrowseView
                        category={category}
                        setCategory={setCategory}
                        onSelectExercise={handleSelectExercise}
                        voiceOn={voiceOn}
                        setVoiceOn={setVoiceOn}
                        speaking={speaking}
                    />
                ) : (
                    <AnalyzeView
                        exercise={selectedExercise}
                        onBack={handleBack}
                        onRep={handleRep}
                        voiceOn={voiceOn}
                        setVoiceOn={setVoiceOn}
                        speaking={speaking}
                        coachMsg={coachMsg}
                    />
                )}
            </main>
        </div>
    );
};

export default App;