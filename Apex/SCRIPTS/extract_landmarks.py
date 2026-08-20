import os
import cv2
import numpy as np
import pandas as pd
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# ============================================================
# SIGNOVA - FULL DATASET HAND LANDMARK EXTRACTION
# STEP 4: CREATE TRAINING DATASET
#
# FIXED VERSION
#
# Main fixes:
# 1. No cap.set() random seeking
# 2. Frames are read sequentially
# 3. MediaPipe timestamps are ALWAYS increasing
# 4. Timestamp is global across all videos
# 5. Exactly 30 frames per video
# 6. Each frame has 126 features
# 7. Better error handling
# ============================================================


print("=" * 70)
print("SIGNOVA - FULL DATASET HAND LANDMARK EXTRACTION")
print("=" * 70)


# ============================================================
# PATHS
# ============================================================

PROCESSED_DIR = (
    r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\MVP"
)

MODEL_PATH = (
    r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\SCRIPTS\hand_landmarker.task"
)

OUTPUT_DIR = (
    r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\MVP"
)


# Create output directory if it does not exist

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# ============================================================
# SETTINGS
# ============================================================

# Every video will have exactly 30 frames

SEQUENCE_LENGTH = 30


# 21 hand landmarks
# Each landmark has:
# x, y, z
#
# One hand:
# 21 * 3 = 63
#
# Two hands:
# 63 * 2 = 126

FEATURE_SIZE = 126


# ============================================================
# DATASET FILES
# ============================================================

DATASETS = {

    "train": os.path.join(
        PROCESSED_DIR,
        "train.csv"
    ),

    "validation": os.path.join(
        PROCESSED_DIR,
        "validation.csv"
    ),

    "test": os.path.join(
        PROCESSED_DIR,
        "test.csv"
    )

}


# ============================================================
# CHECK MEDIAPIPE MODEL
# ============================================================

print("\nChecking MediaPipe model...")


if not os.path.exists(MODEL_PATH):

    print("\nERROR: MediaPipe model not found!")

    print(
        "Expected model path:"
    )

    print(
        MODEL_PATH
    )

    raise FileNotFoundError(
        MODEL_PATH
    )


print(
    "MediaPipe model found!"
)

print(
    MODEL_PATH
)


# ============================================================
# CREATE MEDIAPIPE HAND LANDMARKER
# ============================================================

print(
    "\nLoading MediaPipe Hand Landmarker..."
)


base_options = python.BaseOptions(

    model_asset_path=MODEL_PATH

)


options = vision.HandLandmarkerOptions(

    base_options=base_options,

    # VIDEO mode requires increasing timestamps

    running_mode=vision.RunningMode.VIDEO,

    num_hands=2,

    min_hand_detection_confidence=0.5,

    min_hand_presence_confidence=0.5,

    min_tracking_confidence=0.5

)


detector = vision.HandLandmarker.create_from_options(

    options

)


print(
    "MediaPipe Hand Landmarker loaded successfully!"
)


# ============================================================
# GLOBAL TIMESTAMP
#
# IMPORTANT:
#
# MediaPipe VIDEO mode requires timestamps to be monotonically
# increasing.
#
# This value MUST NOT reset when a new video starts.
# ============================================================

GLOBAL_TIMESTAMP_MS = 0


# ============================================================
# FUNCTION:
# GET EXACTLY 30 FRAME INDICES
# ============================================================

def get_frame_indices(total_frames):

    """
    Return exactly 30 frame indices.

    If video has:
        >= 30 frames:
            Select 30 evenly spaced frames.

        < 30 frames:
            Select all available frames.
            Remaining frames will be zero-padded later.
    """

    if total_frames <= 0:

        return np.array(
            [],
            dtype=np.int32
        )


    if total_frames >= SEQUENCE_LENGTH:

        indices = np.linspace(

            0,

            total_frames - 1,

            SEQUENCE_LENGTH

        ).astype(
            np.int32
        )

        return indices


    else:

        return np.arange(

            total_frames,

            dtype=np.int32

        )


# ============================================================
# FUNCTION:
# EXTRACT LANDMARKS FROM ONE VIDEO
# ============================================================

def extract_landmarks_from_video(video_path):

    global GLOBAL_TIMESTAMP_MS


    # --------------------------------------------------------
    # OPEN VIDEO
    # --------------------------------------------------------

    cap = cv2.VideoCapture(
        video_path
    )


    if not cap.isOpened():

        print(
            "   ERROR: Cannot open video"
        )

        return None


    # --------------------------------------------------------
    # VIDEO INFORMATION
    # --------------------------------------------------------

    total_frames = int(

        cap.get(
            cv2.CAP_PROP_FRAME_COUNT
        )

    )


    fps = cap.get(

        cv2.CAP_PROP_FPS

    )


    if fps <= 0 or np.isnan(fps):

        fps = 30.0


    if total_frames <= 0:

        print(
            "   ERROR: Video contains no frames"
        )

        cap.release()

        return None


    # --------------------------------------------------------
    # GET 30 FRAME INDICES
    # --------------------------------------------------------

    frame_indices = get_frame_indices(

        total_frames

    )


    # Convert selected indices to a set
    # This allows fast lookup while reading sequentially

    selected_frames = set(

        int(i)

        for i in frame_indices

    )


    # --------------------------------------------------------
    # STORAGE
    # --------------------------------------------------------

    all_features = []


    current_frame_index = 0


    # --------------------------------------------------------
    # READ VIDEO SEQUENTIALLY
    #
    # IMPORTANT:
    #
    # We DO NOT use:
    #
    # cap.set(CAP_PROP_POS_FRAMES, ...)
    #
    # because random seeking caused timestamp problems.
    # --------------------------------------------------------

    while True:

        success, frame = cap.read()


        # End of video

        if not success:

            break


        # ----------------------------------------------------
        # PROCESS ONLY SELECTED FRAMES
        # ----------------------------------------------------

        if current_frame_index in selected_frames:


            # ------------------------------------------------
            # CONVERT BGR TO RGB
            # ------------------------------------------------

            image_rgb = cv2.cvtColor(

                frame,

                cv2.COLOR_BGR2RGB

            )


            # ------------------------------------------------
            # CREATE MEDIAPIPE IMAGE
            # ------------------------------------------------

            mp_image = mp.Image(

                image_format=mp.ImageFormat.SRGB,

                data=image_rgb

            )


            # ------------------------------------------------
            # CREATE GLOBAL MONOTONIC TIMESTAMP
            #
            # Every MediaPipe call gets a timestamp greater
            # than the previous call.
            # ------------------------------------------------

            GLOBAL_TIMESTAMP_MS += 1


            timestamp_ms = GLOBAL_TIMESTAMP_MS


            # ------------------------------------------------
            # DEFAULT EMPTY HANDS
            # ------------------------------------------------

            left_hand = np.zeros(

                63,

                dtype=np.float32

            )


            right_hand = np.zeros(

                63,

                dtype=np.float32

            )


            # ------------------------------------------------
            # RUN MEDIAPIPE
            # ------------------------------------------------

            try:

                results = detector.detect_for_video(

                    mp_image,

                    timestamp_ms

                )


            except Exception as e:

                print(

                    "   WARNING: MediaPipe error:",

                    str(e)

                )


                # Keep zero features for this frame

                features = np.zeros(

                    FEATURE_SIZE,

                    dtype=np.float32

                )


                all_features.append(

                    features

                )


                current_frame_index += 1

                continue


            # ------------------------------------------------
            # PROCESS DETECTED HANDS
            # ------------------------------------------------

            if (

                results.hand_landmarks

                and

                len(results.hand_landmarks) > 0

            ):


                for hand_index, hand_landmarks in enumerate(

                    results.hand_landmarks

                ):


                    # Only process maximum 2 hands

                    if hand_index >= 2:

                        break


                    # ----------------------------------------
                    # EXTRACT x, y, z
                    # ----------------------------------------

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


                    # Safety check

                    if len(landmarks) != 63:

                        continue


                    # ----------------------------------------
                    # GET HAND LABEL
                    # ----------------------------------------

                    try:

                        handedness = (

                            results.handedness[

                                hand_index

                            ][0].category_name

                        ).lower()


                    except Exception:

                        handedness = "right"


                    # ----------------------------------------
                    # STORE LEFT / RIGHT HAND
                    # ----------------------------------------

                    if handedness == "left":

                        left_hand = landmarks


                    else:

                        right_hand = landmarks


            # ------------------------------------------------
            # COMBINE BOTH HANDS
            #
            # 63 + 63 = 126
            # ------------------------------------------------

            features = np.concatenate(

                [

                    left_hand,

                    right_hand

                ]

            )


            # ------------------------------------------------
            # ADD FRAME FEATURES
            # ------------------------------------------------

            all_features.append(

                features

            )


        # Move to next video frame

        current_frame_index += 1


    # --------------------------------------------------------
    # RELEASE VIDEO
    # --------------------------------------------------------

    cap.release()


    # --------------------------------------------------------
    # CHECK EXTRACTION
    # --------------------------------------------------------

    if len(all_features) == 0:

        print(
            "   ERROR: No frames extracted"
        )

        return None


    # --------------------------------------------------------
    # CONVERT TO NUMPY
    # --------------------------------------------------------

    all_features = np.array(

        all_features,

        dtype=np.float32

    )


    # --------------------------------------------------------
    # PAD IF LESS THAN 30 FRAMES
    # --------------------------------------------------------

    if len(all_features) < SEQUENCE_LENGTH:


        padding_size = (

            SEQUENCE_LENGTH

            -

            len(all_features)

        )


        padding = np.zeros(

            (

                padding_size,

                FEATURE_SIZE

            ),

            dtype=np.float32

        )


        all_features = np.concatenate(

            [

                all_features,

                padding

            ],

            axis=0

        )


    # --------------------------------------------------------
    # TRIM IF MORE THAN 30 FRAMES
    # --------------------------------------------------------

    elif len(all_features) > SEQUENCE_LENGTH:


        all_features = all_features[

            :SEQUENCE_LENGTH

        ]


    # --------------------------------------------------------
    # FINAL SAFETY CHECK
    # --------------------------------------------------------

    if all_features.shape != (

        SEQUENCE_LENGTH,

        FEATURE_SIZE

    ):

        print(

            "   ERROR: Invalid feature shape:",

            all_features.shape

        )

        return None


    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return all_features


# ============================================================
# PROCESS EACH DATASET
# ============================================================

try:


    for dataset_name, csv_path in DATASETS.items():


        print("\n")

        print("=" * 70)

        print(

            "PROCESSING:",

            dataset_name.upper()

        )

        print("=" * 70)


        # ----------------------------------------------------
        # CHECK CSV
        # ----------------------------------------------------

        if not os.path.exists(csv_path):

            print(

                "ERROR: CSV file not found:"

            )

            print(

                csv_path

            )

            continue


        # ----------------------------------------------------
        # LOAD CSV
        # ----------------------------------------------------

        df = pd.read_csv(

            csv_path

        )


        print(

            "Videos to process:",

            len(df)

        )


        # ----------------------------------------------------
        # STORAGE
        # ----------------------------------------------------

        X = []

        y = []

        video_paths = []


        successful = 0

        failed = 0


        # ----------------------------------------------------
        # PROCESS EACH VIDEO
        # ----------------------------------------------------

        for index, row in df.iterrows():


            sentence = str(

                row["sentence"]

            )


            video_path = str(

                row["video_path"]

            )


            print("\n")

            print(

                f"[{index + 1}/{len(df)}]"

            )


            print(

                "Sentence:",

                sentence

            )


            print(

                "Video:",

                os.path.basename(

                    video_path

                )

            )


            # ------------------------------------------------
            # CHECK VIDEO
            # ------------------------------------------------

            if not os.path.exists(video_path):


                print(

                    "   WARNING: Video not found"

                )


                failed += 1

                continue


            # ------------------------------------------------
            # EXTRACT LANDMARKS
            # ------------------------------------------------

            landmarks = extract_landmarks_from_video(

                video_path

            )


            # ------------------------------------------------
            # CHECK RESULT
            # ------------------------------------------------

            if landmarks is None:


                print(

                    "   WARNING: Landmark extraction failed"

                )


                failed += 1

                continue


            # ------------------------------------------------
            # ADD DATA
            # ------------------------------------------------

            X.append(

                landmarks

            )


            y.append(

                sentence

            )


            video_paths.append(

                video_path

            )


            successful += 1


            print(

                "   SUCCESS"

            )


            print(

                "   Shape:",

                landmarks.shape

            )


        # ====================================================
        # SAVE DATASET
        # ====================================================

        print("\n")

        print("=" * 70)

        print(

            "SAVING",

            dataset_name.upper(),

            "DATASET"

        )

        print("=" * 70)


        # ----------------------------------------------------
        # CHECK SUCCESSFUL DATA
        # ----------------------------------------------------

        if len(X) == 0:


            print(

                "ERROR: No successful videos!"

            )

            continue


        # ----------------------------------------------------
        # CONVERT TO NUMPY
        # ----------------------------------------------------

        X = np.array(

            X,

            dtype=np.float32

        )


        y = np.array(

            y,

            dtype=object

        )


        video_paths = np.array(

            video_paths,

            dtype=object

        )


        # ----------------------------------------------------
        # SAVE FEATURES
        # ----------------------------------------------------

        features_file = os.path.join(

            OUTPUT_DIR,

            f"{dataset_name}_X.npy"

        )


        np.save(

            features_file,

            X

        )


        # ----------------------------------------------------
        # SAVE LABELS
        # ----------------------------------------------------

        labels_file = os.path.join(

            OUTPUT_DIR,

            f"{dataset_name}_y.npy"

        )


        np.save(

            labels_file,

            y,

            allow_pickle=True

        )


        # ----------------------------------------------------
        # SAVE VIDEO PATHS
        # ----------------------------------------------------

        paths_file = os.path.join(

            OUTPUT_DIR,

            f"{dataset_name}_paths.npy"

        )


        np.save(

            paths_file,

            video_paths,

            allow_pickle=True

        )


        # ====================================================
        # DATASET SUMMARY
        # ====================================================

        print("\n")

        print("=" * 70)

        print(

            dataset_name.upper(),

            "DATASET COMPLETE"

        )

        print("=" * 70)


        print(

            "\nSuccessful videos:",

            successful

        )


        print(

            "Failed videos:",

            failed

        )


        print(

            "Feature array shape:",

            X.shape

        )


        print(

            "Label array shape:",

            y.shape

        )


        print(

            "Number of unique sentences:",

            len(np.unique(y))

        )


        print("\nFiles saved:")


        print(

            features_file

        )


        print(

            labels_file

        )


        print(

            paths_file

        )


# ============================================================
# HANDLE CTRL+C
# ============================================================

except KeyboardInterrupt:


    print("\n")

    print("=" * 70)

    print("PROCESS INTERRUPTED BY USER")

    print("=" * 70)


    print(

        "\nYou pressed CTRL+C."

    )


    print(

        "The current dataset was not saved because processing was interrupted."

    )


    print(

        "\nRun the script again to start processing from the beginning."

    )


# ============================================================
# CLOSE MEDIAPIPE
# ============================================================

finally:


    detector.close()


# ============================================================
# FINAL MESSAGE
# ============================================================

print("\n")

print("=" * 70)

print(

    "STEP 4 - TRAINING DATASET CREATION COMPLETE"

)

print("=" * 70)


print("\nLandmark datasets saved in:")

print(

    OUTPUT_DIR

)


print("\nExpected files:")

print(

    "train_X.npy"

)

print(

    "train_y.npy"

)

print(

    "train_paths.npy"

)

print(

    "validation_X.npy"

)

print(

    "validation_y.npy"

)

print(

    "validation_paths.npy"

)

print(

    "test_X.npy"

)

print(

    "test_y.npy"

)

print(

    "test_paths.npy"

)


print("\n")

print("=" * 70)

print(

    "SIGNOVA LANDMARK EXTRACTION COMPLETE"

)

print("=" * 70)