// ============================================================
// HEADER COMPONENT
// ============================================================

import React from 'react';

const Header = ({ totalReps }) => {
    return (
        <header className="header">
            <div className="logo">
                💪 Form<span>Fit</span> AI
            </div>
            <div className="header-right">
                <div className="stat">
                    <div className="stat-value">{totalReps}</div>
                    <div className="stat-label">Total Reps</div>
                </div>
            </div>
        </header>
    );
};

export default Header;