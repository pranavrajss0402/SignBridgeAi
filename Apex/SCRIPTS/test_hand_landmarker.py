import os
import cv2
import numpy as np
import pandas as pd
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# ============================================================
# SIGNOVA - TEST MEDIAPIPE HAND LANDMARKER
# ============================================================

print("=" * 70)
print("SIGNOVA - MEDIAPIPE HAND LANDMARKER TEST")
print("=" * 70)


# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

PROCESSED_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\PROCESSED"

MODEL_PATH = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\SCRIPTS\hand_landmarker.task"

OUTPUT_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\LANDMARKS"

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ------------------------------------------------------------
# LOAD TRAIN CSV
# ------------------------------------------------------------

TRAIN_CSV = os.path.join(
    PROCESSED_DIR,
    "train.csv"
)

df = pd.read_csv(TRAIN_CSV)

print("\nTotal training videos:", len(df))


# ------------------------------------------------------------
# SELECT FIRST VIDEO
# ------------------------------------------------------------

row = df.iloc[0]

sentence = row["sentence"]

video_path = row["video_path"]

print("\nTesting video:")
print(video_path)

print("\nSentence:")
print(sentence)


# ------------------------------------------------------------
# CHECK VIDEO
# ------------------------------------------------------------

if not os.path.exists(video_path):

    print("\nERROR: Video does not exist!")

    exit()


# ------------------------------------------------------------
# CHECK MODEL
# ------------------------------------------------------------

if not os.path.exists(MODEL_PATH):

    print("\nERROR: Model file not found!")

    print(MODEL_PATH)

    exit()


# ------------------------------------------------------------
# CREATE MEDIAPIPE HAND LANDMARKER
# ------------------------------------------------------------

print("\nLoading MediaPipe Hand Landmarker...")


base_options = python.BaseOptions(
    model_asset_path=MODEL_PATH
)


options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5
)


detector = vision.HandLandmarker.create_from_options(
    options
)


print("MediaPipe Hand Landmarker loaded successfully!")


# ------------------------------------------------------------
# OPEN VIDEO
# ------------------------------------------------------------

cap = cv2.VideoCapture(video_path)

if not cap.isOpened():

    print("\nERROR: Cannot open video!")

    detector.close()

    exit()


fps = cap.get(
    cv2.CAP_PROP_FPS
)

if fps <= 0:

    fps = 30.0


print("\nVideo FPS:", fps)


# ------------------------------------------------------------
# EXTRACT LANDMARKS
# ------------------------------------------------------------

frame_features = []

frame_index = 0

detected_frames = 0


print("\nExtracting landmarks...")


while True:

    success, frame = cap.read()

    if not success:

        break


    # --------------------------------------------------------
    # Convert BGR to RGB
    # --------------------------------------------------------

    image_rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )


    # --------------------------------------------------------
    # Create MediaPipe Image
    # --------------------------------------------------------

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=image_rgb
    )


    # --------------------------------------------------------
    # Timestamp
    # --------------------------------------------------------

    timestamp_ms = int(
        (frame_index / fps) * 1000
    )


    # --------------------------------------------------------
    # Detect hands
    # --------------------------------------------------------

    results = detector.detect_for_video(
        mp_image,
        timestamp_ms
    )


    # --------------------------------------------------------
    # LEFT HAND
    # --------------------------------------------------------

    left_hand = np.zeros(
        21 * 3,
        dtype=np.float32
    )


    # --------------------------------------------------------
    # RIGHT HAND
    # --------------------------------------------------------

    right_hand = np.zeros(
        21 * 3,
        dtype=np.float32
    )


    # --------------------------------------------------------
    # PROCESS DETECTED HANDS
    # --------------------------------------------------------

    if len(results.hand_landmarks) > 0:

        detected_frames += 1


        for hand_index, hand_landmarks in enumerate(
            results.hand_landmarks
        ):

            if hand_index >= 2:

                break


            landmarks = np.array(
                [
                    [
                        landmark.x,
                        landmark.y,
                        landmark.z
                    ]
                    for landmark in hand_landmarks
                ],
                dtype=np.float32
            ).flatten()


            # Determine left/right hand

            handedness = results.handedness[
                hand_index
            ][0].category_name


            if handedness.lower() == "left":

                left_hand = landmarks

            else:

                right_hand = landmarks


    # --------------------------------------------------------
    # COMBINE LEFT + RIGHT HAND
    # --------------------------------------------------------

    features = np.concatenate(
        [
            left_hand,
            right_hand
        ]
    )


    frame_features.append(
        features
    )


    frame_index += 1


# ------------------------------------------------------------
# RELEASE VIDEO
# ------------------------------------------------------------

cap.release()

detector.close()


# ------------------------------------------------------------
# CONVERT TO NUMPY
# ------------------------------------------------------------

frame_features = np.array(
    frame_features,
    dtype=np.float32
)


# ------------------------------------------------------------
# DISPLAY RESULTS
# ------------------------------------------------------------

print("\n" + "=" * 70)

print("TEST COMPLETE")

print("=" * 70)

print("\nSentence:")
print(sentence)

print("\nTotal frames processed:")
print(len(frame_features))

print("\nFrames with detected hands:")
print(detected_frames)

print("\nLandmark array shape:")
print(frame_features.shape)


# ------------------------------------------------------------
# SAVE TEST RESULT
# ------------------------------------------------------------

output_file = os.path.join(
    OUTPUT_DIR,
    "test_single_video_landmarks.npy"
)


np.save(
    output_file,
    frame_features
)


print("\nTest landmarks saved to:")

print(output_file)


print("\n" + "=" * 70)

print("MEDIAPIPE HAND LANDMARK TEST SUCCESSFUL")

print("=" * 70)