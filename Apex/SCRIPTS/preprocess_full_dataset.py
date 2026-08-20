"""
SIGNOVA - Full Dataset Preprocessing
=====================================
Reads the ISL_CSLRT_Corpus metadata, finds all videos,
drops classes with < 2 samples, performs a stratified
train/val/test split (80/10/10), and saves label_encoder.json.
"""

import os
import json
import pandas as pd
from sklearn.model_selection import train_test_split

# ============================================================
# PATHS
# ============================================================

DATASET_ROOT = r"C:\Users\prana\Downloads\archive (5)\ISL_CSLRT_Corpus\ISL_CSLRT_Corpus"

METADATA_FILE = os.path.join(
    DATASET_ROOT, "corpus_csv_files", "ISL_CSLRT_Corpus details.xlsx"
)

VIDEO_ROOT = os.path.join(DATASET_ROOT, "Videos_Sentence_Level")

OUTPUT_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\FULL"
MODELS_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\MODELS"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

MIN_SAMPLES = 2  # minimum videos per class to keep

# ============================================================
# LOAD METADATA
# ============================================================

print("=" * 70)
print("SIGNOVA FULL DATASET PREPROCESSING")
print("=" * 70)

print("\nLoading metadata...")
df = pd.read_excel(METADATA_FILE)
print("Original rows:", len(df))

# Remove invalid entries
df = df.dropna(subset=["Sentences", "File location"]).copy()
print("Rows after removing NaN:", len(df))

# Normalize sentence labels
df["sentence"] = df["Sentences"].astype(str).str.strip().str.lower()

# ============================================================
# FIND VIDEO FILES
# ============================================================

print("\nFinding video files...")

def find_video(file_location):
    file_location = str(file_location).strip().replace("/", "\\").strip('"').strip("'")

    if os.path.isabs(file_location) and os.path.exists(file_location):
        return file_location

    candidate = os.path.join(VIDEO_ROOT, file_location)
    if os.path.exists(candidate):
        return candidate

    marker = "Videos_Sentence_Level"
    if marker.lower() in file_location.lower():
        idx = file_location.lower().find(marker.lower())
        relative_part = file_location[idx + len(marker):].lstrip("\\/")
        candidate = os.path.join(VIDEO_ROOT, relative_part)
        if os.path.exists(candidate):
            return candidate

    filename = os.path.basename(file_location)
    if filename:
        for root, dirs, files in os.walk(VIDEO_ROOT):
            if filename in files:
                return os.path.join(root, filename)

    return None


df["video_path"] = df["File location"].apply(find_video)
df["exists"] = df["video_path"].notna()

videos_found = df["exists"].sum()
videos_missing = (~df["exists"]).sum()
print("Videos found:", videos_found)
print("Videos missing:", videos_missing)

# Keep only valid videos
df = df[df["exists"]].copy()
clean_df = df[["sentence", "video_path"]].copy()
clean_df = clean_df.drop_duplicates(subset=["video_path"]).reset_index(drop=True)

print("\nAfter duplicate removal:")
print("Total videos:", len(clean_df))
print("Unique sentences:", clean_df["sentence"].nunique())

# ============================================================
# REPORT AND HANDLE UNDER-REPRESENTED CLASSES
# ============================================================

print("\n" + "=" * 70)
print("CLASS DISTRIBUTION ANALYSIS")
print("=" * 70)

counts = clean_df["sentence"].value_counts()

insufficient = counts[counts < MIN_SAMPLES]
if len(insufficient) > 0:
    print(f"\nWARNING: {len(insufficient)} classes have < {MIN_SAMPLES} samples and will be DROPPED:")
    for sentence, count in insufficient.items():
        print(f"  - '{sentence}' ({count} sample(s))")
else:
    print(f"\nAll classes have >= {MIN_SAMPLES} samples.")

# Drop under-represented classes
usable_classes = counts[counts >= MIN_SAMPLES].index.tolist()
clean_df = clean_df[clean_df["sentence"].isin(usable_classes)].reset_index(drop=True)

print(f"\nUsable classes: {len(usable_classes)}")
print(f"Usable videos:  {len(clean_df)}")

# ============================================================
# CREATE LABEL ENCODER
# ============================================================

classes_sorted = sorted(clean_df["sentence"].unique().tolist())
label_encoder = {label: idx for idx, label in enumerate(classes_sorted)}
reverse_encoder = {idx: label for label, idx in label_encoder.items()}

encoder_path = os.path.join(MODELS_DIR, "label_encoder.json")

# Backup old encoder if it exists
old_encoder_path = os.path.join(MODELS_DIR, "label_encoder_old.json")
if os.path.exists(encoder_path):
    import shutil
    shutil.copy2(encoder_path, old_encoder_path)
    print(f"\nBacked up old label encoder to {old_encoder_path}")

with open(encoder_path, "w") as f:
    json.dump(label_encoder, f, indent=2)
print(f"Label encoder saved: {encoder_path} ({len(label_encoder)} classes)")

# ============================================================
# STRATIFIED TRAIN / VALIDATION / TEST SPLIT (80/10/10)
# ============================================================

print("\n" + "=" * 70)
print("CLASS-BALANCED SPLIT (80/10/10)")
print("=" * 70)

# Custom split that guarantees at least 1 sample per class in train,
# and distributes remaining samples proportionally to val/test.
import numpy as np
np.random.seed(42)

train_rows = []
val_rows = []
test_rows = []

for sentence, group in clean_df.groupby("sentence"):
    indices = group.index.tolist()
    np.random.shuffle(indices)
    n = len(indices)

    if n <= 2:
        # Too few samples: put all in train (can't split meaningfully)
        train_rows.extend(indices)
    elif n <= 4:
        # Small class: 1 for val, 1 for test, rest for train
        val_rows.append(indices[0])
        test_rows.append(indices[1])
        train_rows.extend(indices[2:])
    else:
        # Normal class: 80/10/10 split
        n_test = max(1, round(n * 0.10))
        n_val = max(1, round(n * 0.10))
        n_train = n - n_val - n_test
        test_rows.extend(indices[:n_test])
        val_rows.extend(indices[n_test:n_test + n_val])
        train_rows.extend(indices[n_test + n_val:])

train_df = clean_df.loc[train_rows].reset_index(drop=True)
val_df = clean_df.loc[val_rows].reset_index(drop=True)
test_df = clean_df.loc[test_rows].reset_index(drop=True)

# Save splits
train_df.to_csv(os.path.join(OUTPUT_DIR, "train.csv"), index=False)
val_df.to_csv(os.path.join(OUTPUT_DIR, "validation.csv"), index=False)
test_df.to_csv(os.path.join(OUTPUT_DIR, "test.csv"), index=False)
clean_df.to_csv(os.path.join(OUTPUT_DIR, "clean_video_dataset.csv"), index=False)

# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("PREPROCESSING COMPLETE")
print("=" * 70)

print(f"\nTotal usable videos:    {len(clean_df)}")
print(f"Total usable classes:   {len(usable_classes)}")
print(f"Dropped classes:        {len(insufficient)}")
print(f"\nTraining videos:        {len(train_df)}")
print(f"Validation videos:      {len(val_df)}")
print(f"Testing videos:         {len(test_df)}")

# Verify no data leakage
train_paths = set(train_df["video_path"])
val_paths = set(val_df["video_path"])
test_paths = set(test_df["video_path"])

overlap_tv = train_paths & val_paths
overlap_tt = train_paths & test_paths
overlap_vt = val_paths & test_paths

print(f"\nData leakage check:")
print(f"  Train-Val overlap:  {len(overlap_tv)}")
print(f"  Train-Test overlap: {len(overlap_tt)}")
print(f"  Val-Test overlap:   {len(overlap_vt)}")

if len(overlap_tv) == 0 and len(overlap_tt) == 0 and len(overlap_vt) == 0:
    print("  -> No data leakage detected!")
else:
    print("  -> WARNING: Data leakage detected!")

print("\nFiles saved in:", OUTPUT_DIR)
print("Label encoder:", encoder_path)
print("\n" + "=" * 70)
