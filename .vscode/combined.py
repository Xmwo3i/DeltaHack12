import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import urllib.request
import os

# Download the model if not present
MODEL_PATH = "pose_landmarker_lite.task"
if not os.path.exists(MODEL_PATH):
    print("Downloading pose model...")
    url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
    urllib.request.urlretrieve(url, MODEL_PATH)
    print("Download complete!")

# Landmark indices
LEFT_SHOULDER = 11
LEFT_ELBOW = 13
LEFT_WRIST = 15
RIGHT_SHOULDER = 12
RIGHT_ELBOW = 14
RIGHT_WRIST = 16

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    ba = a - b
    bc = c - b
    
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))
    return angle

def check_shoulder_press_form(landmarks):
    """Check shoulder press form - returns (is_correct, errors, angles)"""
    
    # Get landmark coordinates
    left_shoulder = [landmarks[LEFT_SHOULDER].x, landmarks[LEFT_SHOULDER].y]
    left_elbow = [landmarks[LEFT_ELBOW].x, landmarks[LEFT_ELBOW].y]
    left_wrist = [landmarks[LEFT_WRIST].x, landmarks[LEFT_WRIST].y]
    
    right_shoulder = [landmarks[RIGHT_SHOULDER].x, landmarks[RIGHT_SHOULDER].y]
    right_elbow = [landmarks[RIGHT_ELBOW].x, landmarks[RIGHT_ELBOW].y]
    right_wrist = [landmarks[RIGHT_WRIST].x, landmarks[RIGHT_WRIST].y]
    
    # Calculate elbow angles
    left_elbow_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    right_elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
    
    errors = []
    
    # Symmetry check - both arms should move evenly
    if abs(left_elbow_angle - right_elbow_angle) > 20:
        errors.append("Keep arms moving evenly")
    
    # Elbow-over-wrist check (important for safety)
    lw_x = left_wrist[0]
    le_x = left_elbow[0]
    rw_x = right_wrist[0]
    re_x = right_elbow[0]
    
    if abs(le_x - lw_x) > 0.05 or abs(re_x - rw_x) > 0.05:
        errors.append("Stack wrists over elbows")
    
    is_correct = len(errors) == 0
    
    return is_correct, errors, (left_elbow_angle, right_elbow_angle)

def draw_landmarks(image, landmarks, color):
    """Draw pose landmarks on image with connecting lines"""
    h, w = image.shape[:2]
    
    # Connections for upper body (arms and torso)
    connections = [
        (11, 12),  # Shoulders
        (11, 13), (13, 15),  # Left arm
        (12, 14), (14, 16),  # Right arm
        (11, 23), (12, 24), (23, 24),  # Torso
    ]
    
    # Draw connections
    for start, end in connections:
        if start < len(landmarks) and end < len(landmarks):
            x1 = int(landmarks[start].x * w)
            y1 = int(landmarks[start].y * h)
            x2 = int(landmarks[end].x * w)
            y2 = int(landmarks[end].y * h)
            cv2.line(image, (x1, y1), (x2, y2), color, 3)
    
    # Draw joint points
    for i in [11, 12, 13, 14, 15, 16, 23, 24]:  # Upper body landmarks
        if i < len(landmarks):
            x = int(landmarks[i].x * w)
            y = int(landmarks[i].y * h)
            cv2.circle(image, (x, y), 5, color, -1)

def main():
    # Setup pose landmarker
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO
    )
    
    cap = cv2.VideoCapture(0)
    
    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Convert to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            # Detect pose
            timestamp_ms = int(frame_count * 1000 / 30)  # Assuming 30 fps
            result = landmarker.detect_for_video(mp_image, timestamp_ms)
            
            if result.pose_landmarks and len(result.pose_landmarks) > 0:
                landmarks = result.pose_landmarks[0]
                
                # Check form
                is_correct, errors, (left_angle, right_angle) = check_shoulder_press_form(landmarks)
                
                # Set color: Green = correct, Red = incorrect
                color = (0, 255, 0) if is_correct else (0, 0, 255)
                
                # Draw skeleton
                draw_landmarks(frame, landmarks, color)
                
                # Display status
                status = "GOOD FORM!" if is_correct else "FIX FORM"
                cv2.putText(frame, status, (50, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)
                
                # Show errors
                for i, error in enumerate(errors):
                    cv2.putText(frame, error, (50, 200 + i*40),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            
            cv2.imshow('Shoulder Press Form Checker', frame)
            
            if cv2.waitKey(1) & 0xFF == 27: # press ESC to exit
                break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()