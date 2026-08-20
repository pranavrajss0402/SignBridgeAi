from pathlib import Path
import pandas as pd

# ==========================================
# ORIGINAL DATASET LOCATION
# ==========================================

DATASET_ROOT = Path(
    r"C:\Users\prana\Downloads\archive (5)\ISL_CSLRT_Corpus\ISL_CSLRT_Corpus"
)

print("================================")
print("SIGNOVA DATASET TEST")
print("================================")

# Check dataset folder
print("\nDataset location:")
print(DATASET_ROOT)

print("\nDataset folder exists:")
print(DATASET_ROOT.exists())

# ==========================================
# METADATA FILE
# ==========================================

METADATA_FILE = (
    DATASET_ROOT
    / "corpus_csv_files"
    / "ISL_CSLRT_Corpus_word_details.xlsx"
)

print("\nMetadata file:")
print(METADATA_FILE)

print("\nMetadata file exists:")
print(METADATA_FILE.exists())

# ==========================================
# READ EXCEL
# ==========================================

if METADATA_FILE.exists():

    print("\nLoading Excel file...")

    df = pd.read_excel(METADATA_FILE)

    print("\nSUCCESS! Dataset loaded.")

    print("\nColumns:")
    print(df.columns.tolist())

    print("\nNumber of rows:")
    print(len(df))

    print("\nFirst 10 rows:")
    print(df.head(10).to_string())

else:

    print("\nERROR!")
    print("Metadata file was not found.")

    print("\nPlease check the following folder:")
    print(
        DATASET_ROOT / "corpus_csv_files"
    )