// ============================================================
// ANALYZE VIEW - Exercise Analysis Page (Updated)
// ============================================================

import React from 'react';
import VideoOverlay from './VideoOverlay';
import ExercisePreview from './ExercisePreview';
import VoiceSettings from './VoiceSettings';
import FeedbackPanel from './FeedbackPanel';
import InstructionsPanel from './InstructionsPanel';
import Loading from './Loading';
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
        isCorrect,
        errors,
        angles,
        phase,
        reps,
        isMoving,
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
                            isCorrect={isCorrect}
                            errors={errors}
                            angles={angles}
                            phase={phase}
                            reps={reps}
                            isMoving={isMoving}
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
                    
                    <FeedbackPanel 
                        errors={errors} 
                        isMoving={isMoving} 
                    />
                    
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