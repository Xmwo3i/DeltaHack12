// ============================================================
// VOICE BANNER COMPONENT
// ============================================================

import React from 'react';

const VoiceBanner = ({ voiceOn, setVoiceOn, speaking }) => {
    return (
        <div className="voice-banner">
            <div className={`voice-avatar ${speaking ? 'speaking' : ''}`}>
                🤖
            </div>
            <div className="voice-info">
                <div className="voice-title">AI Voice Coach</div>
                <div className="voice-status">
                    {voiceOn ? "Ready to guide your workout" : "Voice disabled"}
                </div>
            </div>
            <button 
                className={`btn ${voiceOn ? 'btn-purple' : 'btn-secondary'}`} 
                onClick={() => setVoiceOn(!voiceOn)}
            >
                {voiceOn ? '🔊 On' : '🔇 Off'}
            </button>
        </div>
    );
};

export default VoiceBanner;