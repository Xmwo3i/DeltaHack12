// ============================================================
// EXERCISE PREVIEW COMPONENT
// ============================================================

import React from 'react';

const ExercisePreview = ({ exercise }) => {
    return (
        <div className="panel-card">
            <img 
                src={exercise.gif} 
                alt={exercise.name} 
                className="preview-img" 
            />
            <div className="preview-name">{exercise.name}</div>
            <div className="preview-cat">{exercise.category}</div>
        </div>
    );
};

export default ExercisePreview;