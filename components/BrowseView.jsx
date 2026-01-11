// ============================================================
// BROWSE VIEW - Exercise Selection Page
// ============================================================

import React from 'react';
import VoiceBanner from '../components/VoiceBanner';
import CategoryTabs from '../components/CategoryTabs';
import ExerciseGrid from '../components/ExerciseGrid';
import { CATEGORIES, getExercisesByCategory } from '../data/exercises';

const BrowseView = ({ 
    category, 
    setCategory, 
    onSelectExercise, 
    voiceOn, 
    setVoiceOn, 
    speaking 
}) => {
    const exercises = getExercisesByCategory(category);

    return (
        <>
            <VoiceBanner 
                voiceOn={voiceOn} 
                setVoiceOn={setVoiceOn} 
                speaking={speaking} 
            />

            <div className="page-title">
                <h1>Choose Exercise</h1>
                <p>Select an exercise for AI form analysis with voice coaching</p>
            </div>

            <CategoryTabs 
                categories={CATEGORIES} 
                activeCategory={category} 
                onCategoryChange={setCategory} 
            />

            <ExerciseGrid 
                exercises={exercises} 
                onSelectExercise={onSelectExercise} 
            />
        </>
    );
};

export default BrowseView;