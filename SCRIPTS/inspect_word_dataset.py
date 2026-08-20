import os
import pandas as pd

# ============================================
# SIGNOVA - WORD DATASET INSPECTION
# ============================================

# Your Dataset 1 root folder
DATASET_ROOT = r"C:\Users\prana\Downloads\archive (5)\ISL_CSLRT_Corpus\ISL_CSLRT_Corpus"

# Excel metadata file
EXCEL_FILE = os.path.join(
    DATASET_ROOT,
    "corpus_csv_files",
    "ISL_CSLRT_Corpus_word_details.xlsx"
)

# Actual word-level image folder
WORD_IMAGE_ROOT = os.path.join(
    DATASET_ROOT,
    "Frames_Word_Level"
)

# Where to save the report
REPORT_FOLDER = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET\REPORTS"

REPORT_FILE = os.path.join(
    REPORT_FOLDER,
    "word_dataset_report.csv"
)


# ============================================
# START
# ============================================

print("=" * 60)
print("SIGNOVA - WORD DATASET INSPECTION")
print("=" * 60)

print("\nDataset root:")
print(DATASET_ROOT)

# Check dataset
if not os.path.exists(DATASET_ROOT):
    print("\nERROR: Dataset root not found!")
    exit()

print("\nDataset root exists: TRUE")


# Check Excel
print("\nMetadata file:")
print(EXCEL_FILE)

if not os.path.exists(EXCEL_FILE):
    print("\nERROR: Word metadata Excel file not found!")
    exit()

print("Metadata file exists: TRUE")


# Check image folder
print("\nWord image folder:")
print(WORD_IMAGE_ROOT)

if not os.path.exists(WORD_IMAGE_ROOT):
    print("\nERROR: Frames_Word_Level folder not found!")
    exit()

print("Word image folder exists: TRUE")


# ============================================
# LOAD METADATA
# ============================================

print("\nLoading word metadata...")

df = pd.read_excel(EXCEL_FILE)

print("Metadata loaded successfully!")

print("\nColumns:")
print(list(df.columns))

print("\nTotal metadata rows:")
print(len(df))


# ============================================
# FIND UNIQUE WORDS
# ============================================

words = sorted(
    df["Word"]
    .astype(str)
    .str.strip()
    .unique()
)

print("\nTotal unique words:")
print(len(words))


# ============================================
# INSPECT EACH WORD
# ============================================

results = []

total_metadata = 0
total_found = 0
total_missing = 0


print("\n")
print("=" * 60)
print("WORD-BY-WORD INSPECTION")
print("=" * 60)


for word in words:

    # Get metadata rows for this word
    word_df = df[
        df["Word"]
        .astype(str)
        .str.strip()
        == word
    ]

    metadata_count = len(word_df)

    found_count = 0
    missing_count = 0

    missing_files = []

    # Check every image
    for _, row in word_df.iterrows():

        relative_path = str(
            row["Frames path"]
        ).strip()

        # Extract filename
        filename = os.path.basename(
            relative_path
        )

        # Actual expected location
        image_path = os.path.join(
            WORD_IMAGE_ROOT,
            word,
            filename
        )

        if os.path.exists(image_path):

            found_count += 1

        else:

            missing_count += 1

            missing_files.append(
                filename
            )

    # Update totals
    total_metadata += metadata_count
    total_found += found_count
    total_missing += missing_count

    # Print result
    print(
        f"{word:<30} "
        f"Metadata: {metadata_count:<4} "
        f"Found: {found_count:<4} "
        f"Missing: {missing_count}"
    )

    # Save result
    results.append({

        "Word": word,

        "Metadata Entries":
            metadata_count,

        "Images Found":
            found_count,

        "Images Missing":
            missing_count,

        "Missing Files":
            ", ".join(missing_files)

    })


# ============================================
# CREATE REPORT FOLDER
# ============================================

os.makedirs(
    REPORT_FOLDER,
    exist_ok=True
)


# ============================================
# SAVE CSV REPORT
# ============================================

report_df = pd.DataFrame(
    results
)

report_df.to_csv(
    REPORT_FILE,
    index=False,
    encoding="utf-8-sig"
)


# ============================================
# FINAL SUMMARY
# ============================================

print("\n")
print("=" * 60)
print("WORD DATASET SUMMARY")
print("=" * 60)

print(
    "\nUnique words:",
    len(words)
)

print(
    "Total metadata entries:",
    total_metadata
)

print(
    "Total images found:",
    total_found
)

print(
    "Total images missing:",
    total_missing
)

print("\nReport saved to:")

print(REPORT_FILE)

print("\n")
print("=" * 60)
print("WORD DATASET INSPECTION COMPLETE")
print("=" * 60)