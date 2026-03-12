#!/usr/bin/env python3
"""
Real-time translator from any language to English using Raspberry Pi camera and Groq API.
Optimized for OCR accuracy, speed, and frame processing efficiency.
This module can be run standalone or imported and called via run_translator_mode().
"""

import os
import cv2
import pytesseract
from groq import Groq
import numpy as np
from picamera2 import Picamera2
from dotenv import load_dotenv

# ===== LOAD ENVIRONMENT VARIABLES =====
load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file or environment variables")

SOURCE_LANG = os.environ.get("SOURCE_LANG", "English").strip().capitalize()

TESSERACT_LANG_MAP = {
    "English": "eng",
    "Hindi": "hin",
    "Spanish": "spa",
    "French": "fra",
    "German": "deu",
    "Italian": "ita",
    "Portuguese": "por",
    "Russian": "rus",
    "Japanese": "jpn",
    "Chinese": "chi_sim",
    "Arabic": "ara",
}

TESSERACT_LANG = TESSERACT_LANG_MAP.get(SOURCE_LANG, "eng")

if TESSERACT_LANG == "eng" and SOURCE_LANG != "English":
    print(f"Warning: No Tesseract code for '{SOURCE_LANG}'. Falling back to English OCR.")

client = Groq(api_key=GROQ_API_KEY)

# ===== CAMERA SETTINGS =====
FRAME_SKIP = 30

TRANSLATION_PROMPT = f"Translate the following text from {SOURCE_LANG} to English. Return only the translation:\n\n"

# ===== PREALLOCATED KERNELS (FASTER) =====
kernel = np.ones((2,2), np.uint8)

# ===== OCR FUNCTION =====
def extract_text_from_image(image):
    # Resize (faster OCR on Raspberry Pi)
    image = cv2.resize(image, None, fx=0.7, fy=0.7)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Denoise
    gray = cv2.medianBlur(gray, 3)

    # Sharpen image
    sharpen_kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
    gray = cv2.filter2D(gray, -1, sharpen_kernel)

    # Adaptive threshold (better lighting handling)
    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )

    # Morphological cleanup
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    # OCR configuration
    config = "--oem 3 --psm 6"

    text = pytesseract.image_to_string(
        thresh,
        lang=TESSERACT_LANG,
        config=config
    )

    # Clean text
    text = " ".join(text.split())

    return text.strip()

# ===== TRANSLATION FUNCTION =====
def translate_text(text):
    if not text:
        return ""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a translator. Translate the given {SOURCE_LANG} text to English accurately. "
                },
                {
                    "role": "user",
                    "content": TRANSLATION_PROMPT + text
                }
            ],
            temperature=0.3,
            max_tokens=100
        )

        translation = response.choices[0].message.content.strip()
        return translation

    except Exception as e:
        print(f"Translation error: {e}")
        return "[Translation failed]"

# ===== TEXT PRESENCE CHECK (SPEED OPTIMIZATION) =====
def likely_contains_text(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    edge_count = np.sum(edges)
    # Skip OCR if almost no edges (no text)
    return edge_count > 2000

# ===== TEXT WRAPPING =====
def wrap_text(text, max_len=40):
    words = text.split()
    lines = []
    line = ""

    for w in words:
        if len(line) + len(w) < max_len:
            line += w + " "
        else:
            lines.append(line)
            line = w + " "

    lines.append(line)
    return lines

# ===== MAIN TRANSLATOR LOOP (CALLED FROM MENU) =====
def run_translator_mode():
    """Starts the camera, runs OCR/translation loop, and displays results.
       Returns when the user presses 'q'."""
    picam2 = Picamera2()
    config = picam2.create_preview_configuration(main={"size": (640, 480)})
    picam2.configure(config)
    picam2.start()

    frame_count = 0
    last_text = ""
    last_translation = ""

    print(f"Real-time Translator running. Source language: {SOURCE_LANG} → English. Press 'q' to quit.")

    try:
        while True:
            frame_rgb = picam2.capture_array()
            frame = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)

            if frame_count % FRAME_SKIP == 0:
                # Skip OCR if no text likely
                if likely_contains_text(frame):
                    extracted = extract_text_from_image(frame)
                    if extracted and extracted != last_text:
                        last_text = extracted
                        print(f"Extracted ({SOURCE_LANG}): {extracted}")
                        last_translation = translate_text(extracted)
                        print(f"Translated (English): {last_translation}")

            # ===== DISPLAY =====
            display_frame = frame.copy()

            # Source text overlay removed – only translation is shown
            if last_translation:
                lines = wrap_text(last_translation)
                y_offset = 60  # You can change this to 30 if you want the translation higher
                for line in lines:
                    cv2.putText(
                        display_frame,
                        f"EN: {line}",
                        (10, y_offset),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0,0,255),
                        2
                    )
                    y_offset += 30

            cv2.imshow("Translator", display_frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

            frame_count += 1
    finally:
        cv2.destroyAllWindows()
        picam2.stop()
        picam2.close()          # <-- Add this line
        print("Translator mode exited.")
# Allow standalone execution for testing
if __name__ == "__main__":
    run_translator_mode()
