import os
import pandas as pd
from sklearn.model_selection import train_test_split

# ============================================================
# SIGNOVA VIDEO DATASET PREPROCESSING
# ============================================================

print("=" * 70)
print("SIGNOVA VIDEO DATASET PREPROCESSING")
print("=" * 70)

# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

DATASET_ROOT = r"C:\Users\prana\Downloads\archive (5)\ISL_CSLRT_Corpus\ISL_CSLRT_Corpus"

METADATA_FILE = os.path.join(
    DATASET_ROOT,
    "corpus_csv_files",
    "ISL_CSLRT_Corpus details.xlsx"
)

VIDEO_ROOT = os.path.join(
    DATASET_ROOT,
    "Videos_Sentence_Level"
)

OUTPUT_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\PROCESSED"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ------------------------------------------------------------
# LOAD METADATA
# ------------------------------------------------------------

print("\nLoading metadata...")

df = pd.read_excel(METADATA_FILE)

print("Metadata loaded successfully!")
print("Original rows:", len(df))

print("\nMetadata columns:")
print(df.columns.tolist())

# ------------------------------------------------------------
# REMOVE INVALID ENTRIES
# ------------------------------------------------------------

print("\nRemoving invalid entries...")

df = df.dropna(
    subset=["Sentences", "File location"]
).copy()

print("Rows after removing NaN:", len(df))

# ------------------------------------------------------------
# NORMALIZE SENTENCE LABELS
# ------------------------------------------------------------

print("\nNormalizing sentence labels...")

df["sentence"] = (
    df["Sentences"]
    .astype(str)
    .str.strip()
    .str.lower()
)

# ------------------------------------------------------------
# FIND VIDEO FILE
# ------------------------------------------------------------

print("\nFinding video files...")

def find_video(file_location):

    # Convert to string
    file_location = str(file_location).strip()

    # Normalize Windows separators
    file_location = file_location.replace("/", "\\")

    # Remove accidental leading/trailing quotes
    file_location = file_location.strip('"').strip("'")

    # --------------------------------------------------------
    # OPTION 1
    # File location is already an absolute path
    # --------------------------------------------------------

    if os.path.isabs(file_location):
        if os.path.exists(file_location):
            return file_location

    # --------------------------------------------------------
    # OPTION 2
    # Directly inside Videos_Sentence_Level
    # --------------------------------------------------------

    candidate = os.path.join(
        VIDEO_ROOT,
        file_location
    )

    if os.path.exists(candidate):
        return candidate

    # --------------------------------------------------------
    # OPTION 3
    # File location contains Videos_Sentence_Level
    # --------------------------------------------------------

    marker = "Videos_Sentence_Level"

    if marker.lower() in file_location.lower():

        index = file_location.lower().find(
            marker.lower()
        )

        relative_part = file_location[
            index + len(marker):
        ].lstrip("\\/")

        candidate = os.path.join(
            VIDEO_ROOT,
            relative_part
        )

        if os.path.exists(candidate):
            return candidate

    # --------------------------------------------------------
    # OPTION 4
    # Search recursively by filename
    # --------------------------------------------------------

    filename = os.path.basename(file_location)

    if filename:

        for root, dirs, files in os.walk(VIDEO_ROOT):

            if filename in files:

                return os.path.join(
                    root,
                    filename
                )

    # --------------------------------------------------------
    # NOT FOUND
    # --------------------------------------------------------

    return None


df["video_path"] = df["File location"].apply(
    find_video
)

# ------------------------------------------------------------
# CHECK RESULTS
# ------------------------------------------------------------

print("\nChecking video files...")

df["exists"] = df["video_path"].notna()

videos_found = df["exists"].sum()
videos_missing = (~df["exists"]).sum()

print("Videos found:", videos_found)
print("Videos missing:", videos_missing)

# ------------------------------------------------------------
# SHOW MISSING VIDEOS
# ------------------------------------------------------------

if videos_missing > 0:

    print("\nFirst missing video entries:")

    missing_df = df[
        ~df["exists"]
    ]

    for value in missing_df[
        "File location"
    ].head(10):

        print(value)

# ------------------------------------------------------------
# KEEP ONLY VALID VIDEOS
# ------------------------------------------------------------

df = df[
    df["exists"]
].copy()

# ------------------------------------------------------------
# CREATE CLEAN DATAFRAME
# ------------------------------------------------------------

clean_df = df[
    [
        "sentence",
        "video_path"
    ]
].copy()

# ------------------------------------------------------------
# REMOVE DUPLICATE VIDEO PATHS
# ------------------------------------------------------------

clean_df = clean_df.drop_duplicates(
    subset=["video_path"]
).reset_index(
    drop=True
)

print("\nAfter duplicate removal:")

print(
    "Total videos:",
    len(clean_df)
)

print(
    "Unique sentences:",
    clean_df["sentence"].nunique()
)

# ------------------------------------------------------------
# STOP IF NO VIDEOS FOUND
# ------------------------------------------------------------

if len(clean_df) == 0:

    print("\nERROR:")
    print(
        "No videos were found."
    )

    print(
        "Please check the File location values in the Excel metadata."
    )

    print(
        "\nPreprocessing stopped."
    )

    exit()

# ------------------------------------------------------------
# DISPLAY SENTENCE DISTRIBUTION
# ------------------------------------------------------------

print("\nSentence distribution:")

distribution = clean_df[
    "sentence"
].value_counts()

print(
    distribution.to_string()
)

# ------------------------------------------------------------
# SAVE COMPLETE CLEAN DATASET
# ------------------------------------------------------------

all_file = os.path.join(
    OUTPUT_DIR,
    "clean_video_dataset.csv"
)

clean_df.to_csv(
    all_file,
    index=False
)

print("\nClean dataset saved:")

print(all_file)

# ------------------------------------------------------------
# TRAIN / VALIDATION / TEST SPLIT
# ------------------------------------------------------------

# ------------------------------------------------------------
# TRAIN / VALIDATION / TEST SPLIT
# ------------------------------------------------------------

print(
    "\nCreating train / validation / test split..."
)

# The dataset contains a few sentence classes
# with only 1 video sample.
#
# Therefore, stratified splitting cannot be used
# for the complete dataset.
#
# We use a random 80/10/10 split instead.

train_df, temp_df = train_test_split(
    clean_df,
    test_size=0.20,
    random_state=42,
    shuffle=True
)

val_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    random_state=42,
    shuffle=True
)

# ------------------------------------------------------------
# SAVE SPLITS
# ------------------------------------------------------------

train_file = os.path.join(
    OUTPUT_DIR,
    "train.csv"
)

val_file = os.path.join(
    OUTPUT_DIR,
    "validation.csv"
)

test_file = os.path.join(
    OUTPUT_DIR,
    "test.csv"
)

train_df.to_csv(
    train_file,
    index=False
)

val_df.to_csv(
    val_file,
    index=False
)

test_df.to_csv(
    test_file,
    index=False
)

# ------------------------------------------------------------
# FINAL SUMMARY
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("PREPROCESSING COMPLETE")
print("=" * 70)

print("\nDataset summary:")

print(
    "Total videos:",
    len(clean_df)
)

print(
    "Unique sentences:",
    clean_df["sentence"].nunique()
)

print("\nSplit summary:")

print(
    "Training videos:",
    len(train_df)
)

print(
    "Validation videos:",
    len(val_df)
)

print(
    "Testing videos:",
    len(test_df)
)

print("\nFiles created:")

print(train_file)
print(val_file)
print(test_file)
print(all_file)

print("\n" + "=" * 70)
print(
    "SIGNOVA VIDEO DATASET PREPROCESSING COMPLETE"
)
print("=" * 70)