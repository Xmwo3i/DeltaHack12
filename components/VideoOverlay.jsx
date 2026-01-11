// ============================================================
// VIDEO OVERLAY COMPONENT - Updated for Python-style form checking
// ============================================================

import React from 'react';

const VideoOverlay = ({ 
    fps, 
    isCorrect, 
    errors, 
    angles, 
    phase, 
    reps, 
    isMoving, 
    speaking, 
    coachMsg 
}) => {
    return (
        <div className="overlay">
            {/* FPS Counter */}
            <div className="fps-counter">{fps} FPS</div>
            
            {/* Form Status (replaces accuracy) */}
            <div className="stat-box form-status-box">
                <div className="label">{isMoving ? 'Form' : 'Status'}</div>
                <div className={`value ${isMoving ? (isCorrect ? 'good' : 'bad') : ''}`}>
                    {!isMoving ? 'Start Moving' : isCorrect ? 'GOOD!' : 'FIX FORM'}
                </div>
            </div>

            {/* Angles Display */}
            <div className="stat-box angles-box">
                <div className="label">Angles</div>
                <div className="value angles-value">
                    L: {Math.round(angles?.left || 0)}° | R: {Math.round(angles?.right || 0)}°
                </div>
                <div className="phase-value">Phase: {phase}</div>
            </div>

            {/* Rep Counter */}
            <div className="stat-box rep-box">
                <div className="label">Reps</div>
                <div className="value">{reps}</div>
            </div>

            {/* Coach Message */}
            <div className={`coach-box ${speaking ? 'speaking' : ''}`}>
                <div className="coach-avatar-sm">🤖</div>
                <div className="coach-msg">
                    {coachMsg || (isMoving 
                        ? (isCorrect ? "Great form!" : errors?.[0] || "Check your form") 
                        : "Start exercising!"
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoOverlay;