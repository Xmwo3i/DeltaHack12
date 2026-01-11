// ============================================================
// POSE UTILS - Converted from Python combined.py
// ============================================================

// Landmark indices (same as Python)
export const LANDMARKS = {
    LEFT_SHOULDER: 11,
    LEFT_ELBOW: 13,
    LEFT_WRIST: 15,
    RIGHT_SHOULDER: 12,
    RIGHT_ELBOW: 14,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28
};

/**
 * Calculate angle between three points (same as Python version)
 * Uses numpy-style vector math
 * @param {Array} a - First point [x, y]
 * @param {Array} b - Middle point (vertex) [x, y]
 * @param {Array} c - Third point [x, y]
 * @returns {number} Angle in degrees
 */
export const calculateAngle = (a, b, c) => {
    // Convert to vectors
    const ba = [a[0] - b[0], a[1] - b[1]];
    const bc = [c[0] - b[0], c[1] - b[1]];
    
    // Dot product
    const dotProduct = ba[0] * bc[0] + ba[1] * bc[1];
    
    // Magnitudes
    const magnitudeBA = Math.sqrt(ba[0] * ba[0] + ba[1] * ba[1]);
    const magnitudeBC = Math.sqrt(bc[0] * bc[0] + bc[1] * bc[1]);
    
    // Cosine of angle (with safety for division)
    const cosineAngle = dotProduct / (magnitudeBA * magnitudeBC + 0.0001);
    
    // Clamp to [-1, 1] and convert to degrees
    const clampedCosine = Math.max(-1, Math.min(1, cosineAngle));
    const angleRadians = Math.acos(clampedCosine);
    const angleDegrees = angleRadians * (180 / Math.PI);
    
    return angleDegrees;
};

/**
 * Get landmark coordinates as [x, y] array
 * @param {Array} landmarks - MediaPipe landmarks array
 * @param {number} index - Landmark index
 * @returns {Array|null} [x, y] or null if not found
 */
export const getLandmarkCoords = (landmarks, index) => {
    if (!landmarks || index >= landmarks.length) return null;
    return [landmarks[index].x, landmarks[index].y];
};

// ============================================================
// FORM CHECKERS (Converted from Python)
// ============================================================

/**
 * Check Shoulder Press form (from Python check_shoulder_press_form)
 * @param {Array} landmarks - MediaPipe pose landmarks
 * @returns {Object} { isCorrect, errors, angles, phase }
 */
export const checkShoulderPressForm = (landmarks) => {
    const leftShoulder = getLandmarkCoords(landmarks, LANDMARKS.LEFT_SHOULDER);
    const leftElbow = getLandmarkCoords(landmarks, LANDMARKS.LEFT_ELBOW);
    const leftWrist = getLandmarkCoords(landmarks, LANDMARKS.LEFT_WRIST);
    
    const rightShoulder = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_SHOULDER);
    const rightElbow = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_ELBOW);
    const rightWrist = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_WRIST);
    
    if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist) {
        return { isCorrect: false, errors: ["Can't see all joints"], angles: { left: 0, right: 0 }, phase: 'UNKNOWN' };
    }
    
    // Calculate elbow angles (same as Python)
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    
    const errors = [];
    
    // Symmetry check - both arms should move evenly (from Python)
    if (Math.abs(leftElbowAngle - rightElbowAngle) > 20) {
        errors.push("Keep arms moving evenly");
    }
    
    // Elbow-over-wrist check (important for safety) (from Python)
    const lw_x = leftWrist[0];
    const le_x = leftElbow[0];
    const rw_x = rightWrist[0];
    const re_x = rightElbow[0];
    
    if (Math.abs(le_x - lw_x) > 0.05 || Math.abs(re_x - rw_x) > 0.05) {
        errors.push("Stack wrists under elbows");
    }
    
    // Phase detection
    let phase = "TRANSITION";
    const avgAngle = (leftElbowAngle + rightElbowAngle) / 2;
    if (avgAngle > 150) phase = "UP";
    else if (avgAngle < 100) phase = "DOWN";
    
    return {
        isCorrect: errors.length === 0,
        errors,
        angles: { left: leftElbowAngle, right: rightElbowAngle },
        phase
    };
};

/**
 * Check Squat form
 */
export const checkSquatForm = (landmarks) => {
    const leftHip = getLandmarkCoords(landmarks, LANDMARKS.LEFT_HIP);
    const leftKnee = getLandmarkCoords(landmarks, LANDMARKS.LEFT_KNEE);
    const leftAnkle = getLandmarkCoords(landmarks, LANDMARKS.LEFT_ANKLE);
    
    const rightHip = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_HIP);
    const rightKnee = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_KNEE);
    const rightAnkle = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_ANKLE);
    
    if (!leftHip || !leftKnee || !leftAnkle || !rightHip || !rightKnee || !rightAnkle) {
        return { isCorrect: false, errors: ["Can't see legs"], angles: { left: 0, right: 0 }, phase: 'UNKNOWN' };
    }
    
    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    
    const errors = [];
    
    // Symmetry check
    if (Math.abs(leftKneeAngle - rightKneeAngle) > 15) {
        errors.push("Keep weight even on both legs");
    }
    
    // Knees over toes check
    if (leftKnee[0] > leftAnkle[0] + 0.08 || rightKnee[0] < rightAnkle[0] - 0.08) {
        errors.push("Don't let knees go past toes");
    }
    
    // Depth check
    const avgAngle = (leftKneeAngle + rightKneeAngle) / 2;
    if (avgAngle > 120 && avgAngle < 160) {
        errors.push("Go lower for full range of motion");
    }
    
    // Phase detection
    let phase = "TRANSITION";
    if (avgAngle > 160) phase = "STANDING";
    else if (avgAngle < 110) phase = "BOTTOM";
    
    return {
        isCorrect: errors.length === 0,
        errors,
        angles: { left: leftKneeAngle, right: rightKneeAngle },
        phase
    };
};

/**
 * Check Bicep Curl form
 */
export const checkBicepCurlForm = (landmarks) => {
    const leftShoulder = getLandmarkCoords(landmarks, LANDMARKS.LEFT_SHOULDER);
    const leftElbow = getLandmarkCoords(landmarks, LANDMARKS.LEFT_ELBOW);
    const leftWrist = getLandmarkCoords(landmarks, LANDMARKS.LEFT_WRIST);
    const leftHip = getLandmarkCoords(landmarks, LANDMARKS.LEFT_HIP);
    
    const rightShoulder = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_SHOULDER);
    const rightElbow = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_ELBOW);
    const rightWrist = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_WRIST);
    const rightHip = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_HIP);
    
    if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist) {
        return { isCorrect: false, errors: ["Can't see arms"], angles: { left: 0, right: 0 }, phase: 'UNKNOWN' };
    }
    
    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    
    const errors = [];
    
    // Check if elbows are pinned to sides
    if (leftHip && Math.abs(leftElbow[0] - leftHip[0]) > 0.1) {
        errors.push("Keep left elbow pinned to side");
    }
    if (rightHip && Math.abs(rightElbow[0] - rightHip[0]) > 0.1) {
        errors.push("Keep right elbow pinned to side");
    }
    
    // Symmetry check
    if (Math.abs(leftElbowAngle - rightElbowAngle) > 25) {
        errors.push("Curl both arms evenly");
    }
    
    // Phase detection
    let phase = "TRANSITION";
    const avgAngle = (leftElbowAngle + rightElbowAngle) / 2;
    if (avgAngle > 150) phase = "DOWN";
    else if (avgAngle < 70) phase = "UP";
    
    return {
        isCorrect: errors.length === 0,
        errors,
        angles: { left: leftElbowAngle, right: rightElbowAngle },
        phase
    };
};

/**
 * Check Push Up form
 */
export const checkPushUpForm = (landmarks) => {
    const leftShoulder = getLandmarkCoords(landmarks, LANDMARKS.LEFT_SHOULDER);
    const leftElbow = getLandmarkCoords(landmarks, LANDMARKS.LEFT_ELBOW);
    const leftWrist = getLandmarkCoords(landmarks, LANDMARKS.LEFT_WRIST);
    const leftHip = getLandmarkCoords(landmarks, LANDMARKS.LEFT_HIP);
    const leftAnkle = getLandmarkCoords(landmarks, LANDMARKS.LEFT_ANKLE);
    
    const rightShoulder = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_SHOULDER);
    const rightElbow = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_ELBOW);
    const rightWrist = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_WRIST);
    
    if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist) {
        return { isCorrect: false, errors: ["Can't see upper body"], angles: { left: 0, right: 0 }, phase: 'UNKNOWN' };
    }
    
    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    
    const errors = [];
    
    // Body alignment check
    if (leftHip && leftAnkle) {
        const hipHeight = leftHip[1];
        const shoulderHeight = leftShoulder[1];
        const ankleHeight = leftAnkle[1];
        
        const expectedHipHeight = (shoulderHeight + ankleHeight) / 2;
        if (hipHeight > expectedHipHeight + 0.05) {
            errors.push("Don't let hips sag - engage core");
        } else if (hipHeight < expectedHipHeight - 0.08) {
            errors.push("Don't pike up - straighten body");
        }
    }
    
    // Symmetry check
    if (Math.abs(leftElbowAngle - rightElbowAngle) > 15) {
        errors.push("Push evenly with both arms");
    }
    
    // Phase detection
    let phase = "TRANSITION";
    const avgAngle = (leftElbowAngle + rightElbowAngle) / 2;
    if (avgAngle > 160) phase = "UP";
    else if (avgAngle < 100) phase = "DOWN";
    
    return {
        isCorrect: errors.length === 0,
        errors,
        angles: { left: leftElbowAngle, right: rightElbowAngle },
        phase
    };
};

/**
 * Check Lunge form
 */
export const checkLungeForm = (landmarks) => {
    const leftHip = getLandmarkCoords(landmarks, LANDMARKS.LEFT_HIP);
    const leftKnee = getLandmarkCoords(landmarks, LANDMARKS.LEFT_KNEE);
    const leftAnkle = getLandmarkCoords(landmarks, LANDMARKS.LEFT_ANKLE);
    
    const rightHip = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_HIP);
    const rightKnee = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_KNEE);
    const rightAnkle = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_ANKLE);
    
    if (!leftHip || !leftKnee || !leftAnkle || !rightHip || !rightKnee || !rightAnkle) {
        return { isCorrect: false, errors: ["Can't see legs"], angles: { left: 0, right: 0 }, phase: 'UNKNOWN' };
    }
    
    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    
    const errors = [];
    
    // Front knee over ankle check
    const leftIsFront = leftAnkle[1] > rightAnkle[1];
    const frontKnee = leftIsFront ? leftKnee : rightKnee;
    const frontAnkle = leftIsFront ? leftAnkle : rightAnkle;
    
    if (frontKnee[0] > frontAnkle[0] + 0.05) {
        errors.push("Front knee shouldn't go past toes");
    }
    
    // Phase detection
    let phase = "TRANSITION";
    const minAngle = Math.min(leftKneeAngle, rightKneeAngle);
    if (minAngle > 150) phase = "STANDING";
    else if (minAngle < 120) phase = "DOWN";
    
    return {
        isCorrect: errors.length === 0,
        errors,
        angles: { left: leftKneeAngle, right: rightKneeAngle },
        phase
    };
};

/**
 * Check Lateral Raise form
 */
export const checkLateralRaiseForm = (landmarks) => {
    const leftShoulder = getLandmarkCoords(landmarks, LANDMARKS.LEFT_SHOULDER);
    const leftElbow = getLandmarkCoords(landmarks, LANDMARKS.LEFT_ELBOW);
    const leftHip = getLandmarkCoords(landmarks, LANDMARKS.LEFT_HIP);
    
    const rightShoulder = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_SHOULDER);
    const rightElbow = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_ELBOW);
    const rightHip = getLandmarkCoords(landmarks, LANDMARKS.RIGHT_HIP);
    
    if (!leftShoulder || !leftElbow || !leftHip || !rightShoulder || !rightElbow || !rightHip) {
        return { isCorrect: false, errors: ["Can't see upper body"], angles: { left: 0, right: 0 }, phase: 'UNKNOWN' };
    }
    
    // Calculate arm raise angles
    const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    
    const errors = [];
    
    // Symmetry check
    if (Math.abs(leftArmAngle - rightArmAngle) > 20) {
        errors.push("Raise both arms evenly");
    }
    
    // Don't raise too high
    if (leftArmAngle > 110 || rightArmAngle > 110) {
        errors.push("Don't raise arms above shoulder height");
    }
    
    // Phase detection
    let phase = "TRANSITION";
    const avgAngle = (leftArmAngle + rightArmAngle) / 2;
    if (avgAngle < 30) phase = "DOWN";
    else if (avgAngle > 70) phase = "UP";
    
    return {
        isCorrect: errors.length === 0,
        errors,
        angles: { left: leftArmAngle, right: rightArmAngle },
        phase
    };
};

// ============================================================
// SKELETON DRAWING (same as Python draw_landmarks)
// ============================================================

export const SKELETON_CONNECTIONS = [
    [11, 12],  // Shoulders
    [11, 13], [13, 15],  // Left arm
    [12, 14], [14, 16],  // Right arm
    [11, 23], [12, 24], [23, 24],  // Torso
    [23, 25], [25, 27],  // Left leg
    [24, 26], [26, 28]   // Right leg
];

/**
 * Draw pose landmarks on canvas (same as Python draw_landmarks)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} landmarks - Pose landmarks
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} color - Color for skeleton
 */
export const drawSkeleton = (ctx, landmarks, width, height, color) => {
    if (!landmarks) return;
    
    // Draw connections
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    SKELETON_CONNECTIONS.forEach(([start, end]) => {
        if (start < landmarks.length && end < landmarks.length) {
            const x1 = landmarks[start].x * width;
            const y1 = landmarks[start].y * height;
            const x2 = landmarks[end].x * width;
            const y2 = landmarks[end].y * height;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    });
    
    // Draw joint points (upper body landmarks like Python)
    const jointIndices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    ctx.fillStyle = color;
    
    jointIndices.forEach(i => {
        if (i < landmarks.length) {
            const x = landmarks[i].x * width;
            const y = landmarks[i].y * height;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
};

/**
 * Get skeleton color based on form correctness
 * @param {boolean} isMoving - Is user moving
 * @param {boolean} isCorrect - Is form correct
 * @returns {string} Color hex code
 */
export const getSkeletonColor = (isMoving, isCorrect) => {
    if (!isMoving) return '#888888';  // Gray when not moving
    return isCorrect ? '#00ff87' : '#ff3860';  // Green if correct, Red if not
};