// ============================================================
// EXERCISE DATABASE
// ============================================================

const EXERCISES = [
    {
        id: "shoulder_press",
        name: "Shoulder Press",
        category: "Shoulders",
        difficulty: "Beginner",
        gif: "https://media1.tenor.com/m/gI-8qCUEko8AAAAC/shoulders-workout.gif",
        muscles: ["Deltoids", "Triceps"],
        description: "Press weights overhead to build shoulders",
        phases: {
            DOWN: { left_elbow: [70, 120], right_elbow: [70, 120] },
            UP: { left_elbow: [150, 180], right_elbow: [150, 180] }
        },
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
        phases: {
            STANDING: { left_knee: [160, 180], right_knee: [160, 180] },
            BOTTOM: { left_knee: [70, 110], right_knee: [70, 110] }
        },
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
        phases: {
            DOWN: { left_elbow: [150, 180], right_elbow: [150, 180] },
            UP: { left_elbow: [30, 70], right_elbow: [30, 70] }
        },
        tips: [
            "Arms at sides",
            "Elbows pinned to body",
            "Curl to shoulders",
            "Lower slowly"
        ]
    },
    {
        id: "pushup",
        name: "Push Up",
        category: "Chest",
        difficulty: "Beginner",
        gif: "https://media1.tenor.com/m/pyjEpw7tVD0AAAAC/pushups-push-up.gif",
        muscles: ["Chest", "Triceps"],
        description: "Classic upper body pushing exercise",
        phases: {
            UP: { left_elbow: [160, 180], right_elbow: [160, 180] },
            DOWN: { left_elbow: [70, 110], right_elbow: [70, 110] }
        },
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
        phases: {
            STANDING: { left_knee: [150, 180], right_knee: [150, 180] },
            DOWN: { left_knee: [80, 120], right_knee: [80, 120] }
        },
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
        phases: {
            DOWN: { left_arm_raise: [0, 40], right_arm_raise: [0, 40] },
            UP: { left_arm_raise: [70, 110], right_arm_raise: [70, 110] }
        },
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