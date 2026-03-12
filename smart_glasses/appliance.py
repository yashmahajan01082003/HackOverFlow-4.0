#!/usr/bin/env python3
"""
Appliance Control Feature
- Shows live camera feed
- Listens continuously for "toggle light" in background
- When heard, captures frame, runs detection, toggles if bulb found
- Overlays last detection results
- Say "exit mode" to return to menu
"""
import cv2
import time
import requests
import numpy as np
from picamera2 import Picamera2
import speech_recognition as sr
import os
from dotenv import load_dotenv
import threading
import contextlib

load_dotenv()

# ---------- Error suppression ----------
@contextlib.contextmanager
def ignore_stderr():
    stderr_fd = os.dup(2)
    devnull = os.open(os.devnull, os.O_WRONLY)
    os.dup2(devnull, 2)
    os.close(devnull)
    try:
        yield
    finally:
        os.dup2(stderr_fd, 2)
        os.close(stderr_fd)

# ---------- Configuration ----------
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "KyXJ16hLPN0MSvM")
ROBOFLOW_MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID", "bulb-detection-qji")
ROBOFLOW_API_URL = f"https://detect.roboflow.com/{ROBOFLOW_MODEL_ID}?api_key={ROBOFLOW_API_KEY}"
ESP32_IP = os.getenv("ESP32_IP", "10.182.10")
TARGET_CLASS = os.getenv("TARGET_CLASS", "bulb")
CONFIDENCE_THRESH = float(os.getenv("CONFIDENCE_THRESH", "0.5"))

HEADLESS = os.environ.get('DISPLAY') is None

# ---------- ESP32 Control ----------
def toggle_light():
    try:
        url = f"http://{ESP32_IP}/toggle"
        requests.get(url, timeout=3)
        print("ESP32 relay toggled")
    except Exception as e:
        print("Failed to contact ESP32:", e)

# ---------- Detection ----------
def detect_bulb_from_frame(frame):
    success, encoded = cv2.imencode(".jpg", frame)
    if not success:
        return []
    files = {"file": ("frame.jpg", encoded.tobytes(), "image/jpeg")}
    try:
        response = requests.post(ROBOFLOW_API_URL, files=files, timeout=10)
        return response.json().get("predictions", [])
    except Exception as e:
        print("API error:", e)
        return []

def should_toggle(predictions):
    for pred in predictions:
        if pred['class'] == TARGET_CLASS and pred['confidence'] > CONFIDENCE_THRESH:
            return True
    return False

def draw_predictions(frame, predictions):
    for pred in predictions:
        x = int(pred['x'] - pred['width']/2)
        y = int(pred['y'] - pred['height']/2)
        w = int(pred['width'])
        h = int(pred['height'])
        label = f"{pred['class']} ({pred['confidence']:.2f})"
        color = (0, 255, 0) if pred['class'] == TARGET_CLASS else (0, 0, 255)
        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 3)
        cv2.putText(frame, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX,
                    0.7, color, 2)

# ---------- Background Voice Listener ----------
toggle_requested = False
exit_requested = False

def voice_callback(recognizer, audio):
    global toggle_requested, exit_requested
    try:
        text = recognizer.recognize_google(audio).lower()
        print(f"Heard: {text}")
        if "toggle light" in text or "light" in text:
            toggle_requested = True
        elif "exit mode" in text or "menu" in text:
            exit_requested = True
    except:
        pass

def start_background_listening():
    recognizer = sr.Recognizer()
    with ignore_stderr():
        mic = sr.Microphone()
        with mic as source:
            recognizer.adjust_for_ambient_noise(source)
        stop_fn = recognizer.listen_in_background(mic, voice_callback)
    return stop_fn

# ---------- Feature Main Loop ----------
def run_appliance_mode():
    global toggle_requested, exit_requested
    toggle_requested = False
    exit_requested = False

    print("\n--- Appliance Control Mode ---")
    print("Say 'toggle light' to detect and toggle, 'exit mode' to return to menu.")
    if not HEADLESS:
        print("Press 'q' in the window to exit.")

    # Start background listening
    stop_listening = start_background_listening()

    picam2 = Picamera2()
    picam2.configure(picam2.create_preview_configuration(main={"size": (640, 480)}))
    picam2.start()
    time.sleep(2)

    last_predictions = []
    last_detection_time = 0
    DETECTION_COOLDOWN = 2  # seconds

    try:
        while not exit_requested:
            frame_rgb = picam2.capture_array()
            frame = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)

            if toggle_requested and (time.time() - last_detection_time) > DETECTION_COOLDOWN:
                print("Toggle requested – running detection...")
                last_predictions = detect_bulb_from_frame(frame)
                last_detection_time = time.time()
                if should_toggle(last_predictions):
                    print("Bulb detected – toggling light.")
                    toggle_light()
                else:
                    print("No bulb detected.")
                toggle_requested = False

            # Prepare display
            display_frame = frame.copy()
            draw_predictions(display_frame, last_predictions)
            cv2.putText(display_frame, "Say 'toggle light' or 'exit mode'", (10, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            if not HEADLESS:
                cv2.imshow("Appliance Control", display_frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
            else:
                time.sleep(0.05)

    finally:
        stop_listening()
        if not HEADLESS:
            cv2.destroyAllWindows()
        picam2.stop()
        picam2.close()          # <-- Add this line
        print("Appliance mode closed.")
