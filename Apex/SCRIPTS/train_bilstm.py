"""
SIGNOVA - Bi-LSTM Model Training (Full Dataset)
================================================
Trains a Bi-LSTM model on the full ISL_CSLRT_Corpus hand landmarks.
Input:  (30 frames, 126 features)
Output: 98 sentence classes (after dropping under-represented)
"""

import os
import json
import shutil
import numpy as np

# Suppress TF warnings
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

# ============================================================
# PATHS
# ============================================================

LANDMARKS_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\FULL_LANDMARKS"
MODELS_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\MODELS"
ENCODER_PATH = os.path.join(MODELS_DIR, "label_encoder.json")

MODEL_SAVE_PATH = os.path.join(MODELS_DIR, "signova_bilstm.keras")
MODEL_BACKUP_PATH = os.path.join(MODELS_DIR, "signova_bilstm_old.keras")

# ============================================================
# SETTINGS
# ============================================================

SEQUENCE_LENGTH = 30
FEATURE_SIZE = 126
EPOCHS = 80
BATCH_SIZE = 16
PATIENCE = 15  # early stopping patience

# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("SIGNOVA Bi-LSTM MODEL TRAINING")
print("=" * 70)

print("\nLoading data...")

train_X = np.load(os.path.join(LANDMARKS_DIR, "train_X.npy"))
train_y = np.load(os.path.join(LANDMARKS_DIR, "train_y.npy"))
val_X = np.load(os.path.join(LANDMARKS_DIR, "validation_X.npy"))
val_y = np.load(os.path.join(LANDMARKS_DIR, "validation_y.npy"))
test_X = np.load(os.path.join(LANDMARKS_DIR, "test_X.npy"))
test_y = np.load(os.path.join(LANDMARKS_DIR, "test_y.npy"))

print(f"Train:      X={train_X.shape}, y={train_y.shape}")
print(f"Validation: X={val_X.shape},  y={val_y.shape}")
print(f"Test:       X={test_X.shape},  y={test_y.shape}")

# Verify shapes
assert train_X.shape[1:] == (SEQUENCE_LENGTH, FEATURE_SIZE), \
    f"Train X shape mismatch: {train_X.shape}"
assert val_X.shape[1:] == (SEQUENCE_LENGTH, FEATURE_SIZE), \
    f"Val X shape mismatch: {val_X.shape}"

# ============================================================
# LOAD LABEL ENCODER
# ============================================================

with open(ENCODER_PATH, "r") as f:
    label_encoder = json.load(f)

NUM_CLASSES = len(label_encoder)
print(f"\nNumber of classes: {NUM_CLASSES}")

# Verify label range
all_labels = np.concatenate([train_y, val_y, test_y])
print(f"Label range: {all_labels.min()} to {all_labels.max()}")
assert all_labels.max() < NUM_CLASSES, "Label index exceeds number of classes!"

# ============================================================
# BACKUP OLD MODEL
# ============================================================

if os.path.exists(MODEL_SAVE_PATH):
    shutil.copy2(MODEL_SAVE_PATH, MODEL_BACKUP_PATH)
    print(f"\nBacked up old model to: {MODEL_BACKUP_PATH}")

# ============================================================
# BUILD BI-LSTM MODEL
# ============================================================

print("\n" + "=" * 70)
print("BUILDING MODEL")
print("=" * 70)

model = keras.Sequential([
    layers.Input(shape=(SEQUENCE_LENGTH, FEATURE_SIZE)),

    # Masking layer to handle zero-padded frames
    layers.Masking(mask_value=0.0),

    # Bi-LSTM layers
    layers.Bidirectional(
        layers.LSTM(128, return_sequences=True, dropout=0.3)
    ),
    layers.Bidirectional(
        layers.LSTM(64, return_sequences=False, dropout=0.3)
    ),

    # Dense layers
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.4),
    layers.Dense(64, activation="relu"),
    layers.Dropout(0.3),

    # Output
    layers.Dense(NUM_CLASSES, activation="softmax")
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ============================================================
# CALLBACKS
# ============================================================

cb_list = [
    callbacks.EarlyStopping(
        monitor="val_loss",
        patience=PATIENCE,
        restore_best_weights=True,
        verbose=1
    ),
    callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=5,
        min_lr=1e-6,
        verbose=1
    )
]

# ============================================================
# TRAIN
# ============================================================

print("\n" + "=" * 70)
print("TRAINING")
print("=" * 70)

history = model.fit(
    train_X, train_y,
    validation_data=(val_X, val_y),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=cb_list,
    verbose=1
)

# ============================================================
# EVALUATE
# ============================================================

print("\n" + "=" * 70)
print("EVALUATION")
print("=" * 70)

test_loss, test_accuracy = model.evaluate(test_X, test_y, verbose=0)
print(f"\nTest Loss:     {test_loss:.4f}")
print(f"Test Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.1f}%)")

val_loss, val_accuracy = model.evaluate(val_X, val_y, verbose=0)
print(f"\nVal Loss:      {val_loss:.4f}")
print(f"Val Accuracy:  {val_accuracy:.4f} ({val_accuracy*100:.1f}%)")

# ============================================================
# SAVE MODEL
# ============================================================

model.save(MODEL_SAVE_PATH)
print(f"\nModel saved: {MODEL_SAVE_PATH}")

# ============================================================
# FINAL REPORT
# ============================================================

print("\n" + "=" * 70)
print("TRAINING COMPLETE")
print("=" * 70)

print(f"\nModel input shape:  (None, {SEQUENCE_LENGTH}, {FEATURE_SIZE})")
print(f"Model output units: {NUM_CLASSES}")
print(f"Test accuracy:      {test_accuracy*100:.1f}%")
print(f"Epochs trained:     {len(history.history['loss'])}")
print(f"Best val_loss:      {min(history.history['val_loss']):.4f}")
print(f"\nModel:   {MODEL_SAVE_PATH}")
print(f"Encoder: {ENCODER_PATH}")
print("=" * 70)
