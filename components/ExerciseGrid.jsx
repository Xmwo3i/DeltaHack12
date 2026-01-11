// ============================================================
// EXERCISE GRID COMPONENT
// ============================================================

import React from 'react';
import ExerciseCard from './ExerciseCard';

const ExerciseGrid = ({ exercises, onSelectExercise }) => {
    return (
        <div className="grid">
            {exercises.map(exercise => (
                <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => onSelectExercise(exercise)}
                />
            ))}
        </div>
    );
};

export default ExerciseGrid;