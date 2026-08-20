"""
SIGNOVA - Bi-LSTM Model Training v2 (with Data Augmentation)
=============================================================
Uses Gaussian noise, random frame dropout and temporal jitter
to augment the tiny ISL_CSLRT_Corpus dataset (~3 samples/class).
Input:  (30 frames, 126 features)
Output: 98 sentence classes
"""

import os
import json
import shutil
import numpy as np

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

# ============================================================
# PATHS
# ============================================================

LANDMARKS_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\FULL_LANDMARKS"
MODELS_DIR    = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\MODELS"
ENCODER_PATH  = os.path.join(MODELS_DIR, "label_encoder.json")

MODEL_SAVE_PATH   = os.path.join(MODELS_DIR, "signova_bilstm.keras")
MODEL_BACKUP_PATH = os.path.join(MODELS_DIR, "signova_bilstm_old.keras")

# ============================================================
# SETTINGS
# ============================================================

SEQUENCE_LENGTH = 30
FEATURE_SIZE    = 126
EPOCHS          = 150
BATCH_SIZE      = 8       # smaller batch helps with tiny dataset
PATIENCE        = 25      # generous patience for augmented training
AUG_FACTOR      = 8      # how many extra augmented copies per sample

# ============================================================
# DATA AUGMENTATION HELPERS
# ============================================================

def augment_sequence(seq):
    """Apply random augmentation to a (30,126) sequence."""
    seq = seq.copy()

    # 1. Gaussian noise
    if np.random.rand() < 0.7:
        noise_std = np.random.uniform(0.005, 0.02)
        seq += np.random.normal(0, noise_std, seq.shape).astype(np.float32)

    # 2. Random frame dropout (zero out 1-3 random frames)
    if np.random.rand() < 0.5:
        n_drop = np.random.randint(1, 4)
        drop_idxs = np.random.choice(SEQUENCE_LENGTH, n_drop, replace=False)
        seq[drop_idxs] = 0.0

    # 3. Temporal shift (roll sequence by ±2 frames)
    if np.random.rand() < 0.5:
        shift = np.random.randint(-2, 3)
        seq = np.roll(seq, shift, axis=0)

    # 4. Scale jitter (multiply all features by a factor close to 1)
    if np.random.rand() < 0.5:
        scale = np.random.uniform(0.9, 1.1)
        seq *= scale

    # 5. Mirror left/right hand (swap left and right hand features)
    # Left hand: features 0-62, right hand: 63-125
    if np.random.rand() < 0.3:
        left  = seq[:, :63].copy()
        right = seq[:, 63:].copy()
        seq[:, :63]  = right
        seq[:, 63:]  = left

    return seq.clip(-5.0, 5.0)   # clamp to prevent extreme values


def build_augmented_dataset(X, y, aug_factor=8, seed=42):
    """Return original + augmented copies of (X, y)."""
    rng = np.random.default_rng(seed)
    aug_X, aug_y = [X.copy()], [y.copy()]

    for _ in range(aug_factor):
        batch = np.stack([augment_sequence(x) for x in X], axis=0)
        aug_X.append(batch)
        aug_y.append(y.copy())

    aug_X = np.concatenate(aug_X, axis=0).astype(np.float32)
    aug_y = np.concatenate(aug_y, axis=0)

    # Shuffle together
    idxs = rng.permutation(len(aug_X))
    return aug_X[idxs], aug_y[idxs]


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("SIGNOVA Bi-LSTM MODEL TRAINING v2 (with Data Augmentation)")
print("=" * 70)

print("\nLoading data...")
train_X = np.load(os.path.join(LANDMARKS_DIR, "train_X.npy")).astype(np.float32)
train_y = np.load(os.path.join(LANDMARKS_DIR, "train_y.npy"))
val_X   = np.load(os.path.join(LANDMARKS_DIR, "validation_X.npy")).astype(np.float32)
val_y   = np.load(os.path.join(LANDMARKS_DIR, "validation_y.npy"))
test_X  = np.load(os.path.join(LANDMARKS_DIR, "test_X.npy")).astype(np.float32)
test_y  = np.load(os.path.join(LANDMARKS_DIR, "test_y.npy"))

print(f"Raw Train:      X={train_X.shape}, y={train_y.shape}")
print(f"Validation: X={val_X.shape},  y={val_y.shape}")
print(f"Test:       X={test_X.shape},  y={test_y.shape}")

# ============================================================
# LOAD LABEL ENCODER
# ============================================================

with open(ENCODER_PATH, "r") as f:
    label_encoder = json.load(f)

NUM_CLASSES = len(label_encoder)
print(f"\nNumber of classes: {NUM_CLASSES}")

# ============================================================
# DATA AUGMENTATION
# ============================================================

print(f"\nAugmenting training data (factor={AUG_FACTOR})...")
aug_train_X, aug_train_y = build_augmented_dataset(train_X, train_y, aug_factor=AUG_FACTOR)
print(f"Augmented Train: X={aug_train_X.shape}, y={aug_train_y.shape}")

# ============================================================
# BACKUP OLD MODEL
# ============================================================

if os.path.exists(MODEL_SAVE_PATH):
    shutil.copy2(MODEL_SAVE_PATH, MODEL_BACKUP_PATH)
    print(f"\nBacked up old model to: {MODEL_BACKUP_PATH}")

# ============================================================
# BUILD BI-LSTM MODEL (slightly deeper for more capacity)
# ============================================================

print("\n" + "=" * 70)
print("BUILDING MODEL")
print("=" * 70)

inputs = keras.Input(shape=(SEQUENCE_LENGTH, FEATURE_SIZE))
x = layers.Masking(mask_value=0.0)(inputs)
x = layers.BatchNormalization()(x)

# Bi-LSTM stack
x = layers.Bidirectional(layers.LSTM(256, return_sequences=True, dropout=0.3, recurrent_dropout=0.2))(x)
x = layers.BatchNormalization()(x)
x = layers.Bidirectional(layers.LSTM(128, return_sequences=True, dropout=0.3, recurrent_dropout=0.2))(x)
x = layers.BatchNormalization()(x)
x = layers.Bidirectional(layers.LSTM(64,  return_sequences=False, dropout=0.3))(x)

# Dense head
x = layers.Dense(256, activation="relu")(x)
x = layers.Dropout(0.4)(x)
x = layers.Dense(128, activation="relu")(x)
x = layers.Dropout(0.3)(x)
outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)

model = keras.Model(inputs, outputs)

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
        monitor="val_accuracy",
        patience=PATIENCE,
        restore_best_weights=True,
        mode="max",
        verbose=1
    ),
    callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=8,
        min_lr=1e-6,
        verbose=1
    ),
    callbacks.ModelCheckpoint(
        MODEL_SAVE_PATH,
        monitor="val_accuracy",
        save_best_only=True,
        mode="max",
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
    aug_train_X, aug_train_y,
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

# Load best checkpoint
model = tf.keras.models.load_model(MODEL_SAVE_PATH)

test_loss, test_accuracy = model.evaluate(test_X, test_y, verbose=0)
print(f"\nTest Loss:     {test_loss:.4f}")
print(f"Test Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.1f}%)")

val_loss, val_accuracy = model.evaluate(val_X, val_y, verbose=0)
print(f"\nVal Loss:      {val_loss:.4f}")
print(f"Val Accuracy:  {val_accuracy:.4f} ({val_accuracy*100:.1f}%)")

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
print(f"Best val_accuracy:  {max(history.history['val_accuracy'])*100:.1f}%")
print(f"\nModel:   {MODEL_SAVE_PATH}")
print(f"Encoder: {ENCODER_PATH}")
print("=" * 70)
