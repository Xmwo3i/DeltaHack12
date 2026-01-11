// ============================================================
// VIDEO OVERLAY COMPONENT
// ============================================================

import React from 'react';

const VideoOverlay = ({ fps, accuracy, phase, reps, speaking, coachMsg }) => {
    const getAccuracyClass = () => {
        if (accuracy > 70) return 'good';
        if (accuracy > 40) return 'ok';
        return 'bad';
    };

    return (
        <div className="overlay">
            {/* FPS Counter */}
            <div className="fps-counter">{fps} FPS</div>
            
            {/* Accuracy Display */}
            <div className="stat-box accuracy-box">
                <div className="label">Accuracy</div>
                <div className={`value ${getAccuracyClass()}`}>{accuracy}%</div>
            </div>

            {/* Phase Display */}
            <div className="stat-box phase-box">
                <div className="label">Phase</div>
                <div className="value">{phase}</div>
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
                    {coachMsg || (accuracy > 70 ? "Great form!" : "Focus on form")}
                </div>
            </div>
        </div>
    );
};

export default VideoOverlay;