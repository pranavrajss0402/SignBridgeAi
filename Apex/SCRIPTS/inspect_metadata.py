import os
import pandas as pd

DATASET_ROOT = r"C:\Users\prana\Downloads\archive (5)\ISL_CSLRT_Corpus\ISL_CSLRT_Corpus"

FILES = [
    os.path.join(
        DATASET_ROOT,
        "corpus_csv_files",
        "ISL_CSLRT_Corpus details.xlsx"
    ),
    os.path.join(
        DATASET_ROOT,
        "corpus_csv_files",
        "ISL_CSLRT_Corpus_frame_details.xlsx"
    ),
    os.path.join(
        DATASET_ROOT,
        "corpus_csv_files",
        "ISL Corpus sign glosses.csv"
    )
]

print("=" * 70)
print("SIGNOVA - DATASET 1 METADATA INSPECTION")
print("=" * 70)

for file in FILES:

    print("\n" + "=" * 70)
    print("FILE:")
    print(file)
    print("=" * 70)

    if not os.path.exists(file):
        print("FILE NOT FOUND")
        continue

    print("File exists: TRUE")

    try:

        if file.lower().endswith(".csv"):
            df = pd.read_csv(file)

        else:
            df = pd.read_excel(file)

        print("\nColumns:")
        print(list(df.columns))

        print("\nNumber of rows:")
        print(len(df))

        print("\nFirst 10 rows:")
        print(df.head(10).to_string())

    except Exception as e:

        print("\nERROR:")
        print(e)

print("\n" + "=" * 70)
print("METADATA INSPECTION COMPLETE")
print("=" * 70)