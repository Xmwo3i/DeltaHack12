import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import threading
import queue
import platform
import os
from collections import deque

# -----------------------
# 0️⃣ Model
# -----------------------
MODEL_PATH = "pose_landmarker_lite.task"
if not os.path.exists(MODEL_PATH):
    import urllib.request
    print("Downloading pose model...")
    url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
    urllib.request.urlretrieve(url, MODEL_PATH)
    print("Download complete!")

# -----------------------
# 1️⃣ Landmarks
# -----------------------
LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST = 11, 13, 15
RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST = 12, 14, 16


# -----------------------
# 2️⃣ Speech thread setup
# -----------------------
speech_queue = queue.Queue()
last_spoken = ""
last_spoken_time = 0
SPEECH_COOLDOWN = 1.5
ERROR_PRIORITY = ["Stack wrists over elbows", "Keep arms moving evenly"]

VOICE_MAP = {
    "WRISTS": "Stack wrists over elbows",
    "ASYMMETRY": "Keep arms moving evenly",
    "GOOD": "Good rep"
}

state_history = deque(maxlen=10)  # Last 10 frames
MIN_FRAMES_FOR_STATE_CHANGE = 6   # Need 6/10 frames to confirm
last_spoken_state = ""


def speech_worker():
    system = platform.system()
    while True:
        text = speech_queue.get()
        if text is None:
            break
        try:
            if system == "Windows":
                import subprocess
                subprocess.run(['powershell', '-Command',
                                f'(New-Object -ComObject SAPI.SpVoice).Speak("{text}")'],
                               capture_output=True)
            elif system == "Darwin":
                os.system(f'say "{text}"')
            else:
                os.system(f'espeak "{text}"')
        except Exception as e:
            print(f"Speech error: {e}")
        speech_queue.task_done()

speech_thread = threading.Thread(target=speech_worker, daemon=True)
speech_thread.start()

def speak_async(text, current_time):
    global last_spoken, last_spoken_time
    if text != last_spoken or current_time - last_spoken_time > SPEECH_COOLDOWN:
        last_spoken = text
        last_spoken_time = current_time
        speech_queue.put(text)

def get_top_error(errors):
    for err in ERROR_PRIORITY:
        if err in errors:
            return err
    return None

# -----------------------
# 3️⃣ Helper functions
# -----------------------
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

def get_stable_state(current_state):
    state_history.append(current_state)

    if len(state_history) < state_history.maxlen:
        return None

    # Find most common state
    counts = {}
    for s in state_history:
        counts[s] = counts.get(s, 0) + 1

    dominant_state = max(counts, key=counts.get)

    if counts[dominant_state] >= MIN_FRAMES_FOR_STATE_CHANGE:
        return dominant_state

    return None
# -----------------------
# 4️⃣ Main loop
# -----------------------
def main():
    global last_spoken_state
    # Setup pose landmarker
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO
    )
    
    cap = cv2.VideoCapture(0)
    
    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        frame_count = 0
        
        prev_angles = {
            "left": None,
            "right": None
        }
        
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
                
                # Speech feedback for errors
                current_time = frame_count/30.0
                
                # Determine current message
                if "Stack wrists over elbows" in errors:
                    current_state = "WRISTS"
                elif "Keep arms moving evenly" in errors:
                    current_state = "ASYMMETRY"
                else:
                    current_state = "GOOD"

                # Only speak if stable state confirmed
                stable_state = get_stable_state(current_state)

                if stable_state and stable_state != last_spoken_state:
                    speak_async(VOICE_MAP[stable_state], current_time)
                    last_spoken_state = stable_state
                
                # Set color: Green = correct, Red = incorrect
                color = (0, 255, 0) if is_correct else (0, 0, 255)
                
                # Draw skeleton
                draw_landmarks(frame, landmarks, color)
                
                # Display status
                status = "GOOD FORM!" if is_correct else "FIX FORM"
                cv2.putText(frame, status, (50, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)
                
            cv2.imshow('Shoulder Press Form Checker', frame)
            
            if cv2.waitKey(1) & 0xFF == 27: # press ESC to exit
                break

    cap.release()
    cv2.destroyAllWindows()
    
    # Stop speech thread
    speech_queue.put(None)
    speech_thread.join()

if __name__ == "__main__":
    main()