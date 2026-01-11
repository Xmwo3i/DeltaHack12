// ============================================================
// INSTRUCTIONS PANEL COMPONENT
// ============================================================

import React from 'react';

const InstructionsPanel = ({ tips }) => {
    return (
        <div className="panel-card">
            <div className="panel-title">Tips</div>
            {tips.map((tip, index) => (
                <div key={index} className="instruction">
                    <div className="instruction-num">{index + 1}</div>
                    <div className="instruction-text">{tip}</div>
                </div>
            ))}
        </div>
    );
};

export default InstructionsPanel;