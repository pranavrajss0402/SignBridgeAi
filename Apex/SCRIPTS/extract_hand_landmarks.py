"""
SIGNOVA - Full Dataset Hand Landmark Extraction
================================================
Processes all videos from the FULL dataset splits (train/val/test),
extracts MediaPipe Hand landmarks (126 features per frame, 30 frames),
and saves .npy arrays for model training.
"""

import os
import json
import cv2
import numpy as np
import pandas as pd
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# ============================================================
# PATHS
# ============================================================

FULL_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\FULL"

MODEL_PATH = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\SCRIPTS\hand_landmarker.task"

OUTPUT_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\FULL_LANDMARKS"

ENCODER_PATH = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\MODELS\label_encoder.json"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# SETTINGS
# ============================================================

SEQUENCE_LENGTH = 30
FEATURE_SIZE = 126  # 21 landmarks * 3 coords * 2 hands

# ============================================================
# LOAD LABEL ENCODER
# ============================================================

print("=" * 70)
print("SIGNOVA FULL DATASET LANDMARK EXTRACTION")
print("=" * 70)

with open(ENCODER_PATH, "r") as f:
    label_encoder = json.load(f)

print(f"Loaded label encoder with {len(label_encoder)} classes")

# ============================================================
# DATASET FILES
# ============================================================

DATASETS = {
    "train": os.path.join(FULL_DIR, "train.csv"),
    "validation": os.path.join(FULL_DIR, "validation.csv"),
    "test": os.path.join(FULL_DIR, "test.csv")
}

# ============================================================
# CHECK MEDIAPIPE MODEL
# ============================================================

print("\nChecking MediaPipe model...")
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"MediaPipe model not found: {MODEL_PATH}")
print("MediaPipe model found!")

# ============================================================
# CREATE MEDIAPIPE HAND LANDMARKER
# ============================================================

print("Loading MediaPipe Hand Landmarker...")

base_options = python.BaseOptions(model_asset_path=MODEL_PATH)

options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.3,
    min_hand_presence_confidence=0.3,
    min_tracking_confidence=0.3
)

detector = vision.HandLandmarker.create_from_options(options)
print("MediaPipe Hand Landmarker loaded!")

# ============================================================
# GLOBAL TIMESTAMP (must be monotonically increasing)
# ============================================================

GLOBAL_TIMESTAMP_MS = 0

# ============================================================
# HELPER: GET 30 EVENLY SPACED FRAME INDICES
# ============================================================

def get_frame_indices(total_frames):
    if total_frames <= 0:
        return np.array([], dtype=np.int32)
    if total_frames >= SEQUENCE_LENGTH:
        return np.linspace(0, total_frames - 1, SEQUENCE_LENGTH).astype(np.int32)
    else:
        return np.arange(total_frames, dtype=np.int32)

# ============================================================
# EXTRACT LANDMARKS FROM ONE VIDEO
# ============================================================

def extract_landmarks_from_video(video_path):
    global GLOBAL_TIMESTAMP_MS

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or np.isnan(fps):
        fps = 30.0
    if total_frames <= 0:
        cap.release()
        return None

    frame_indices = get_frame_indices(total_frames)
    selected_frames = set(int(i) for i in frame_indices)

    all_features = []
    current_frame_index = 0

    while True:
        success, frame = cap.read()
        if not success:
            break

        if current_frame_index in selected_frames:
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

            GLOBAL_TIMESTAMP_MS += 1
            timestamp_ms = GLOBAL_TIMESTAMP_MS

            left_hand = np.zeros(63, dtype=np.float32)
            right_hand = np.zeros(63, dtype=np.float32)

            try:
                results = detector.detect_for_video(mp_image, timestamp_ms)
            except Exception as e:
                features = np.zeros(FEATURE_SIZE, dtype=np.float32)
                all_features.append(features)
                current_frame_index += 1
                continue

            if results.hand_landmarks and len(results.hand_landmarks) > 0:
                for hand_index, hand_landmarks in enumerate(results.hand_landmarks):
                    if hand_index >= 2:
                        break

                    landmarks = np.array(
                        [[lm.x, lm.y, lm.z] for lm in hand_landmarks],
                        dtype=np.float32
                    ).flatten()

                    if len(landmarks) != 63:
                        continue

                    try:
                        handedness = results.handedness[hand_index][0].category_name.lower()
                    except Exception:
                        handedness = "right"

                    if handedness == "left":
                        left_hand = landmarks
                    else:
                        right_hand = landmarks

            features = np.concatenate([left_hand, right_hand])
            all_features.append(features)

        current_frame_index += 1

    cap.release()

    if len(all_features) == 0:
        return None

    all_features = np.array(all_features, dtype=np.float32)

    # Pad to 30 frames if needed
    if len(all_features) < SEQUENCE_LENGTH:
        padding = np.zeros(
            (SEQUENCE_LENGTH - len(all_features), FEATURE_SIZE),
            dtype=np.float32
        )
        all_features = np.concatenate([all_features, padding], axis=0)
    elif len(all_features) > SEQUENCE_LENGTH:
        all_features = all_features[:SEQUENCE_LENGTH]

    if all_features.shape != (SEQUENCE_LENGTH, FEATURE_SIZE):
        return None

    return all_features

# ============================================================
# PROCESS EACH DATASET SPLIT
# ============================================================

try:
    for dataset_name, csv_path in DATASETS.items():
        print("\n" + "=" * 70)
        print(f"PROCESSING: {dataset_name.upper()}")
        print("=" * 70)

        if not os.path.exists(csv_path):
            print(f"ERROR: CSV not found: {csv_path}")
            continue

        df = pd.read_csv(csv_path)
        print(f"Videos to process: {len(df)}")

        all_X = []
        all_y = []
        failed_videos = []

        for idx, row in df.iterrows():
            video_path = row["video_path"]
            sentence = row["sentence"]

            if sentence not in label_encoder:
                print(f"  SKIP: '{sentence}' not in label encoder")
                continue

            label_idx = label_encoder[sentence]
            basename = os.path.basename(video_path)

            features = extract_landmarks_from_video(video_path)

            if features is not None:
                all_X.append(features)
                all_y.append(label_idx)

                if (idx + 1) % 20 == 0 or idx == len(df) - 1:
                    print(f"  [{idx+1}/{len(df)}] OK: {basename}")
            else:
                failed_videos.append(video_path)
                print(f"  [{idx+1}/{len(df)}] FAIL: {basename}")

        # Convert to numpy arrays
        X = np.array(all_X, dtype=np.float32)
        y = np.array(all_y, dtype=np.int32)

        print(f"\nExtracted shapes: X={X.shape}, y={y.shape}")

        # Save
        np.save(os.path.join(OUTPUT_DIR, f"{dataset_name}_X.npy"), X)
        np.save(os.path.join(OUTPUT_DIR, f"{dataset_name}_y.npy"), y)

        print(f"Saved: {dataset_name}_X.npy, {dataset_name}_y.npy")

        if failed_videos:
            print(f"\nFailed videos ({len(failed_videos)}):")
            for v in failed_videos[:10]:
                print(f"  - {v}")

except KeyboardInterrupt:
    print("\nInterrupted by user.")

finally:
    detector.close()

print("\n" + "=" * 70)
print("LANDMARK EXTRACTION COMPLETE")
print("=" * 70)
