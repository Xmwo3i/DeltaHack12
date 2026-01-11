// ============================================================
// VOICE SETTINGS COMPONENT
// ============================================================

import React from 'react';

const VoiceSettings = ({ voiceOn, setVoiceOn }) => {
    return (
        <div className="panel-card">
            <div className="panel-title">🎤 Voice Coach</div>
            <div className="toggle-row">
                <span>Voice Feedback</span>
                <div 
                    className={`toggle ${voiceOn ? 'on' : ''}`} 
                    onClick={() => setVoiceOn(!voiceOn)}
                />
            </div>
        </div>
    );
};

export default VoiceSettings;