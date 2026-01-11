// ============================================================
// VOICE AGENT COMPONENT - LiveKit Voice AI Integration
// ============================================================

import React from 'react';

const VoiceAgent = ({ 
    connected, 
    connecting, 
    aiSpeaking, 
    transcript, 
    onConnect, 
    onDisconnect 
}) => {
    return (
        <div className="panel-card voice-ai-card">
            <div className="panel-title">🤖 AI Voice Coach</div>
            
            {/* AI Avatar */}
            <div className={`ai-avatar ${aiSpeaking ? 'speaking' : connected ? 'listening' : ''}`}>
                {aiSpeaking ? '🗣️' : connected ? '🎤' : '🤖'}
            </div>
            
            {/* Status */}
            <div className="ai-status">
                <div className={`ai-status-text ${connected ? 'active' : ''}`}>
                    {connecting ? '🔄 Connecting...' : 
                     aiSpeaking ? '🔊 Speaking...' : 
                     connected ? '🎤 Listening...' : 
                     '⭕ Not connected'}
                </div>
            </div>
            
            {/* Transcript */}
            <div className="ai-transcript">
                <div className="transcript-label">AI Coach</div>
                <div className="transcript-text">{transcript}</div>
            </div>
            
            {/* Voice Commands Hints */}
            {connected && (
                <div className="voice-hints">
                    <span className="hint">"Do push ups"</span>
                    <span className="hint">"Let's squat"</span>
                    <span className="hint">"How's my form?"</span>
                    <span className="hint">"Stop"</span>
                </div>
            )}
            
            {/* Connect/Disconnect Button */}
            <div style={{ marginTop: '16px' }}>
                {!connected ? (
                    <button 
                        className="btn btn-purple btn-full"
                        onClick={onConnect}
                        disabled={connecting}
                    >
                        {connecting ? '🔄 Connecting...' : '🎤 Connect to AI Coach'}
                    </button>
                ) : (
                    <button 
                        className="btn btn-danger btn-full"
                        onClick={onDisconnect}
                    >
                        Disconnect
                    </button>
                )}
            </div>
        </div>
    );
};

export default VoiceAgent;