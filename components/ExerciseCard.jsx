// ============================================================
// EXERCISE CARD COMPONENT
// ============================================================

import React from 'react';

const ExerciseCard = ({ exercise, onClick }) => {
    return (
        <div className="card" onClick={onClick}>
            <div className="card-img">
                <img 
                    src={exercise.gif} 
                    alt={exercise.name} 
                    loading="lazy" 
                />
            </div>
            <div className="card-body">
                <div className="card-category">{exercise.category}</div>
                <div className="card-title">{exercise.name}</div>
                <div className="card-desc">{exercise.description}</div>
                <div className="card-muscles">
                    {exercise.muscles.map(muscle => (
                        <span key={muscle} className="muscle-tag">{muscle}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExerciseCard;