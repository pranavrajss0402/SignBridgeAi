import os
import pandas as pd
from sklearn.model_selection import train_test_split

print("=" * 70)
print("SIGNOVA MVP DATASET CREATOR")
print("=" * 70)

# -------------------------------------------------------
# PATHS
# -------------------------------------------------------

INPUT_CSV = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\PROCESSED\clean_video_dataset.csv"

OUTPUT_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\MVP"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------
# MVP SENTENCES
# -------------------------------------------------------

MVP_SIGNS = [
    "hi how are you",
    "thank you so much",
    "help me",
    "i need water",
    "what happened",
    "who are you",
    "congratulations",
    "take care of yourself",
    "i am hungry",
    "you are welcome"
]

# -------------------------------------------------------
# LOAD DATASET
# -------------------------------------------------------

print("\nLoading dataset...")

df = pd.read_csv(INPUT_CSV)

print("Total videos :", len(df))

# -------------------------------------------------------
# FILTER MVP
# -------------------------------------------------------

mvp_df = df[df["sentence"].isin(MVP_SIGNS)].copy()

print("MVP videos :", len(mvp_df))
print("Unique classes :", mvp_df["sentence"].nunique())

print("\nSamples per class:\n")
print(mvp_df["sentence"].value_counts())

# -------------------------------------------------------
# TRAIN / VAL / TEST
# -------------------------------------------------------

train_df, temp_df = train_test_split(
    mvp_df,
    test_size=0.2,
    random_state=42,
    shuffle=True
)

# Validation and Test split (without stratify)

val_df, test_df = train_test_split(
    temp_df,
    test_size=0.5,
    random_state=42,
    shuffle=True
)

# -------------------------------------------------------
# SAVE
# -------------------------------------------------------

train_df.to_csv(os.path.join(OUTPUT_DIR, "train.csv"), index=False)
val_df.to_csv(os.path.join(OUTPUT_DIR, "validation.csv"), index=False)
test_df.to_csv(os.path.join(OUTPUT_DIR, "test.csv"), index=False)

print("\nDataset created successfully!")

print("\nTraining :", len(train_df))
print("Validation :", len(val_df))
print("Testing :", len(test_df))

print("\nSaved to:")
print(OUTPUT_DIR)

print("=" * 70)