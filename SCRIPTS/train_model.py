import os
import json
import numpy as np
import tensorflow as tf

from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Input,
    Masking,
    Bidirectional,
    LSTM,
    Dense,
    Dropout
)
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint
)
from tensorflow.keras.utils import to_categorical


# ============================================================
# SIGNOVA - BI-LSTM MODEL TRAINING
# STEP 5: TRAIN SIGN LANGUAGE SENTENCE CLASSIFIER
# ============================================================

print("=" * 70)
print("SIGNOVA - BI-LSTM MODEL TRAINING")
print("=" * 70)


# ============================================================
# PATHS
# ============================================================

LANDMARK_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\MVP"

MODEL_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\MODELS"

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# FILE PATHS
# ============================================================

TRAIN_X_PATH = os.path.join(
    LANDMARK_DIR,
    "train_X.npy"
)

TRAIN_Y_PATH = os.path.join(
    LANDMARK_DIR,
    "train_y.npy"
)

VALIDATION_X_PATH = os.path.join(
    LANDMARK_DIR,
    "validation_X.npy"
)

VALIDATION_Y_PATH = os.path.join(
    LANDMARK_DIR,
    "validation_y.npy"
)

TEST_X_PATH = os.path.join(
    LANDMARK_DIR,
    "test_X.npy"
)

TEST_Y_PATH = os.path.join(
    LANDMARK_DIR,
    "test_y.npy"
)


# ============================================================
# MODEL OUTPUT FILES
# ============================================================

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "signova_bilstm.keras"
)

LABEL_ENCODER_PATH = os.path.join(
    MODEL_DIR,
    "label_encoder.json"
)


# ============================================================
# SETTINGS
# ============================================================

SEQUENCE_LENGTH = 30

FEATURE_SIZE = 126

EPOCHS = 50

BATCH_SIZE = 16


# ============================================================
# CHECK FILES
# ============================================================

print("\nChecking dataset files...")

required_files = [
    TRAIN_X_PATH,
    TRAIN_Y_PATH,
    VALIDATION_X_PATH,
    VALIDATION_Y_PATH,
    TEST_X_PATH,
    TEST_Y_PATH
]

for file_path in required_files:

    if not os.path.exists(file_path):

        print("\nERROR: File not found:")

        print(file_path)

        exit()

    print("FOUND:", file_path)


# ============================================================
# LOAD DATA
# ============================================================

print("\nLoading datasets...")


X_train = np.load(
    TRAIN_X_PATH
).astype(np.float32)


y_train = np.load(
    TRAIN_Y_PATH,
    allow_pickle=True
)


X_validation = np.load(
    VALIDATION_X_PATH
).astype(np.float32)


y_validation = np.load(
    VALIDATION_Y_PATH,
    allow_pickle=True
)


X_test = np.load(
    TEST_X_PATH
).astype(np.float32)


y_test = np.load(
    TEST_Y_PATH,
    allow_pickle=True
)


# ============================================================
# DISPLAY DATASET SHAPES
# ============================================================

print("\nDataset shapes:")

print(
    "X_train:",
    X_train.shape
)

print(
    "y_train:",
    y_train.shape
)

print(
    "X_validation:",
    X_validation.shape
)

print(
    "y_validation:",
    y_validation.shape
)

print(
    "X_test:",
    X_test.shape
)

print(
    "y_test:",
    y_test.shape
)


# ============================================================
# CHECK INPUT SHAPE
# ============================================================

if X_train.ndim != 3:

    print(
        "\nERROR: X_train must have 3 dimensions."
    )

    print(
        "Expected: (samples, 30, 126)"
    )

    print(
        "Received:",
        X_train.shape
    )

    exit()


if X_train.shape[1] != SEQUENCE_LENGTH:

    print(
        "\nERROR: Wrong sequence length."
    )

    print(
        "Expected:",
        SEQUENCE_LENGTH
    )

    print(
        "Received:",
        X_train.shape[1]
    )

    exit()


if X_train.shape[2] != FEATURE_SIZE:

    print(
        "\nERROR: Wrong feature size."
    )

    print(
        "Expected:",
        FEATURE_SIZE
    )

    print(
        "Received:",
        X_train.shape[2]
    )

    exit()


# ============================================================
# CONVERT LABELS TO STRING
# ============================================================

y_train = np.array(
    [str(label) for label in y_train]
)

y_validation = np.array(
    [str(label) for label in y_validation]
)

y_test = np.array(
    [str(label) for label in y_test]
)


# ============================================================
# CREATE LABEL ENCODER
# ============================================================

print("\nEncoding sentence labels...")


label_encoder = LabelEncoder()


# IMPORTANT:
# Fit using all labels so validation/test labels
# can also be encoded if they exist in the dataset.

all_labels = np.concatenate(
    [
        y_train,
        y_validation,
        y_test
    ]
)


label_encoder.fit(
    all_labels
)


# ============================================================
# ENCODE LABELS
# ============================================================

try:

    y_train_encoded = label_encoder.transform(
        y_train
    )

    y_validation_encoded = label_encoder.transform(
        y_validation
    )

    y_test_encoded = label_encoder.transform(
        y_test
    )

except ValueError as e:

    print(
        "\nERROR: Unknown label found."
    )

    print(e)

    exit()


# ============================================================
# NUMBER OF CLASSES
# ============================================================

NUM_CLASSES = len(
    label_encoder.classes_
)


print(
    "\nNumber of unique sentences:",
    NUM_CLASSES
)


# ============================================================
# DISPLAY LABELS
# ============================================================

print("\nSentence classes:")

for index, label in enumerate(
    label_encoder.classes_
):

    print(
        index,
        "->",
        label
    )


# ============================================================
# CONVERT TO ONE-HOT
# ============================================================

y_train_categorical = to_categorical(

    y_train_encoded,

    num_classes=NUM_CLASSES
)


y_validation_categorical = to_categorical(

    y_validation_encoded,

    num_classes=NUM_CLASSES
)


y_test_categorical = to_categorical(

    y_test_encoded,

    num_classes=NUM_CLASSES
)


# ============================================================
# BUILD BI-LSTM MODEL
# ============================================================

print("\nBuilding Bi-LSTM model...")


model = Sequential(

    [

        Input(
            shape=(
                SEQUENCE_LENGTH,
                FEATURE_SIZE
            )
        ),


        # Ignore padded zero frames

        Masking(
            mask_value=0.0
        ),


        # First BiLSTM

        Bidirectional(

            LSTM(
                128,
                return_sequences=True
            )

        ),


        Dropout(
            0.3
        ),


        # Second BiLSTM

        Bidirectional(

            LSTM(
                64,
                return_sequences=False
            )

        ),


        Dropout(
            0.3
        ),


        # Dense classification layer

        Dense(
            128,
            activation="relu"
        ),


        Dropout(
            0.3
        ),


        # Output layer

        Dense(
            NUM_CLASSES,
            activation="softmax"
        )

    ]

)


# ============================================================
# COMPILE MODEL
# ============================================================

model.compile(

    optimizer=tf.keras.optimizers.Adam(

        learning_rate=0.001

    ),

    loss="categorical_crossentropy",

    metrics=[
        "accuracy"
    ]

)


# ============================================================
# DISPLAY MODEL
# ============================================================

print("\nModel architecture:")

model.summary()


# ============================================================
# CALLBACKS
# ============================================================

early_stopping = EarlyStopping(

    monitor="val_loss",

    patience=8,

    restore_best_weights=True

)


model_checkpoint = ModelCheckpoint(

    MODEL_PATH,

    monitor="val_accuracy",

    save_best_only=True,

    mode="max",

    verbose=1

)


# ============================================================
# TRAIN MODEL
# ============================================================

print("\n")

print("=" * 70)

print("STARTING BI-LSTM TRAINING")

print("=" * 70)


history = model.fit(

    X_train,

    y_train_categorical,

    validation_data=(

        X_validation,

        y_validation_categorical

    ),

    epochs=EPOCHS,

    batch_size=BATCH_SIZE,

    callbacks=[

        early_stopping,

        model_checkpoint

    ],

    verbose=1

)


# ============================================================
# EVALUATE MODEL
# ============================================================

print("\n")

print("=" * 70)

print("EVALUATING MODEL ON TEST DATA")

print("=" * 70)


test_loss, test_accuracy = model.evaluate(

    X_test,

    y_test_categorical,

    verbose=1

)


print("\nTest Loss:")

print(
    test_loss
)


print("\nTest Accuracy:")

print(
    test_accuracy
)


print(

    "\nTest Accuracy Percentage:",

    round(
        test_accuracy * 100,
        2
    ),

    "%"

)


# ============================================================
# SAVE FINAL MODEL
# ============================================================

print("\nSaving final model...")


model.save(

    MODEL_PATH

)


print(

    "Model saved:",

    MODEL_PATH

)


# ============================================================
# SAVE LABEL ENCODER
# ============================================================

print("\nSaving sentence labels...")


label_mapping = {

    str(index): str(label)

    for index, label

    in enumerate(
        label_encoder.classes_
    )

}


with open(

    LABEL_ENCODER_PATH,

    "w",

    encoding="utf-8"

) as file:

    json.dump(

        label_mapping,

        file,

        indent=4,

        ensure_ascii=False

    )


print(

    "Label encoder saved:",

    LABEL_ENCODER_PATH

)


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n")

print("=" * 70)

print("STEP 5 - MODEL TRAINING COMPLETE")

print("=" * 70)


print(

    "\nTraining samples:",

    len(X_train)

)


print(

    "Validation samples:",

    len(X_validation)

)


print(

    "Test samples:",

    len(X_test)

)


print(

    "Number of classes:",

    NUM_CLASSES

)


print(

    "Final test accuracy:",

    round(
        test_accuracy * 100,
        2
    ),

    "%"

)


print("\nModel file:")

print(
    MODEL_PATH
)


print("\nLabel file:")

print(
    LABEL_ENCODER_PATH
)


print("\nNext step:")

print(

    "Create live webcam Sign Language prediction"

)


print("\n")

print("=" * 70)

print("SIGNOVA BI-LSTM TRAINING FINISHED")

print("=" * 70)

