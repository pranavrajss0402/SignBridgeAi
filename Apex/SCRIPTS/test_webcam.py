import os
import json
import time
import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp
import requests

from collections import deque
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# ============================================================
# SIGNOVA - LIVE WEBCAM SIGN LANGUAGE PREDICTION
# WITH NODE.JS BACKEND CONNECTION
# ============================================================

print("=" * 70)
print("SIGNOVA - LIVE WEBCAM SIGN LANGUAGE PREDICTION")
print("=" * 70)


# ============================================================
# BACKEND SETTINGS
# ============================================================

BACKEND_URL = "http://localhost:5000/api/prediction"

last_sent_prediction = ""

last_sent_time = 0

SEND_INTERVAL = 2


# ============================================================
# PATHS
# ============================================================

BASE_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA"


MODEL_PATH = os.path.join(
    BASE_DIR,
    "MODELS",
    "signova_bilstm.keras"
)


LABEL_PATH = os.path.join(
    BASE_DIR,
    "MODELS",
    "label_encoder.json"
)


MEDIAPIPE_MODEL_PATH = os.path.join(
    BASE_DIR,
    "SCRIPTS",
    "hand_landmarker.task"
)


# ============================================================
# SETTINGS
# ============================================================

SEQUENCE_LENGTH = 30

FEATURE_SIZE = 126

CONFIDENCE_THRESHOLD = 0.30

CAMERA_INDEX = 0


# ============================================================
# CHECK REQUIRED FILES
# ============================================================

print("\nChecking required files...")


if not os.path.exists(MODEL_PATH):

    print("\nERROR: Bi-LSTM model not found!")

    print(MODEL_PATH)

    exit()


print("FOUND MODEL:")

print(MODEL_PATH)


if not os.path.exists(LABEL_PATH):

    print("\nERROR: Label encoder not found!")

    print(LABEL_PATH)

    exit()


print("FOUND LABEL FILE:")

print(LABEL_PATH)


if not os.path.exists(MEDIAPIPE_MODEL_PATH):

    print("\nERROR: MediaPipe model not found!")

    print(MEDIAPIPE_MODEL_PATH)

    exit()


print("FOUND MEDIAPIPE MODEL:")

print(MEDIAPIPE_MODEL_PATH)


# ============================================================
# LOAD BI-LSTM MODEL
# ============================================================

print("\nLoading Bi-LSTM model...")


try:

    model = tf.keras.models.load_model(
        MODEL_PATH
    )

    print(
        "Bi-LSTM model loaded successfully!"
    )


except Exception as e:

    print(
        "\nERROR loading model:"
    )

    print(e)

    exit()


# ============================================================
# LOAD LABELS
# ============================================================

print("\nLoading sentence labels...")


try:

    with open(
        LABEL_PATH,
        "r",
        encoding="utf-8"
    ) as file:

        label_mapping = json.load(file)


    # Convert JSON keys from string to integer

    label_mapping = {

        int(key): value

        for key, value in label_mapping.items()

    }


    print("\nAvailable classes:")


    for index in sorted(
        label_mapping.keys()
    ):

        print(

            index,

            "->",

            label_mapping[index]

        )


except Exception as e:

    print(
        "\nERROR loading labels:"
    )

    print(e)

    exit()


# ============================================================
# CREATE MEDIAPIPE HAND LANDMARKER
# ============================================================

print(
    "\nLoading MediaPipe Hand Landmarker..."
)


try:

    base_options = python.BaseOptions(

        model_asset_path=MEDIAPIPE_MODEL_PATH

    )


    options = vision.HandLandmarkerOptions(

        base_options=base_options,

        running_mode=vision.RunningMode.VIDEO,

        num_hands=2

    )


    hand_landmarker = (

        vision.HandLandmarker.create_from_options(

            options

        )

    )


    print(

        "MediaPipe Hand Landmarker loaded successfully!"

    )


except Exception as e:

    print(

        "\nERROR loading MediaPipe:"

    )

    print(e)

    exit()


# ============================================================
# FUNCTION: EXTRACT 126 LANDMARK FEATURES
# ============================================================

def extract_landmarks(result):

    """
    Extract 126 features.

    Hand 1:
    21 landmarks × 3 = 63

    Hand 2:
    21 landmarks × 3 = 63

    Total:
    126 features

    If one hand is detected,
    the second hand is filled with zeros.

    If no hands are detected,
    all 126 values are zero.
    """

    features = []


    # --------------------------------------------------------
    # NO HANDS DETECTED
    # --------------------------------------------------------

    if not result.hand_landmarks:

        return np.zeros(

            FEATURE_SIZE,

            dtype=np.float32

        )


    # --------------------------------------------------------
    # PROCESS MAXIMUM 2 HANDS
    # --------------------------------------------------------

    for hand_landmarks in result.hand_landmarks[:2]:


        for landmark in hand_landmarks:

            features.extend(

                [

                    landmark.x,

                    landmark.y,

                    landmark.z

                ]

            )


    # --------------------------------------------------------
    # FILL MISSING FEATURES WITH ZERO
    # --------------------------------------------------------

    while len(features) < FEATURE_SIZE:

        features.append(0.0)


    # --------------------------------------------------------
    # ENSURE EXACTLY 126 FEATURES
    # --------------------------------------------------------

    features = features[:FEATURE_SIZE]


    return np.array(

        features,

        dtype=np.float32

    )


# ============================================================
# OPEN WEBCAM
# ============================================================

print(
    "\nOpening webcam..."
)


cap = cv2.VideoCapture(

    CAMERA_INDEX

)


if not cap.isOpened():

    print(

        "\nERROR: Could not open webcam."

    )

    hand_landmarker.close()

    exit()


# ============================================================
# WEBCAM SETTINGS
# ============================================================

cap.set(

    cv2.CAP_PROP_FRAME_WIDTH,

    1280

)


cap.set(

    cv2.CAP_PROP_FRAME_HEIGHT,

    720

)


# ============================================================
# FRAME BUFFER
# ============================================================

sequence = deque(

    maxlen=SEQUENCE_LENGTH

)


# ============================================================
# PREDICTION VARIABLES
# ============================================================

current_prediction = "Waiting..."

current_confidence = 0.0

last_prediction = ""

last_prediction_time = 0


# ============================================================
# MEDIAPIPE TIMESTAMP
# ============================================================

frame_timestamp_ms = 0


# ============================================================
# HAND CONNECTIONS
# ============================================================

connections = [

    (0, 1),
    (1, 2),
    (2, 3),
    (3, 4),

    (0, 5),
    (5, 6),
    (6, 7),
    (7, 8),

    (0, 9),
    (9, 10),
    (10, 11),
    (11, 12),

    (0, 13),
    (13, 14),
    (14, 15),
    (15, 16),

    (0, 17),
    (17, 18),
    (18, 19),
    (19, 20),

    (5, 9),
    (9, 13),
    (13, 17)

]


# ============================================================
# START WEBCAM
# ============================================================

print("\n")

print("=" * 70)

print("WEBCAM STARTED")

print("=" * 70)

print("\nShow a sign in front of the camera.")

print(
    "Collecting 30 frames for each prediction."
)

print(
    "\nBackend:",
    BACKEND_URL
)

print(
    "\nPress Q to quit."
)

print("=" * 70)


# ============================================================
# MAIN WEBCAM LOOP
# ============================================================

try:

    while True:


        # ====================================================
        # READ WEBCAM FRAME
        # ====================================================

        success, frame = cap.read()


        if not success:

            print(

                "\nERROR: Failed to read webcam frame."

            )

            break


        # ====================================================
        # FLIP FRAME FOR MIRROR EFFECT
        # ====================================================

        frame = cv2.flip(

            frame,

            1

        )


        # ====================================================
        # GET FRAME DIMENSIONS
        # ====================================================

        frame_height, frame_width = frame.shape[:2]


        # ====================================================
        # CONVERT BGR TO RGB
        # ====================================================

        rgb_frame = cv2.cvtColor(

            frame,

            cv2.COLOR_BGR2RGB

        )


        # ====================================================
        # CREATE MEDIAPIPE IMAGE
        # ====================================================

        mp_image = mp.Image(

            image_format=mp.ImageFormat.SRGB,

            data=rgb_frame

        )


        # ====================================================
        # TIMESTAMP
        # ====================================================

        frame_timestamp_ms = int(

            time.time() * 1000

        )


        # ====================================================
        # DETECT HANDS
        # ====================================================

        try:

            result = hand_landmarker.detect_for_video(

                mp_image,

                frame_timestamp_ms

            )


        except Exception as e:

            print(

                "\nMediaPipe detection error:",

                e

            )

            continue


        # ====================================================
        # DRAW HAND LANDMARKS
        # ====================================================

        if result.hand_landmarks:


            for hand_landmarks in result.hand_landmarks:


                # --------------------------------------------
                # DRAW LANDMARK POINTS
                # --------------------------------------------

                for landmark in hand_landmarks:


                    x = int(

                        landmark.x *

                        frame_width

                    )


                    y = int(

                        landmark.y *

                        frame_height

                    )


                    cv2.circle(

                        frame,

                        (
                            x,
                            y
                        ),

                        5,

                        (
                            0,
                            255,
                            0
                        ),

                        -1

                    )


                # --------------------------------------------
                # DRAW HAND CONNECTIONS
                # --------------------------------------------

                for start, end in connections:


                    x1 = int(

                        hand_landmarks[start].x *

                        frame_width

                    )


                    y1 = int(

                        hand_landmarks[start].y *

                        frame_height

                    )


                    x2 = int(

                        hand_landmarks[end].x *

                        frame_width

                    )


                    y2 = int(

                        hand_landmarks[end].y *

                        frame_height

                    )


                    cv2.line(

                        frame,

                        (
                            x1,
                            y1
                        ),

                        (
                            x2,
                            y2
                        ),

                        (
                            0,
                            255,
                            0
                        ),

                        2

                    )


        # ====================================================
        # EXTRACT LANDMARK FEATURES
        # ====================================================

        features = extract_landmarks(

            result

        )


        # ====================================================
        # ADD FEATURES TO SEQUENCE
        # ====================================================

        sequence.append(

            features

        )


        # ====================================================
        # DISPLAY FRAME COUNT
        # ====================================================

        frame_count_text = (

            f"Frames: "

            f"{len(sequence)}"

            f"/"

            f"{SEQUENCE_LENGTH}"

        )


        cv2.putText(

            frame,

            frame_count_text,

            (
                20,
                40
            ),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.8,

            (
                255,
                255,
                255
            ),

            2

        )


        # ====================================================
        # PREDICT WHEN 30 FRAMES AVAILABLE
        # ====================================================

        if len(sequence) == SEQUENCE_LENGTH:


            # ------------------------------------------------
            # CONVERT SEQUENCE TO NUMPY
            # ------------------------------------------------

            input_sequence = np.array(

                sequence,

                dtype=np.float32

            )


            # ------------------------------------------------
            # ADD BATCH DIMENSION
            #
            # (30, 126)
            #
            # TO
            #
            # (1, 30, 126)
            # ------------------------------------------------

            input_sequence = np.expand_dims(

                input_sequence,

                axis=0

            )


            # ------------------------------------------------
            # MODEL PREDICTION
            # ------------------------------------------------

            try:

                predictions = model(

                    input_sequence,

                    training=False

                ).numpy()


            except Exception as e:

                print(

                    "\nModel prediction error:",

                    e

                )

                continue


            # ------------------------------------------------
            # GET PREDICTED CLASS
            # ------------------------------------------------

            predicted_index = int(

                np.argmax(

                    predictions[0]

                )

            )


            # ------------------------------------------------
            # GET CONFIDENCE
            # ------------------------------------------------

            confidence = float(

                np.max(

                    predictions[0]

                )

            )


            # ------------------------------------------------
            # GET SENTENCE
            # ------------------------------------------------

            predicted_sentence = label_mapping.get(

                predicted_index,

                "Unknown"

            )


            # =================================================
            # UPDATE DISPLAY PREDICTION
            # =================================================

            if confidence >= CONFIDENCE_THRESHOLD:


                current_prediction = (

                    predicted_sentence

                )


                current_confidence = (

                    confidence

                )


            else:


                current_prediction = (

                    "Not confident"

                )


                current_confidence = (

                    confidence

                )


            # =================================================
            # CURRENT TIME
            # =================================================

            current_time = time.time()


            # =================================================
            # PRINT PREDICTION TO TERMINAL
            # =================================================

            if (

                predicted_sentence != last_prediction

                or

                current_time -

                last_prediction_time

                > 2

            ):


                print(

                    "\nPrediction:",

                    predicted_sentence

                )


                print(

                    "Confidence:",

                    round(

                        confidence * 100,

                        2

                    ),

                    "%"

                )


                last_prediction = (

                    predicted_sentence

                )


                last_prediction_time = (

                    current_time

                )


            # =================================================
            # SEND PREDICTION TO NODE.JS BACKEND
            # =================================================

            if (

                confidence >= CONFIDENCE_THRESHOLD

                and

                (

                    predicted_sentence !=

                    last_sent_prediction

                    or

                    current_time -

                    last_sent_time

                    >= SEND_INTERVAL

                )

            ):


                try:


                    response = requests.post(

                        BACKEND_URL,

                        json={

                            "text":

                            predicted_sentence,

                            "confidence":

                            round(

                                confidence * 100,

                                2

                            )

                        },

                        timeout=1

                    )


                    if response.status_code == 200:


                        print(

                            "Sent to backend:",

                            predicted_sentence,

                            round(

                                confidence * 100,

                                2

                            ),

                            "%"

                        )


                        last_sent_prediction = (

                            predicted_sentence

                        )


                        last_sent_time = (

                            current_time

                        )


                    else:


                        print(

                            "Backend returned status:",

                            response.status_code

                        )


                except requests.exceptions.RequestException as e:


                    print(

                        "Backend connection error:",

                        e

                    )


        # ====================================================
        # DISPLAY PREDICTION PANEL
        # ====================================================

        cv2.rectangle(

            frame,

            (
                10,
                frame_height - 130
            ),

            (
                frame_width - 10,
                frame_height - 10
            ),

            (
                30,
                30,
                30
            ),

            -1

        )


        # ====================================================
        # DISPLAY PREDICTION
        # ====================================================

        prediction_text = (

            "Prediction: "

            +

            current_prediction

        )


        cv2.putText(

            frame,

            prediction_text,

            (
                30,
                frame_height - 85
            ),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.9,

            (
                255,
                255,
                255
            ),

            2

        )


        # ====================================================
        # DISPLAY CONFIDENCE
        # ====================================================

        confidence_text = (

            "Confidence: "

            +

            str(

                round(

                    current_confidence * 100,

                    1

                )

            )

            +

            "%"

        )


        cv2.putText(

            frame,

            confidence_text,

            (
                30,
                frame_height - 45
            ),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.8,

            (
                255,
                255,
                255
            ),

            2

        )


        # ====================================================
        # DISPLAY WEBCAM
        # ====================================================

        cv2.imshow(

            "SIGNOVA - Sign Language Recognition",

            frame

        )


        # ====================================================
        # PRESS Q TO QUIT
        # ====================================================

        key = cv2.waitKey(

            1

        ) & 0xFF


        if key == ord("q"):

            break


# ============================================================
# KEYBOARD INTERRUPT
# ============================================================

except KeyboardInterrupt:

    print(

        "\n\nWebcam stopped by user."

    )


# ============================================================
# GENERAL ERROR
# ============================================================

except Exception as e:

    print(

        "\nUnexpected error:",

        e

    )


# ============================================================
# CLEANUP
# ============================================================

finally:


    print(

        "\nClosing webcam..."

    )


    cap.release()


    cv2.destroyAllWindows()


    hand_landmarker.close()


    print("\n")

    print("=" * 70)

    print("SIGNOVA WEBCAM TEST FINISHED")

    print("=" * 70)