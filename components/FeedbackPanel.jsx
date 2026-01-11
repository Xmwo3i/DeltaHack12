// ============================================================
// FEEDBACK PANEL COMPONENT - Updated for Python-style errors
// ============================================================

import React from 'react';

const FeedbackPanel = ({ errors, isMoving }) => {
    return (
        <div className="panel-card">
            <div className="panel-title">💬 Form Feedback</div>
            
            {!isMoving ? (
                <div className="feedback-item warning">
                    <span className="feedback-icon">⏳</span>
                    <span>Start exercising to get feedback</span>
                </div>
            ) : errors.length === 0 ? (
                <div className="feedback-item good">
                    <span className="feedback-icon">✓</span>
                    <span>Great form! Keep it up!</span>
                </div>
            ) : (
                errors.map((error, index) => (
                    <div key={index} className="feedback-item bad">
                        <span className="feedback-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                ))
            )}
        </div>
    );
};

export default FeedbackPanel;