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
    a = np.array(a); b = np.array(b); c = np.array(c)
    ba, bc = a - b, c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    return np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))

def check_shoulder_press_form(landmarks):
    # Coordinates
    l_sh, l_el, l_wr = [landmarks[LEFT_SHOULDER].x, landmarks[LEFT_SHOULDER].y], \
                       [landmarks[LEFT_ELBOW].x, landmarks[LEFT_ELBOW].y], \
                       [landmarks[LEFT_WRIST].x, landmarks[LEFT_WRIST].y]
    r_sh, r_el, r_wr = [landmarks[RIGHT_SHOULDER].x, landmarks[RIGHT_SHOULDER].y], \
                       [landmarks[RIGHT_ELBOW].x, landmarks[RIGHT_ELBOW].y], \
                       [landmarks[RIGHT_WRIST].x, landmarks[RIGHT_WRIST].y]

    # Angles
    l_angle = calculate_angle(l_sh, l_el, l_wr)
    r_angle = calculate_angle(r_sh, r_el, r_wr)

    errors = []

    # Symmetry
    if abs(l_angle - r_angle) > 20:
        errors.append("Keep arms moving evenly")

    # Wrist over elbow
    if abs(l_el[0] - l_wr[0]) > 0.05 or abs(r_el[0] - r_wr[0]) > 0.05:
        errors.append("Stack wrists over elbows")

    is_correct = len(errors) == 0
    return is_correct, errors, (l_angle, r_angle)

def draw_landmarks(image, landmarks, color):
    h, w = image.shape[:2]
    connections = [
        (11, 12), (11, 13), (13, 15), (12, 14), (14, 16), (11, 23), (12, 24), (23, 24)
    ]
    for start, end in connections:
        if start < len(landmarks) and end < len(landmarks):
            x1, y1 = int(landmarks[start].x * w), int(landmarks[start].y * h)
            x2, y2 = int(landmarks[end].x * w), int(landmarks[end].y * h)
            cv2.line(image, (x1, y1), (x2, y2), color, 3)
    for i in [11,12,13,14,15,16,23,24]:
        if i < len(landmarks):
            x, y = int(landmarks[i].x * w), int(landmarks[i].y * h)
            cv2.circle(image, (x, y), 5, color, -1)

# -----------------------
# 4️⃣ Main loop
# -----------------------
def main():
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options, running_mode=vision.RunningMode.VIDEO
    )

    cap = cv2.VideoCapture(0)
    rep_count = 0
    state = "bottom"  # Track motion for reps

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            frame_count += 1

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            timestamp_ms = int(frame_count * 1000 / 30)
            result = landmarker.detect_for_video(mp_image, timestamp_ms)

            if result.pose_landmarks and len(result.pose_landmarks) > 0:
                landmarks = result.pose_landmarks[0]
                is_correct, errors, (l_angle, r_angle) = check_shoulder_press_form(landmarks)

                # -----------------------
                # Rep counting (lockout logic)
                # -----------------------
                top_elbow_angle = (l_angle + r_angle)/2
                if top_elbow_angle > 160 and state == "bottom":
                    state = "top"
                    rep_count += 1
                    speak_async(f"Rep {rep_count}", frame_count/30.0)
                elif top_elbow_angle < 90 and state == "top":
                    state = "bottom"

                # -----------------------
                # Speech feedback for errors
                # -----------------------
                current_time = frame_count/30.0
                error_to_speak = get_top_error(errors)
                if error_to_speak:
                    speak_async(error_to_speak, current_time)
                elif is_correct:
                    speak_async("Good shoulder press", current_time)

                # -----------------------
                # Draw overlays
                # -----------------------
                color = (0,255,0) if is_correct else (0,0,255)
                draw_landmarks(frame, landmarks, color)
                cv2.putText(frame, f"Reps: {rep_count}", (50,100), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255,255,0), 2)
                status = "GOOD FORM!" if is_correct else "FIX FORM"
                cv2.putText(frame, status, (50,50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)
                for i, error in enumerate(errors):
                    cv2.putText(frame, error, (50, 200 + i*40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
                # Show what is being spoken
                cv2.putText(frame, f"VOICE: {last_spoken}", (50, 400), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,0), 2)

            cv2.imshow("Shoulder Press Tracker", frame)
            if cv2.waitKey(1) & 0xFF == 27: break

    cap.release()
    cv2.destroyAllWindows()
    # Stop speech thread
    speech_queue.put(None)
    speech_thread.join()

if __name__ == "__main__":
    main()
