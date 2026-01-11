// ============================================================
// POSE UTILS - Angle Calculations for Pose Analysis
// ============================================================

/**
 * Calculate angle between three points (in degrees)
 * @param {Object} a - First point {x, y}
 * @param {Object} b - Middle point (vertex) {x, y}
 * @param {Object} c - Third point {x, y}
 * @returns {number} Angle in degrees
 */
export const calculateAngle = (a, b, c) => {
    const v1x = a.x - b.x;
    const v1y = a.y - b.y;
    const v2x = c.x - b.x;
    const v2y = c.y - b.y;
    
    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
    
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2 + 0.001)));
    return Math.acos(cosAngle) * 57.2958; // Convert to degrees
};

/**
 * Extract all relevant angles from pose landmarks
 * @param {Array} landmarks - MediaPipe pose landmarks
 * @returns {Object|null} Object with all calculated angles
 */
export const getAngles = (landmarks) => {
    if (!landmarks || landmarks.length < 29) return null;
    
    return {
        left_elbow: calculateAngle(landmarks[11], landmarks[13], landmarks[15]),
        right_elbow: calculateAngle(landmarks[12], landmarks[14], landmarks[16]),
        left_knee: calculateAngle(landmarks[23], landmarks[25], landmarks[27]),
        right_knee: calculateAngle(landmarks[24], landmarks[26], landmarks[28]),
        left_hip: calculateAngle(landmarks[11], landmarks[23], landmarks[25]),
        right_hip: calculateAngle(landmarks[12], landmarks[24], landmarks[26]),
        left_arm_raise: calculateAngle(landmarks[23], landmarks[11], landmarks[13]),
        right_arm_raise: calculateAngle(landmarks[24], landmarks[12], landmarks[14])
    };
};

/**
 * Evaluate form accuracy against exercise phases
 * @param {Object} angles - Current pose angles
 * @param {Object} exercise - Exercise definition with phases
 * @returns {Object} { accuracy, phase, feedback }
 */
export const evaluateForm = (angles, exercise) => {
    let bestPhase = 'TRANSITION';
    let bestScore = 0;
    const feedback = [];

    for (const [phaseName, phaseAngles] of Object.entries(exercise.phases)) {
        let score = 0;
        let total = 0;

        for (const [angleName, [min, max]] of Object.entries(phaseAngles)) {
            if (angles[angleName] !== undefined) {
                total++;
                const value = angles[angleName];
                
                if (value >= min && value <= max) {
                    score += 100;
                } else {
                    const diff = value < min ? min - value : value - max;
                    score += Math.max(0, 100 - diff * 2.5);
                    
                    if (diff > 15) {
                        const action = value < min ? 'extend' : 'bend';
                        feedback.push(`${angleName.replace(/_/g, ' ')}: ${action} more`);
                    }
                }
            }
        }

        const phaseScore = total > 0 ? score / total : 0;
        if (phaseScore > bestScore) {
            bestScore = phaseScore;
            bestPhase = phaseName;
        }
    }

    return {
        accuracy: bestScore,
        phase: bestPhase,
        feedback: [...new Set(feedback)].slice(0, 2)
    };
};

/**
 * Skeleton connection pairs for drawing
 */
export const SKELETON_CONNECTIONS = [
    [11, 12], // Shoulders
    [11, 13], [13, 15], // Left arm
    [12, 14], [14, 16], // Right arm
    [11, 23], [12, 24], // Torso
    [23, 24], // Hips
    [23, 25], [25, 27], // Left leg
    [24, 26], [26, 28]  // Right leg
];

/**
 * Draw skeleton on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} landmarks - Pose landmarks
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} color - Skeleton color
 */
export const drawSkeleton = (ctx, landmarks, width, height, color) => {
    // Draw connections
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    SKELETON_CONNECTIONS.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(landmarks[a].x * width, landmarks[a].y * height);
        ctx.lineTo(landmarks[b].x * width, landmarks[b].y * height);
        ctx.stroke();
    });

    // Draw joints
    ctx.fillStyle = color;
    for (let i = 11; i < 29; i++) {
        ctx.beginPath();
        ctx.arc(landmarks[i].x * width, landmarks[i].y * height, 5, 0, Math.PI * 2);
        ctx.fill();
    }
};

/**
 * Get color based on accuracy
 * @param {number} accuracy - Accuracy percentage
 * @returns {string} Color hex code
 */
export const getAccuracyColor = (accuracy) => {
    if (accuracy > 70) return '#00ff87';
    if (accuracy > 40) return '#00d4ff';
    return '#ff3860';
};