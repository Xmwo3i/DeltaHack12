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

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
    return angle

def check_squat_form(landmarks, frame_width, frame_height):
    """Check squat form - returns (is_correct, errors, knee_angle)"""
    
    # Landmark indices for pose
    LEFT_HIP = 23
    LEFT_KNEE = 25
    LEFT_ANKLE = 27
    LEFT_SHOULDER = 11
    
    hip = [landmarks[LEFT_HIP].x, landmarks[LEFT_HIP].y]
    knee = [landmarks[LEFT_KNEE].x, landmarks[LEFT_KNEE].y]
    ankle = [landmarks[LEFT_ANKLE].x, landmarks[LEFT_ANKLE].y]
    shoulder = [landmarks[LEFT_SHOULDER].x, landmarks[LEFT_SHOULDER].y]
    
    knee_angle = calculate_angle(hip, knee, ankle)
    back_angle = calculate_angle(shoulder, hip, knee)
    
    errors = []
    
    if knee_angle < 70:
        errors.append("Knees too far forward")
    
    if back_angle < 60:
        errors.append("Leaning too far forward")
    
    if landmarks[LEFT_KNEE].x < landmarks[LEFT_ANKLE].x - 0.05:
        errors.append("Knee caving inward")
    
    is_correct = len(errors) == 0
    return is_correct, errors, knee_angle

def draw_landmarks(image, landmarks, color):
    """Draw pose landmarks on image"""
    h, w = image.shape[:2]
    
    # Connections for body
    connections = [
        (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),  # Arms
        (11, 23), (12, 24), (23, 24),  # Torso
        (23, 25), (25, 27), (24, 26), (26, 28),  # Legs
        (27, 29), (29, 31), (28, 30), (30, 32)  # Feet
    ]
    
    # Draw connections
    for start, end in connections:
        if start < len(landmarks) and end < len(landmarks):
            x1 = int(landmarks[start].x * w)
            y1 = int(landmarks[start].y * h)
            x2 = int(landmarks[end].x * w)
            y2 = int(landmarks[end].y * h)
            cv2.line(image, (x1, y1), (x2, y2), color, 3)
    
    # Draw points
    for landmark in landmarks:
        x = int(landmark.x * w)
        y = int(landmark.y * h)
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
            h, w = frame.shape[:2]
            
            # Convert to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            # Detect pose
            timestamp_ms = int(frame_count * 1000 / 30)  # Assuming 30 fps
            result = landmarker.detect_for_video(mp_image, timestamp_ms)
            
            if result.pose_landmarks and len(result.pose_landmarks) > 0:
                landmarks = result.pose_landmarks[0]
                
                # Check form
                is_correct, errors, knee_angle = check_squat_form(landmarks, w, h)
                
                # Set color: Green = correct, Red = incorrect
                color = (0, 255, 0) if is_correct else (0, 0, 255)
                
                # Draw skeleton
                draw_landmarks(frame, landmarks, color)
                
                # Display status
                status = "GOOD FORM" if is_correct else "FIX FORM"
                cv2.putText(frame, status, (50, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)
                
                cv2.putText(frame, f"Knee: {int(knee_angle)} deg", (50, 100),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                
                # Show errors
                for i, error in enumerate(errors):
                    cv2.putText(frame, error, (50, 150 + i*40),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            
            cv2.imshow('Exercise Form Checker', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()