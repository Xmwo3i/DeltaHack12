import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Left arm
LEFT_SHOULDER = 11
LEFT_ELBOW = 13
LEFT_WRIST = 15

# Right arm
RIGHT_SHOULDER = 12
RIGHT_ELBOW = 14
RIGHT_WRIST = 16

# Path to model
MODEL_PATH = "pose_landmarker_lite.task"

# Create PoseLandmarker
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO
)

detector = vision.PoseLandmarker.create_from_options(options)

cap = cv2.VideoCapture(0)
frame_idx = 0

# Angle calculation helper function
def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    cosine_angle = np.dot(ba, bc) / (
        np.linalg.norm(ba) * np.linalg.norm(bc)
    )
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))
    return angle

# Landmark coordinates helper function
def lm(landmarks, idx):
    return [landmarks[idx].x, landmarks[idx].y]


# Main while loop
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    )

    result = detector.detect_for_video(mp_image, frame_idx)
    frame_idx += 1
    
    if not result.pose_landmarks:
        cv2.imshow("Pose Landmarks", frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break
        continue

    landmarks = result.pose_landmarks[0]
    
    # Compute elbow angles
    left_elbow_angle = calculate_angle(
        lm(landmarks, LEFT_SHOULDER),
        lm(landmarks, LEFT_ELBOW),
        lm(landmarks, LEFT_WRIST)
    )

    right_elbow_angle = calculate_angle(
        lm(landmarks, RIGHT_SHOULDER),
        lm(landmarks, RIGHT_ELBOW),
        lm(landmarks, RIGHT_WRIST)
    )

    # Draw green dots of person
    for landmark in result.pose_landmarks[0]:
        h, w, _ = frame.shape
        cx, cy = int(landmark.x * w), int(landmark.y * h)
        cv2.circle(frame, (cx, cy), 4, (0, 255, 0), -1)
    
    # Form checks
    feedback = []

    # Lockout check
    if left_elbow_angle < 150 or right_elbow_angle < 150:
        feedback.append("Press higher — extend your arms")

    # Bottom position check
    if left_elbow_angle > 110 or right_elbow_angle > 110:
        feedback.append("Lower the weights with control")

    # Symmetry check
    if abs(left_elbow_angle - right_elbow_angle) > 20:
        feedback.append("Keep arms moving evenly")

    if not feedback:
        feedback.append("Good shoulder press!")

    # Elbow-over-wrist check (important for safety)
    lw_x = lm(landmarks, LEFT_WRIST)[0]
    le_x = lm(landmarks, LEFT_ELBOW)[0]

    rw_x = lm(landmarks, RIGHT_WRIST)[0]
    re_x = lm(landmarks, RIGHT_ELBOW)[0]

    if abs(le_x - lw_x) > 0.05 or abs(re_x - rw_x) > 0.05:
        feedback.append("Stack wrists over elbows")

    # Display feedback
    y = 30
    for text in feedback:
        cv2.putText(
            frame,
            text,
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0) if text == "Good shoulder press!" else (0, 0, 255),
            2
        )
        y += 30
        
    cv2.imshow("Pose Landmarks", frame)

    if cv2.waitKey(1) & 0xFF == 27:  # ESC to close window
        break

cap.release()
cv2.destroyAllWindows()
