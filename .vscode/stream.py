import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os
import urllib.request
from PIL import Image
from io import BytesIO
import requests

# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = "pose_landmarker_lite.task"

# ============================================================
# EXERCISES WITH BETTER ANGLE DEFINITIONS
# ============================================================

EXERCISES = {
    "shoulder_press": {
        "name": "Shoulder Press",
        "target": "shoulders, triceps",
        "camera_position": "FRONT or SIDE",
        "phases": {
            "BOTTOM": {
                "description": "Starting position - weights at shoulders",
                "angles": {
                    "left_elbow": (70, 110),      # Range: 70-110 degrees
                    "right_elbow": (70, 110),
                    "left_arm_raise": (70, 100),  # Arm raised to shoulder height
                    "right_arm_raise": (70, 100)
                }
            },
            "TOP": {
                "description": "Arms fully extended overhead",
                "angles": {
                    "left_elbow": (150, 180),     # Almost straight
                    "right_elbow": (150, 180),
                    "left_arm_raise": (160, 180), # Arms overhead
                    "right_arm_raise": (160, 180)
                }
            }
        },
        "common_mistakes": [
            ("back_arch", "back", "<", 160, "Don't arch your back"),
            ("elbow_flare", "elbow_diff", ">", 30, "Keep elbows even"),
        ],
        "instructions": [
            "Stand with feet shoulder-width apart",
            "Hold weights at shoulder height",
            "Press straight up overhead",
            "Lower with control"
        ]
    },
    "squat": {
        "name": "Squat",
        "target": "quads, glutes, hamstrings",
        "camera_position": "SIDE view recommended",
        "phases": {
            "STANDING": {
                "description": "Standing tall",
                "angles": {
                    "left_knee": (160, 180),
                    "right_knee": (160, 180),
                    "left_hip": (160, 180),
                    "right_hip": (160, 180)
                }
            },
            "BOTTOM": {
                "description": "Full squat depth",
                "angles": {
                    "left_knee": (70, 110),
                    "right_knee": (70, 110),
                    "left_hip": (70, 110),
                    "right_hip": (70, 110)
                }
            }
        },
        "common_mistakes": [
            ("knee_cave", "knee_diff", ">", 20, "Knees caving in"),
            ("forward_lean", "back", "<", 100, "Leaning too far forward"),
            ("not_deep", "avg_knee", ">", 120, "Go deeper")
        ],
        "instructions": [
            "Feet shoulder-width apart",
            "Keep chest up, back straight",
            "Lower until thighs parallel to ground",
            "Push through heels to stand"
        ]
    },
    "bicep_curl": {
        "name": "Bicep Curl",
        "target": "biceps",
        "camera_position": "FRONT or SIDE",
        "phases": {
            "BOTTOM": {
                "description": "Arms extended",
                "angles": {
                    "left_elbow": (150, 180),
                    "right_elbow": (150, 180)
                }
            },
            "TOP": {
                "description": "Full contraction",
                "angles": {
                    "left_elbow": (30, 60),
                    "right_elbow": (30, 60)
                }
            }
        },
        "common_mistakes": [
            ("swinging", "shoulder_movement", ">", 20, "Don't swing - control the weight"),
            ("uneven", "elbow_diff", ">", 25, "Keep both arms even")
        ],
        "instructions": [
            "Stand with arms at sides",
            "Keep elbows close to body",
            "Curl weights to shoulders",
            "Lower slowly with control"
        ]
    },
    "pushup": {
        "name": "Push Up",
        "target": "chest, triceps, shoulders",
        "camera_position": "SIDE view recommended",
        "phases": {
            "TOP": {
                "description": "Arms extended",
                "angles": {
                    "left_elbow": (160, 180),
                    "right_elbow": (160, 180),
                    "back": (160, 180)
                }
            },
            "BOTTOM": {
                "description": "Chest near ground",
                "angles": {
                    "left_elbow": (70, 100),
                    "right_elbow": (70, 100),
                    "back": (160, 180)
                }
            }
        },
        "common_mistakes": [
            ("sagging_hips", "back", "<", 150, "Keep hips up - straight line"),
            ("pike", "back", ">", 190, "Don't pike up"),
            ("partial_rep", "avg_elbow", ">", 120, "Go lower")
        ],
        "instructions": [
            "Hands slightly wider than shoulders",
            "Keep body in straight line",
            "Lower until chest nearly touches ground",
            "Push back up fully"
        ]
    },
    "lunge": {
        "name": "Lunge",
        "target": "quads, glutes, hamstrings",
        "camera_position": "SIDE view recommended",
        "phases": {
            "STANDING": {
                "description": "Standing tall",
                "angles": {
                    "left_knee": (160, 180),
                    "right_knee": (160, 180)
                }
            },
            "BOTTOM": {
                "description": "Deep lunge",
                "angles": {
                    "left_knee": (80, 110),
                    "right_knee": (80, 110)
                }
            }
        },
        "common_mistakes": [
            ("knee_over_toe", "front_knee", "<", 70, "Knee too far forward"),
            ("not_deep", "avg_knee", ">", 120, "Go deeper")
        ],
        "instructions": [
            "Step forward with one leg",
            "Lower hips until both knees at 90°",
            "Keep front knee over ankle",
            "Push back to start"
        ]
    },
    "plank": {
        "name": "Plank",
        "target": "core, shoulders",
        "camera_position": "SIDE view required",
        "phases": {
            "HOLD": {
                "description": "Straight body line",
                "angles": {
                    "back": (165, 185),
                    "left_hip": (165, 185),
                    "right_hip": (165, 185)
                }
            }
        },
        "common_mistakes": [
            ("sagging", "back", "<", 160, "Hips sagging - engage core"),
            ("pike", "back", ">", 190, "Hips too high")
        ],
        "instructions": [
            "Forearms on ground, elbows under shoulders",
            "Keep body in straight line",
            "Engage core, don't let hips sag",
            "Hold position"
        ]
    },
    "lateral_raise": {
        "name": "Lateral Raise",
        "target": "side deltoids",
        "camera_position": "FRONT view recommended",
        "phases": {
            "BOTTOM": {
                "description": "Arms at sides",
                "angles": {
                    "left_arm_raise": (0, 30),
                    "right_arm_raise": (0, 30)
                }
            },
            "TOP": {
                "description": "Arms parallel to ground",
                "angles": {
                    "left_arm_raise": (80, 100),
                    "right_arm_raise": (80, 100)
                }
            }
        },
        "common_mistakes": [
            ("too_high", "avg_arm_raise", ">", 110, "Don't raise above shoulder"),
            ("uneven", "arm_raise_diff", ">", 20, "Keep arms even")
        ],
        "instructions": [
            "Stand with dumbbells at sides",
            "Slight bend in elbows",
            "Raise arms to shoulder height",
            "Lower with control"
        ]
    },
    "deadlift": {
        "name": "Deadlift",
        "target": "back, hamstrings, glutes",
        "camera_position": "SIDE view required",
        "phases": {
            "BOTTOM": {
                "description": "Bent over, gripping bar",
                "angles": {
                    "left_hip": (60, 100),
                    "right_hip": (60, 100),
                    "back": (140, 180)  # Back should stay straight
                }
            },
            "TOP": {
                "description": "Standing tall",
                "angles": {
                    "left_hip": (165, 185),
                    "right_hip": (165, 185),
                    "back": (165, 185)
                }
            }
        },
        "common_mistakes": [
            ("rounded_back", "back", "<", 140, "Keep back straight!"),
            ("not_locked", "avg_hip", "<", 160, "Stand up fully")
        ],
        "instructions": [
            "Feet hip-width apart",
            "Bend at hips, keep back straight",
            "Grip bar, chest up",
            "Drive through heels to stand"
        ]
    }
}

# ============================================================
# DOWNLOAD MODEL
# ============================================================

def download_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading pose model...")
        url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
        urllib.request.urlretrieve(url, MODEL_PATH)
        print("Download complete!")

# ============================================================
# IMPROVED ANGLE CALCULATIONS
# ============================================================

def calculate_angle(p1, p2, p3):
    """Calculate angle at p2 between p1-p2-p3"""
    v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
    v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
    
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    cos_angle = np.clip(cos_angle, -1, 1)
    angle = np.arccos(cos_angle) * 180 / np.pi
    
    return angle

def get_point(landmarks, idx):
    """Get x, y coordinates from landmark"""
    return (landmarks[idx].x, landmarks[idx].y)

def get_all_angles(landmarks):
    """Calculate all relevant angles from landmarks"""
    angles = {}
    
    # Landmark indices
    NOSE = 0
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    
    try:
        # Elbow angles (shoulder-elbow-wrist)
        angles['left_elbow'] = calculate_angle(
            get_point(landmarks, LEFT_SHOULDER),
            get_point(landmarks, LEFT_ELBOW),
            get_point(landmarks, LEFT_WRIST)
        )
        angles['right_elbow'] = calculate_angle(
            get_point(landmarks, RIGHT_SHOULDER),
            get_point(landmarks, RIGHT_ELBOW),
            get_point(landmarks, RIGHT_WRIST)
        )
        
        # Knee angles (hip-knee-ankle)
        angles['left_knee'] = calculate_angle(
            get_point(landmarks, LEFT_HIP),
            get_point(landmarks, LEFT_KNEE),
            get_point(landmarks, LEFT_ANKLE)
        )
        angles['right_knee'] = calculate_angle(
            get_point(landmarks, RIGHT_HIP),
            get_point(landmarks, RIGHT_KNEE),
            get_point(landmarks, RIGHT_ANKLE)
        )
        
        # Hip angles (shoulder-hip-knee)
        angles['left_hip'] = calculate_angle(
            get_point(landmarks, LEFT_SHOULDER),
            get_point(landmarks, LEFT_HIP),
            get_point(landmarks, LEFT_KNEE)
        )
        angles['right_hip'] = calculate_angle(
            get_point(landmarks, RIGHT_SHOULDER),
            get_point(landmarks, RIGHT_HIP),
            get_point(landmarks, RIGHT_KNEE)
        )
        
        # Arm raise angle (how high arms are raised)
        # Angle between torso and upper arm
        angles['left_arm_raise'] = calculate_angle(
            get_point(landmarks, LEFT_HIP),
            get_point(landmarks, LEFT_SHOULDER),
            get_point(landmarks, LEFT_ELBOW)
        )
        angles['right_arm_raise'] = calculate_angle(
            get_point(landmarks, RIGHT_HIP),
            get_point(landmarks, RIGHT_SHOULDER),
            get_point(landmarks, RIGHT_ELBOW)
        )
        
        # Back angle (shoulder-hip-knee alignment)
        mid_shoulder = (
            (landmarks[LEFT_SHOULDER].x + landmarks[RIGHT_SHOULDER].x) / 2,
            (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2
        )
        mid_hip = (
            (landmarks[LEFT_HIP].x + landmarks[RIGHT_HIP].x) / 2,
            (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2
        )
        mid_knee = (
            (landmarks[LEFT_KNEE].x + landmarks[RIGHT_KNEE].x) / 2,
            (landmarks[LEFT_KNEE].y + landmarks[RIGHT_KNEE].y) / 2
        )
        angles['back'] = calculate_angle(mid_shoulder, mid_hip, mid_knee)
        
        # Computed values
        angles['avg_elbow'] = (angles['left_elbow'] + angles['right_elbow']) / 2
        angles['avg_knee'] = (angles['left_knee'] + angles['right_knee']) / 2
        angles['avg_hip'] = (angles['left_hip'] + angles['right_hip']) / 2
        angles['avg_arm_raise'] = (angles['left_arm_raise'] + angles['right_arm_raise']) / 2
        angles['elbow_diff'] = abs(angles['left_elbow'] - angles['right_elbow'])
        angles['knee_diff'] = abs(angles['left_knee'] - angles['right_knee'])
        angles['arm_raise_diff'] = abs(angles['left_arm_raise'] - angles['right_arm_raise'])
        
    except Exception as e:
        print(f"Angle calculation error: {e}")
    
    return angles

# ============================================================
# IMPROVED FORM CHECKING
# ============================================================

def check_form(exercise_key, angles):
    """Check form against exercise definition"""
    
    if exercise_key not in EXERCISES:
        return 50, [], "UNKNOWN", {}
    
    exercise = EXERCISES[exercise_key]
    phases = exercise.get('phases', {})
    
    # Determine current phase
    current_phase = None
    best_phase_score = 0
    phase_scores = {}
    
    for phase_name, phase_data in phases.items():
        phase_angles = phase_data.get('angles', {})
        score = 0
        total = 0
        
        for angle_name, (min_val, max_val) in phase_angles.items():
            if angle_name in angles:
                total += 1
                angle_val = angles[angle_name]
                
                if min_val <= angle_val <= max_val:
                    score += 1
                elif angle_val < min_val:
                    # Partial credit for being close
                    diff = min_val - angle_val
                    score += max(0, 1 - diff / 30)
                else:
                    diff = angle_val - max_val
                    score += max(0, 1 - diff / 30)
        
        phase_score = (score / total * 100) if total > 0 else 0
        phase_scores[phase_name] = phase_score
        
        if phase_score > best_phase_score:
            best_phase_score = phase_score
            current_phase = phase_name
    
    # Check for common mistakes
    feedback = []
    mistakes = exercise.get('common_mistakes', [])
    penalty = 0
    
    for mistake in mistakes:
        name, angle_key, operator, threshold, message = mistake
        
        if angle_key in angles:
            val = angles[angle_key]
            
            triggered = False
            if operator == '<' and val < threshold:
                triggered = True
            elif operator == '>' and val > threshold:
                triggered = True
            
            if triggered:
                feedback.append(message)
                penalty += 15
    
    # Calculate final score
    accuracy = max(0, min(100, best_phase_score - penalty))
    
    # Add phase-specific feedback
    if current_phase and current_phase in phases:
        phase_data = phases[current_phase]
        for angle_name, (min_val, max_val) in phase_data.get('angles', {}).items():
            if angle_name in angles:
                val = angles[angle_name]
                if val < min_val - 15:
                    nice_name = angle_name.replace('_', ' ').title()
                    feedback.append(f"{nice_name}: extend more")
                elif val > max_val + 15:
                    nice_name = angle_name.replace('_', ' ').title()
                    feedback.append(f"{nice_name}: bend more")
    
    return accuracy, feedback[:4], current_phase or "ACTIVE", angles

# ============================================================
# DRAWING
# ============================================================

def draw_skeleton(image, landmarks, color, highlight_joints=None):
    """Draw skeleton with optional joint highlighting"""
    h, w = image.shape[:2]
    
    connections = [
        # Torso
        (11, 12), (11, 23), (12, 24), (23, 24),
        # Left arm
        (11, 13), (13, 15),
        # Right arm
        (12, 14), (14, 16),
        # Left leg
        (23, 25), (25, 27),
        # Right leg
        (24, 26), (26, 28),
        # Feet
        (27, 29), (27, 31), (28, 30), (28, 32)
    ]
    
    # Draw connections
    for start, end in connections:
        if start < len(landmarks) and end < len(landmarks):
            x1 = int(landmarks[start].x * w)
            y1 = int(landmarks[start].y * h)
            x2 = int(landmarks[end].x * w)
            y2 = int(landmarks[end].y * h)
            cv2.line(image, (x1, y1), (x2, y2), color, 4)
    
    # Draw joints
    for i, landmark in enumerate(landmarks):
        if i > 32:
            break
        x = int(landmark.x * w)
        y = int(landmark.y * h)
        
        # Highlight specific joints if needed
        joint_color = color
        radius = 6
        
        if highlight_joints and i in highlight_joints:
            joint_color = (0, 255, 255)  # Yellow for highlighted
            radius = 10
        
        cv2.circle(image, (x, y), radius, joint_color, -1)
        cv2.circle(image, (x, y), radius, (255, 255, 255), 2)

def draw_angle_indicator(image, landmarks, idx1, idx2, idx3, angle_val, w, h):
    """Draw angle arc at a joint"""
    x = int(landmarks[idx2].x * w)
    y = int(landmarks[idx2].y * h)
    
    # Draw angle value
    cv2.putText(image, f"{angle_val:.0f}", (x + 10, y - 10),
               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 2)

# ============================================================
# MAIN FORM CHECKER
# ============================================================

def run_form_checker():
    download_model()
    
    exercises = list(EXERCISES.keys())
    
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO
    )
    
    print("\n" + "="*55)
    print("       EXERCISE FORM CHECKER v4 - IMPROVED ACCURACY")
    print("="*55)
    print("\nAvailable exercises:")
    for i, ex in enumerate(exercises):
        print(f"  [{i+1}] {EXERCISES[ex]['name']:20} | {EXERCISES[ex]['camera_position']}")
    print("\nControls:")
    print("  1-9: Select exercise")
    print("  N/P: Next/Previous")
    print("  D:   Toggle debug info (show all angles)")
    print("  Q:   Quit")
    print("="*55 + "\n")
    
    current_idx = 0
    current_key = exercises[current_idx]
    show_debug = False
    
    cap = cv2.VideoCapture(0)
    
    # Try to set higher resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    landmarker = vision.PoseLandmarker.create_from_options(options)
    frame_count = 0
    
    # Smoothing for accuracy (reduce jitter)
    accuracy_history = []
    SMOOTHING_FRAMES = 5
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.flip(frame, 1)  # Mirror
        frame_count += 1
        h, w = frame.shape[:2]
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        timestamp_ms = int(frame_count * 1000 / 30)
        result = landmarker.detect_for_video(mp_image, timestamp_ms)
        
        exercise = EXERCISES[current_key]
        
        # Header
        cv2.rectangle(frame, (0, 0), (w, 75), (40, 40, 40), -1)
        cv2.putText(frame, exercise['name'], (20, 35),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(frame, f"Target: {exercise['target']}", (20, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
        cv2.putText(frame, f"Camera: {exercise['camera_position']}", (w - 250, 35),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 200, 255), 1)
        
        if result.pose_landmarks and len(result.pose_landmarks) > 0:
            landmarks = result.pose_landmarks[0]
            
            # Calculate angles
            angles = get_all_angles(landmarks)
            
            # Check form
            accuracy, feedback, phase, _ = check_form(current_key, angles)
            
            # Smooth accuracy
            accuracy_history.append(accuracy)
            if len(accuracy_history) > SMOOTHING_FRAMES:
                accuracy_history.pop(0)
            smooth_accuracy = sum(accuracy_history) / len(accuracy_history)
            
            # Determine color
            if smooth_accuracy >= 85:
                color = (0, 255, 0)   # Green
                status = "PERFECT!"
            elif smooth_accuracy >= 70:
                color = (0, 200, 255) # Orange
                status = "GOOD"
            elif smooth_accuracy >= 50:
                color = (0, 150, 255) # Light orange
                status = "KEEP GOING"
            else:
                color = (0, 0, 255)   # Red
                status = "ADJUST FORM"
            
            # Draw skeleton
            draw_skeleton(frame, landmarks, color)
            
            # Status display
            cv2.putText(frame, status, (20, 120),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
            
            # Accuracy bar
            bar_w = 200
            bar_x = 20
            bar_y = 140
            cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_w, bar_y + 25), (50, 50, 50), -1)
            fill = int(bar_w * smooth_accuracy / 100)
            cv2.rectangle(frame, (bar_x, bar_y), (bar_x + fill, bar_y + 25), color, -1)
            cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_w, bar_y + 25), (255, 255, 255), 2)
            cv2.putText(frame, f"{smooth_accuracy:.0f}%", (bar_x + bar_w + 10, bar_y + 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Phase
            cv2.putText(frame, f"Phase: {phase}", (20, 195),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
            
            # Feedback
            y_pos = 230
            for fb in feedback:
                cv2.putText(frame, f"• {fb}", (20, y_pos),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 100, 255), 2)
                y_pos += 28
            
            # Debug info - show all angles
            if show_debug:
                debug_y = 100
                cv2.rectangle(frame, (w - 220, 80), (w - 10, 350), (30, 30, 30), -1)
                cv2.putText(frame, "DEBUG - Angles:", (w - 210, debug_y),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                debug_y += 25
                
                for angle_name in ['left_elbow', 'right_elbow', 'left_knee', 'right_knee',
                                   'left_hip', 'right_hip', 'left_arm_raise', 'right_arm_raise', 'back']:
                    if angle_name in angles:
                        cv2.putText(frame, f"{angle_name}: {angles[angle_name]:.0f}", 
                                   (w - 210, debug_y),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
                        debug_y += 22
        
        else:
            cv2.putText(frame, "Stand in frame - full body visible", (20, 120),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            accuracy_history = []  # Reset smoothing
        
        # Instructions at bottom
        cv2.rectangle(frame, (0, h - 70), (w, h), (40, 40, 40), -1)
        if exercise.get('instructions'):
            cv2.putText(frame, exercise['instructions'][0], (20, h - 45),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
        cv2.putText(frame, "[1-9] Select | [N/P] Navigate | [D] Debug | [Q] Quit",
                   (20, h - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (120, 120, 120), 1)
        
        cv2.imshow('Exercise Form Checker', frame)
        
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            break
        elif key == ord('d'):
            show_debug = not show_debug
            print(f"Debug mode: {'ON' if show_debug else 'OFF'}")
        elif key == ord('n'):
            current_idx = (current_idx + 1) % len(exercises)
            current_key = exercises[current_idx]
            accuracy_history = []
            print(f"Switched to: {EXERCISES[current_key]['name']}")
        elif key == ord('p'):
            current_idx = (current_idx - 1) % len(exercises)
            current_key = exercises[current_idx]
            accuracy_history = []
            print(f"Switched to: {EXERCISES[current_key]['name']}")
        elif ord('1') <= key <= ord('9'):
            idx = key - ord('1')
            if idx < len(exercises):
                current_idx = idx
                current_key = exercises[current_idx]
                accuracy_history = []
                print(f"Switched to: {EXERCISES[current_key]['name']}")
    
    cap.release()
    cv2.destroyAllWindows()
    landmarker.close()

if __name__ == "__main__":
    run_form_checker()