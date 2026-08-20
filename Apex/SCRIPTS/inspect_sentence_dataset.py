import os
import pandas as pd

# ============================================================
# SIGNOVA - SENTENCE DATASET INSPECTION
# ============================================================

print("=" * 70)
print("SIGNOVA SENTENCE DATASET INSPECTION")
print("=" * 70)

# ------------------------------------------------------------
# 1. DATASET PATH
# ------------------------------------------------------------

DATASET_ROOT = r"C:\Users\prana\Downloads\archive (5)\ISL_CSLRT_Corpus\ISL_CSLRT_Corpus"

CORPUS_FOLDER = os.path.join(
    DATASET_ROOT,
    "corpus_csv_files"
)

# Sentence -> Video metadata
VIDEO_METADATA = os.path.join(
    CORPUS_FOLDER,
    "ISL_CSLRT_Corpus details.xlsx"
)

# Sentence -> Frame metadata
FRAME_METADATA = os.path.join(
    CORPUS_FOLDER,
    "ISL_CSLRT_Corpus_frame_details.xlsx"
)

# Sentence -> ISL Sign Gloss
GLOSS_METADATA = os.path.join(
    CORPUS_FOLDER,
    "ISL Corpus sign glosses.csv"
)

# Actual sentence frame folder
FRAME_FOLDER = os.path.join(
    DATASET_ROOT,
    "Frames_Sentence_Level"
)

# Report location
REPORT_FOLDER = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\REPORTS"

REPORT_FILE = os.path.join(
    REPORT_FOLDER,
    "sentence_dataset_report.csv"
)


# ------------------------------------------------------------
# 2. CHECK DATASET
# ------------------------------------------------------------

print("\nDataset root:")
print(DATASET_ROOT)

print("\nDataset root exists:")
print(os.path.exists(DATASET_ROOT))

print("\nSentence frame folder:")
print(FRAME_FOLDER)

print("Sentence frame folder exists:")
print(os.path.exists(FRAME_FOLDER))


# ------------------------------------------------------------
# 3. CHECK METADATA FILES
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("METADATA FILE CHECK")
print("=" * 70)

print("\n1. Sentence / Video metadata:")
print(VIDEO_METADATA)
print("Exists:", os.path.exists(VIDEO_METADATA))

print("\n2. Sentence Frame metadata:")
print(FRAME_METADATA)
print("Exists:", os.path.exists(FRAME_METADATA))

print("\n3. Sign Gloss metadata:")
print(GLOSS_METADATA)
print("Exists:", os.path.exists(GLOSS_METADATA))


# ------------------------------------------------------------
# 4. STOP IF REQUIRED FILES ARE MISSING
# ------------------------------------------------------------

if not os.path.exists(VIDEO_METADATA):
    print("\nERROR: Sentence/video metadata file not found.")
    exit()

if not os.path.exists(FRAME_METADATA):
    print("\nERROR: Sentence frame metadata file not found.")
    exit()

if not os.path.exists(GLOSS_METADATA):
    print("\nERROR: Sign gloss metadata file not found.")
    exit()


# ------------------------------------------------------------
# 5. LOAD DATA
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("LOADING DATA")
print("=" * 70)

print("\nLoading sentence/video metadata...")

video_df = pd.read_excel(VIDEO_METADATA)

print("SUCCESS!")
print("Rows:", len(video_df))
print("Columns:", list(video_df.columns))


print("\nLoading sentence frame metadata...")

frame_df = pd.read_excel(FRAME_METADATA)

print("SUCCESS!")
print("Rows:", len(frame_df))
print("Columns:", list(frame_df.columns))


print("\nLoading sign gloss metadata...")

gloss_df = pd.read_csv(GLOSS_METADATA)

print("SUCCESS!")
print("Rows:", len(gloss_df))
print("Columns:", list(gloss_df.columns))


# ------------------------------------------------------------
# 6. BASIC SENTENCE INFORMATION
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("SENTENCE DATASET OVERVIEW")
print("=" * 70)

# Unique sentences from video metadata
unique_video_sentences = (
    video_df["Sentences"]
    .dropna()
    .astype(str)
    .str.strip()
    .str.lower()
    .unique()
)

# Unique sentences from frame metadata
unique_frame_sentences = (
    frame_df["Sentence"]
    .dropna()
    .astype(str)
    .str.strip()
    .str.lower()
    .unique()
)

# Unique sentences from gloss metadata
unique_gloss_sentences = (
    gloss_df["Sentence"]
    .dropna()
    .astype(str)
    .str.strip()
    .str.lower()
    .unique()
)

print("\nTotal video metadata rows:")
print(len(video_df))

print("\nUnique sentences in video metadata:")
print(len(unique_video_sentences))

print("\nTotal frame metadata rows:")
print(len(frame_df))

print("\nUnique sentences in frame metadata:")
print(len(unique_frame_sentences))

print("\nTotal gloss metadata rows:")
print(len(gloss_df))

print("\nUnique sentences in gloss metadata:")
print(len(unique_gloss_sentences))


# ------------------------------------------------------------
# 7. CREATE SENTENCE INVENTORY
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("CREATING SENTENCE INVENTORY")
print("=" * 70)

# Create dictionaries for quick lookup

video_counts = (
    video_df["Sentences"]
    .astype(str)
    .str.strip()
    .str.lower()
    .value_counts()
    .to_dict()
)

frame_counts = (
    frame_df["Sentence"]
    .astype(str)
    .str.strip()
    .str.lower()
    .value_counts()
    .to_dict()
)

gloss_mapping = {}

for _, row in gloss_df.iterrows():

    sentence = str(row["Sentence"]).strip().lower()

    gloss = str(row["SIGN GLOSSES"]).strip()

    gloss_mapping[sentence] = gloss


# Combine all unique sentences

all_sentences = sorted(
    set(unique_video_sentences)
    | set(unique_frame_sentences)
    | set(unique_gloss_sentences)
)


# ------------------------------------------------------------
# 8. BUILD REPORT
# ------------------------------------------------------------

report_data = []

for sentence in all_sentences:

    report_data.append({

        "Sentence": sentence,

        "Video Samples":
            video_counts.get(sentence, 0),

        "Frame Count":
            frame_counts.get(sentence, 0),

        "ISL Sign Gloss":
            gloss_mapping.get(sentence, "NOT AVAILABLE"),

        "Has Video":
            video_counts.get(sentence, 0) > 0,

        "Has Frames":
            frame_counts.get(sentence, 0) > 0,

        "Has Gloss":
            sentence in gloss_mapping

    })


report_df = pd.DataFrame(report_data)


# ------------------------------------------------------------
# 9. DISPLAY SENTENCE-BY-SENTENCE INFORMATION
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("SENTENCE-BY-SENTENCE INSPECTION")
print("=" * 70)

for _, row in report_df.iterrows():

    sentence = row["Sentence"]

    print("\nSentence:")
    print(sentence)

    print("Video samples:",
          row["Video Samples"])

    print("Frames:",
          row["Frame Count"])

    print("ISL Gloss:",
          row["ISL Sign Gloss"])

    print("-" * 70)


# ------------------------------------------------------------
# 10. SUMMARY
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("SENTENCE DATASET SUMMARY")
print("=" * 70)

total_sentences = len(report_df)

sentences_with_video = (
    report_df["Has Video"]
).sum()

sentences_with_frames = (
    report_df["Has Frames"]
).sum()

sentences_with_gloss = (
    report_df["Has Gloss"]
).sum()

total_video_samples = (
    report_df["Video Samples"]
).sum()

total_frames = (
    report_df["Frame Count"]
).sum()


print("\nTotal unique sentences:")
print(total_sentences)

print("\nTotal video samples:")
print(total_video_samples)

print("\nTotal sentence frames:")
print(total_frames)

print("\nSentences with videos:")
print(sentences_with_video)

print("\nSentences with frames:")
print(sentences_with_frames)

print("\nSentences with ISL gloss:")
print(sentences_with_gloss)


# ------------------------------------------------------------
# 11. SAVE REPORT
# ------------------------------------------------------------

os.makedirs(
    REPORT_FOLDER,
    exist_ok=True
)

report_df.to_csv(
    REPORT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print("\n" + "=" * 70)
print("REPORT SAVED")
print("=" * 70)

print("\nReport location:")
print(REPORT_FILE)


# ------------------------------------------------------------
# 12. COMPLETE
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("SENTENCE DATASET INSPECTION COMPLETE")
print("=" * 70)