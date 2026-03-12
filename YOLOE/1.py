import cv2
import pyttsx3
import threading
import time
import numpy as np
from ultralytics import YOLO

# ==============================
# CONFIGURATION
# ==============================

IMPORTANT_OBJECTS = {
    "person",
    "car", "bus", "truck", "motorcycle", "bicycle",
    "chair", "couch", "dining table"
}

DANGEROUS_OBJECTS = {
    "car", "bus", "truck", "motorcycle", "bicycle"
}

COOLDOWN_TIME = 5
PATH_REGION_RATIO = 0.4   # middle 40% is walking path
CLOSE_THRESHOLD = 0.22
NEAR_THRESHOLD = 0.10

# ==============================
# LOAD MODEL
# ==============================

model = YOLO("yolov8n.pt")

# ==============================
# VOICE ENGINE (Windows Stable)
# ==============================

engine = pyttsx3.init('sapi5')
engine.setProperty('rate', 145)
engine.setProperty('volume', 1.0)

def speak(text):
    def run():
        engine.say(text)
        engine.runAndWait()
    threading.Thread(target=run, daemon=True).start()

# ==============================
# HELPER FUNCTIONS
# ==============================

def estimate_distance(area_ratio):
    if area_ratio > CLOSE_THRESHOLD:
        return "very close"
    elif area_ratio > NEAR_THRESHOLD:
        return "near"
    else:
        return "ahead"

def estimate_position(x_center, width):
    left_bound = width * (0.5 - PATH_REGION_RATIO / 2)
    right_bound = width * (0.5 + PATH_REGION_RATIO / 2)

    if x_center < left_bound:
        return "on your left"
    elif x_center > right_bound:
        return "on your right"
    else:
        return "in front of you"

def is_in_path(x_center, width):
    left_bound = width * (0.5 - PATH_REGION_RATIO / 2)
    right_bound = width * (0.5 + PATH_REGION_RATIO / 2)
    return left_bound <= x_center <= right_bound

# ==============================
# CAMERA
# ==============================

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Camera not accessible")
    exit()

print("Advanced Smart Assistive Vision Running...")

memory = {}
previous_positions = {}
last_path_status = "blocked"

# ==============================
# MAIN LOOP
# ==============================

while True:
    ret, frame = cap.read()
    if not ret:
        break

    height, width = frame.shape[:2]
    frame_area = width * height

    results = model(frame)

    objects_in_path = []
    announcements = []

    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        label = model.names[cls_id]

        if label not in IMPORTANT_OBJECTS:
            continue

        x1, y1, x2, y2 = box.xyxy[0]
        x_center = (x1 + x2) / 2
        box_area = (x2 - x1) * (y2 - y1)
        area_ratio = box_area / frame_area

        distance = estimate_distance(area_ratio)
        position = estimate_position(x_center, width)

        current_time = time.time()
        state = f"{position}-{distance}"

        # Track movement
        moving = False
        if label in previous_positions:
            if abs(previous_positions[label] - x_center) > 30:
                moving = True

        previous_positions[label] = x_center

        # Check if blocking path
        if is_in_path(x_center, width) and distance != "ahead":
            objects_in_path.append(label)

        # Smart speaking logic
        if label not in memory or \
           memory[label]["state"] != state or \
           current_time - memory[label]["time"] > COOLDOWN_TIME:

            if label in DANGEROUS_OBJECTS and distance == "very close":
                message = f"Warning. {label} very close {position}"
            elif moving and label in DANGEROUS_OBJECTS:
                message = f"{label} moving {position}"
            else:
                message = f"{label} {distance} {position}"

            announcements.append(message)

            memory[label] = {
                "state": state,
                "time": current_time
            }

    # Path status logic
    if len(objects_in_path) == 0:
        if last_path_status != "clear":
            announcements.append("Path is clear")
            last_path_status = "clear"
    else:
        last_path_status = "blocked"

    # Speak grouped announcements
    if announcements:
        final_message = ". ".join(announcements)
        print(final_message)
        speak(final_message)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()