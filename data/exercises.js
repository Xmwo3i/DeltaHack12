// ============================================================
// EXERCISE DATABASE
// ============================================================

import {
    checkShoulderPressForm,
    checkSquatForm,
    checkBicepCurlForm,
    checkPushUpForm,
    checkLungeForm,
    checkLateralRaiseForm
} from '../utils/poseUtils';

const EXERCISES = [
    {
        id: "shoulder_press",
        name: "Shoulder Press",
        category: "Shoulders",
        difficulty: "Beginner",
        gif: "https://media1.tenor.com/m/gI-8qCUEko8AAAAC/shoulders-workout.gif",
        muscles: ["Deltoids", "Triceps"],
        description: "Press weights overhead to build shoulders",
        checkForm: checkShoulderPressForm,
        phaseOrder: ["DOWN", "UP"],
        movementThreshold: 25,
        tips: [
            "Feet shoulder-width apart",
            "Weights at shoulder height",
            "Press straight up",
            "Lower with control"
        ]
    },
    {
        id: "squat",
        name: "Squat",
        category: "Legs",
        difficulty: "Intermediate",
        gif: "https://media1.tenor.com/m/ReGdjrNPi-8AAAAC/squat.gif",
        muscles: ["Quads", "Glutes"],
        description: "King of leg exercises for lower body strength",
        checkForm: checkSquatForm,
        phaseOrder: ["STANDING", "BOTTOM"],
        movementThreshold: 30,
        tips: [
            "Feet shoulder-width apart",
            "Keep chest up",
            "Thighs parallel to ground",
            "Drive through heels"
        ]
    },
    {
        id: "bicep_curl",
        name: "Bicep Curl",
        category: "Arms",
        difficulty: "Beginner",
        gif: "https://media1.tenor.com/m/bnaCLz-vfj4AAAAC/bicep-curls-exercise.gif",
        muscles: ["Biceps"],
        description: "Isolate and build your biceps",
        checkForm: checkBicepCurlForm,
        phaseOrder: ["DOWN", "UP"],
        movementThreshold: 40,
        tips: [
            "Arms at sides",
            "Elbows pinned to body",
            "Curl to shoulders",
            "Lower slowly"
        ]
    },
    {
        id: "push_up",
        name: "Push Up",
        category: "Chest",
        difficulty: "Beginner",
        gif: "https://media1.tenor.com/m/pyjEpw7tVD0AAAAC/pushups-push-up.gif",
        muscles: ["Chest", "Triceps"],
        description: "Classic upper body pushing exercise",
        checkForm: checkPushUpForm,
        phaseOrder: ["UP", "DOWN"],
        movementThreshold: 30,
        tips: [
            "Hands wider than shoulders",
            "Body in straight line",
            "Chest to ground",
            "Push up fully"
        ]
    },
    {
        id: "lunge",
        name: "Lunge",
        category: "Legs",
        difficulty: "Beginner",
        gif: "https://media1.tenor.com/m/5i0VeuJQkxkAAAAd/lunges.gif",
        muscles: ["Quads", "Glutes"],
        description: "Build unilateral leg strength",
        checkForm: checkLungeForm,
        phaseOrder: ["STANDING", "DOWN"],
        movementThreshold: 30,
        tips: [
            "Step forward",
            "Both knees at 90°",
            "Front knee over ankle",
            "Push back up"
        ]
    },
    {
        id: "lateral_raise",
        name: "Lateral Raise",
        category: "Shoulders",
        difficulty: "Beginner",
        gif: "https://media1.tenor.com/m/m7PBpjXCkG4AAAAC/lateral-raise.gif",
        muscles: ["Side Delts"],
        description: "Isolate side delts for wider shoulders",
        checkForm: checkLateralRaiseForm,
        phaseOrder: ["DOWN", "UP"],
        movementThreshold: 25,
        tips: [
            "Dumbbells at sides",
            "Slight elbow bend",
            "Raise to shoulder height",
            "Lower with control"
        ]
    }
];

export const CATEGORIES = ['All', 'Shoulders', 'Chest', 'Arms', 'Legs'];

export const getExercisesByCategory = (category) => {
    if (category === 'All') return EXERCISES;
    return EXERCISES.filter(ex => ex.category === category);
};

export const getExerciseById = (id) => {
    return EXERCISES.find(ex => ex.id === id);
};

export default EXERCISES;