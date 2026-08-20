import os
import json
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

# Paths
BASE_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA"
MODEL_PATH = os.path.join(BASE_DIR, "MODELS", "signova_bilstm.keras")
LABEL_PATH = os.path.join(BASE_DIR, "MODELS", "label_encoder.json")
LANDMARKS_DIR = os.path.join(BASE_DIR, "DATASET", "FULL_LANDMARKS")

def main():
    print("=" * 80)
    print("SIGNOVA FULL MODEL INTEGRITY & PERFORMANCE VERIFICATION")
    print("=" * 80)
    
    # 1. Check file existence
    print("\n[1] Checking Model & Label Files...")
    if not os.path.exists(MODEL_PATH):
        print(f"ERROR: Model file not found at {MODEL_PATH}")
        return
    print(f"OK: Found Model File: {MODEL_PATH}")
    
    if not os.path.exists(LABEL_PATH):
        print(f"ERROR: Label encoder file not found at {LABEL_PATH}")
        return
    print(f"OK: Found Label Encoder File: {LABEL_PATH}")
    
    # 2. Check datasets
    print("\n[2] Checking Full Dataset Files...")
    splits = ["train", "validation", "test"]
    dataset_files = {}
    for split in splits:
        x_path = os.path.join(LANDMARKS_DIR, f"{split}_X.npy")
        y_path = os.path.join(LANDMARKS_DIR, f"{split}_y.npy")
        if not os.path.exists(x_path) or not os.path.exists(y_path):
            print(f"ERROR: Dataset files for split '{split}' not found in {LANDMARKS_DIR}")
            return
        dataset_files[f"{split}_X"] = x_path
        dataset_files[f"{split}_y"] = y_path
        print(f"OK: Found '{split}' dataset files.")

    # 3. Load Label Encoder
    print("\n[3] Loading Classes/Labels...")
    with open(LABEL_PATH, "r", encoding="utf-8") as f:
        label_mapping = json.load(f)
    
    # The label_encoder.json has label -> index
    # We need index -> label list
    reverse_mapping = {v: k for k, v in label_mapping.items()}
    classes = [reverse_mapping[i] for i in range(len(reverse_mapping))]
    print(f"Number of classes: {len(classes)}")

    # 4. Load model
    print("\n[4] Loading Keras Model...")
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print("OK: Model loaded successfully.")
    except Exception as e:
        print(f"ERROR loading model: {e}")
        return
        
    print("\nModel Architecture Summary:")
    model.summary()

    # 5. Evaluate on Validation & Test Data
    print("\n[5] Loading Datasets into memory...")
    train_X = np.load(dataset_files["train_X"]).astype(np.float32)
    train_y = np.load(dataset_files["train_y"])
    val_X = np.load(dataset_files["validation_X"]).astype(np.float32)
    val_y = np.load(dataset_files["validation_y"])
    test_X = np.load(dataset_files["test_X"]).astype(np.float32)
    test_y = np.load(dataset_files["test_y"])

    print(f"Loaded training set: X shape = {train_X.shape}, y shape = {train_y.shape}")
    print(f"Loaded validation set: X shape = {val_X.shape}, y shape = {val_y.shape}")
    print(f"Loaded test set: X shape = {test_X.shape}, y shape = {test_y.shape}")

    print("\nEvaluating model on training data...")
    train_loss, train_acc = model.evaluate(train_X, train_y, verbose=0)
    print(f"  Training Loss: {train_loss:.4f}")
    print(f"  Training Accuracy: {train_acc * 100:.2f}%")

    print("\nEvaluating model on validation data...")
    val_loss, val_acc = model.evaluate(val_X, val_y, verbose=0)
    print(f"  Validation Loss: {val_loss:.4f}")
    print(f"  Validation Accuracy: {val_acc * 100:.2f}%")

    print("\nEvaluating model on test data...")
    test_loss, test_acc = model.evaluate(test_X, test_y, verbose=0)
    print(f"  Test Loss: {test_loss:.4f}")
    print(f"  Test Accuracy: {test_acc * 100:.2f}%")

    # 6. Detailed Classification Metrics
    print("\n[6] Detailed Classification Report on Test Set (Non-zero support classes):")
    predictions = model.predict(test_X, verbose=0)
    pred_idx = np.argmax(predictions, axis=1)
    
    # Generate report
    report = classification_report(test_y, pred_idx, target_names=classes, labels=range(len(classes)), zero_division=0)
    # Only print first 40 lines of report to avoid overwhelming output, or filter classes that have actual support
    print(report)

    # 7. Sample Predictions
    print("\n[7] Sample Predictions on Test Set (First 15 samples):")
    for i in range(min(15, len(test_X))):
        true_label = classes[test_y[i]]
        pred_label = classes[pred_idx[i]]
        confidence = predictions[i][pred_idx[i]]
        status = "CORRECT" if true_label == pred_label else "INCORRECT"
        print(f"Sample {i+1:2d}: True: '{true_label}' | Pred: '{pred_label}' (Conf: {confidence*100:.1f}%) | {status}")

if __name__ == "__main__":
    main()
