// ============================================================
// LOADING COMPONENT
// ============================================================

import React from 'react';

const Loading = ({ message = "Loading..." }) => {
    return (
        <div className="loading">
            <div className="loading-icon"></div>
            <div>{message}</div>
        </div>
    );
};

export default Loading;