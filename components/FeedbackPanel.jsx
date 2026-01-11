// ============================================================
// FEEDBACK PANEL COMPONENT
// ============================================================

import React from 'react';

const FeedbackPanel = ({ feedback }) => {
    return (
        <div className="panel-card">
            <div className="panel-title">Feedback</div>
            {feedback.length === 0 ? (
                <div className="feedback-item good">
                    <span className="feedback-icon">✓</span>
                    <span>Great form!</span>
                </div>
            ) : (
                feedback.map((item, index) => (
                    <div key={index} className="feedback-item bad">
                        <span className="feedback-icon">!</span>
                        <span>{item}</span>
                    </div>
                ))
            )}
        </div>
    );
};

export default FeedbackPanel;