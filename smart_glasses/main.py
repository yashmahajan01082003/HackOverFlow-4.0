#!/usr/bin/env python3
"""
Smart Glasses Main Menu
Displays a graphical menu and waits for voice commands.
Press 'q' in the menu window to quit.
"""
import sys
import cv2
import numpy as np
import speech_recognition as sr
import contextlib
import os

# ---------- Suppress ALSA/JACK warnings during mic init ----------
@contextlib.contextmanager
def ignore_stderr():
    """Temporarily redirect stderr to os.devnull."""
    stderr_fd = os.dup(2)
    devnull = os.open(os.devnull, os.O_WRONLY)
    os.dup2(devnull, 2)
    os.close(devnull)
    try:
        yield
    finally:
        os.dup2(stderr_fd, 2)
        os.close(stderr_fd)

# ---------- Speech Recognition Setup ----------
with ignore_stderr():
    recognizer = sr.Recognizer()
    mic = sr.Microphone()
    MIC_AVAILABLE = True
print("Microphone initialised.")

def listen_for_command(timeout=2, phrase_time_limit=3):
    """Listen for a command; returns None if nothing heard or on error."""
    with ignore_stderr():
        with mic as source:
            recognizer.adjust_for_ambient_noise(source)
            try:
                audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            except sr.WaitTimeoutError:
                return None
    try:
        command = recognizer.recognize_google(audio)
        print(f"You said: {command}")
        return command.lower()
    except (sr.UnknownValueError, sr.RequestError):
        return None

# ---------- Menu Image (larger fonts) ----------
def create_menu_image(width=640, height=480):
    img = np.zeros((height, width, 3), dtype=np.uint8)
    img[:] = (30, 30, 30)  # dark gray background

    # Title
    cv2.putText(img, "SMART GLASSES MENU", (50, 100),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)

    # Instructions
    cv2.putText(img, "Voice Commands:", (50, 180),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (200, 200, 200), 2)

    # Options
    cv2.putText(img, "1. 'appliance mode'", (50, 250),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    cv2.putText(img, "2. 'translator mode'", (50, 300),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    cv2.putText(img, "3. 'exit'", (50, 350),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    # Prompt
    cv2.putText(img, "Say a command...", (50, 420),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 0), 2)

    return img

# ---------- Main Loop ----------
def main():
    cv2.namedWindow("Menu", cv2.WINDOW_NORMAL)
    try:
        while True:
            img = create_menu_image()
            cv2.imshow("Menu", img)

            cmd = listen_for_command(timeout=2)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("Quit key pressed.")
                break

            if cmd:
                if "appliance" in cmd or "bulb" in cmd:
                    cv2.destroyWindow("Menu")
                    import appliance
                    appliance.run_appliance_mode()
                    cv2.namedWindow("Menu", cv2.WINDOW_NORMAL)
                elif "translate" in cmd or "translator" in cmd:
                    cv2.destroyWindow("Menu")
                    import translator
                    translator.run_translator_mode()
                    cv2.namedWindow("Menu", cv2.WINDOW_NORMAL)
                elif "exit" in cmd or "quit" in cmd:
                    print("Exit command received.")
                    break
    finally:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(0)
