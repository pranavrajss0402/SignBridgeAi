from pathlib import Path
import pandas as pd

# ==========================================
# DATASET ROOT
# ==========================================

DATASET_ROOT = Path(
    r"C:\Users\prana\Downloads\archive (5)\ISL_CSLRT_Corpus\ISL_CSLRT_Corpus"
)

# ==========================================
# METADATA FILE
# ==========================================

METADATA_FILE = (
    DATASET_ROOT
    / "corpus_csv_files"
    / "ISL_CSLRT_Corpus_word_details.xlsx"
)

# ==========================================
# LOAD DATA
# ==========================================

print("Loading dataset...")

df = pd.read_excel(METADATA_FILE)

# Clean word column
df["Word"] = df["Word"].astype(str).str.strip()

# ==========================================
# COUNT SAMPLES PER WORD
# ==========================================

word_counts = (
    df["Word"]
    .value_counts()
    .sort_index()
)

print("\n================================")
print("SIGNOVA AVAILABLE WORDS")
print("================================")

print("\nTotal unique words:")
print(len(word_counts))

print("\nWord classes and sample counts:\n")

for word, count in word_counts.items():
    print(f"{word:30} {count}")

# ==========================================
# SAVE WORD LIST
# ==========================================

OUTPUT_FILE = (
    Path(r"C:\Users\prana\OneDrive\Desktop\SIGNOVA\DATASET")
    / "available_words.csv"
)

word_counts.to_csv(
    OUTPUT_FILE,
    header=["sample_count"]
)

print("\n================================")
print("Word list saved successfully!")
print("================================")

print("\nSaved to:")
print(OUTPUT_FILE)