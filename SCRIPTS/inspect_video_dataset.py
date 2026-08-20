import os
import pandas as pd
import cv2

# ============================================================
# SIGNOVA - VIDEO DATASET INSPECTION
# ============================================================

print("=" * 70)
print("SIGNOVA VIDEO DATASET INSPECTION")
print("=" * 70)

# ------------------------------------------------------------
# DATASET PATH
# ------------------------------------------------------------

DATASET_ROOT = r"C:\Users\prana\Downloads\archive (5)\ISL_CSLRT_Corpus\ISL_CSLRT_Corpus"

METADATA_FILE = os.path.join(
    DATASET_ROOT,
    "corpus_csv_files",
    "ISL_CSLRT_Corpus details.xlsx"
)

VIDEO_FOLDER = os.path.join(
    DATASET_ROOT,
    "Videos_Sentence_Level"
)

# ------------------------------------------------------------
# CHECK PATHS
# ------------------------------------------------------------

print("\nDataset root:")
print(DATASET_ROOT)

print("\nDataset root exists:")
print(os.path.exists(DATASET_ROOT))

print("\nMetadata file:")
print(METADATA_FILE)

print("Metadata file exists:")
print(os.path.exists(METADATA_FILE))

print("\nVideo folder:")
print(VIDEO_FOLDER)

print("Video folder exists:")
print(os.path.exists(VIDEO_FOLDER))


if not os.path.exists(METADATA_FILE):
    print("\nERROR!")
    print("Video metadata file was not found.")
    exit()

if not os.path.exists(VIDEO_FOLDER):
    print("\nERROR!")
    print("Video folder was not found.")
    exit()


# ------------------------------------------------------------
# LOAD METADATA
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("LOADING VIDEO METADATA")
print("=" * 70)

df = pd.read_excel(METADATA_FILE)

print("\nMetadata loaded successfully!")

print("\nColumns:")
print(list(df.columns))

print("\nTotal metadata rows:")
print(len(df))


# ------------------------------------------------------------
# VIDEO INSPECTION
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("VIDEO-BY-VIDEO INSPECTION")
print("=" * 70)

total_videos = 0
found_videos = 0
missing_videos = 0
readable_videos = 0
unreadable_videos = 0

video_report = []

for index, row in df.iterrows():

    sentence = str(row["Sentences"]).strip()

    relative_path = str(row["File location"]).strip()

    # Convert dataset path to actual Windows path
    relative_path = relative_path.replace(
        "ISL_CSLRT_Corpus\\",
        ""
    )

    video_path = os.path.join(
        DATASET_ROOT,
        relative_path
    )

    total_videos += 1

    exists = os.path.exists(video_path)

    duration = 0
    fps = 0
    frame_count = 0
    width = 0
    height = 0
    readable = False

    if exists:

        found_videos += 1

        cap = cv2.VideoCapture(video_path)

        if cap.isOpened():

            readable = True
            readable_videos += 1

            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(
                cap.get(cv2.CAP_PROP_FRAME_COUNT)
            )

            width = int(
                cap.get(cv2.CAP_PROP_FRAME_WIDTH)
            )

            height = int(
                cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            )

            if fps > 0:
                duration = frame_count / fps

            cap.release()

        else:

            unreadable_videos += 1

    else:

        missing_videos += 1


    video_report.append({
        "Sentence": sentence,
        "Video Path": video_path,
        "Exists": exists,
        "Readable": readable,
        "Frame Count": frame_count,
        "FPS": fps,
        "Duration Seconds": round(duration, 2),
        "Width": width,
        "Height": height
    })


    print(
        f"{index + 1:03d}. "
        f"{sentence[:40]:40} | "
        f"Exists: {exists} | "
        f"Readable: {readable} | "
        f"Frames: {frame_count}"
    )


# ------------------------------------------------------------
# CREATE REPORT
# ------------------------------------------------------------

report_df = pd.DataFrame(video_report)

REPORT_FOLDER = os.path.join(
    r"C:\Users\prana\OneDrive\Desktop\SIGNOVA",
    "DATASET",
    "REPORTS"
)

os.makedirs(
    REPORT_FOLDER,
    exist_ok=True
)

REPORT_FILE = os.path.join(
    REPORT_FOLDER,
    "video_dataset_report.csv"
)

report_df.to_csv(
    REPORT_FILE,
    index=False
)


# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("VIDEO DATASET SUMMARY")
print("=" * 70)

print("\nTotal metadata video entries:")
print(total_videos)

print("\nVideos found:")
print(found_videos)

print("\nVideos missing:")
print(missing_videos)

print("\nVideos readable:")
print(readable_videos)

print("\nVideos unreadable:")
print(unreadable_videos)

print("\nUnique sentences:")
print(df["Sentences"].nunique())

print("\nReport saved to:")
print(REPORT_FILE)

print("\n" + "=" * 70)
print("VIDEO DATASET INSPECTION COMPLETE")
print("=" * 70)