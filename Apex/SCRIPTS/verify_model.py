import os
import json
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

# Paths
BASE_DIR = r"C:\Users\prana\OneDrive\Desktop\SIGNOVA"
MODEL_PATH = os.path.join(BASE_DIR, "MODELS", "signova_bilstm.keras")
LABEL_PATH = os.path.join(BASE_DIR, "MODELS", "label_encoder.json")
MVP_DIR = os.path.join(BASE_DIR, "DATASET", "MVP")

def main():
    print("=" * 80)
    print("SIGNOVA MODEL INTEGRITY & PERFORMANCE VERIFICATION")
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
    print("\n[2] Checking Dataset Files...")
    splits = ["train", "validation", "test"]
    dataset_files = {}
    for split in splits:
        x_path = os.path.join(MVP_DIR, f"{split}_X.npy")
        y_path = os.path.join(MVP_DIR, f"{split}_y.npy")
        if not os.path.exists(x_path) or not os.path.exists(y_path):
            print(f"ERROR: Dataset files for split '{split}' not found in {MVP_DIR}")
            return
        dataset_files[f"{split}_X"] = x_path
        dataset_files[f"{split}_y"] = y_path
        print(f"OK: Found '{split}' dataset files.")

    # 3. Load Label Encoder
    print("\n[3] Loading Classes/Labels...")
    with open(LABEL_PATH, "r", encoding="utf-8") as f:
        label_mapping = json.load(f)
    
    # Sort classes by integer index
    classes = [label_mapping[str(i)] for i in range(len(label_mapping))]
    print(f"Number of classes: {len(classes)}")
    for idx, name in enumerate(classes):
        print(f"  Class {idx}: {name}")

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
    train_y = np.load(dataset_files["train_y"], allow_pickle=True)
    val_X = np.load(dataset_files["validation_X"]).astype(np.float32)
    val_y = np.load(dataset_files["validation_y"], allow_pickle=True)
    test_X = np.load(dataset_files["test_X"]).astype(np.float32)
    test_y = np.load(dataset_files["test_y"], allow_pickle=True)
    
    # Convert labels to string to map them correctly
    train_y = np.array([str(y) for y in train_y])
    val_y = np.array([str(y) for y in val_y])
    test_y = np.array([str(y) for y in test_y])
    
    # We need to map string labels to indices using our classes list
    label_to_idx = {name: i for i, name in enumerate(classes)}
    
    try:
        train_y_idx = np.array([label_to_idx[y] for y in train_y])
        val_y_idx = np.array([label_to_idx[y] for y in val_y])
        test_y_idx = np.array([label_to_idx[y] for y in test_y])
    except KeyError as e:
        print(f"ERROR: Dataset contains label not found in label_encoder.json: {e}")
        # Let's try to see what labels are in dataset but not in label mapping
        missing_labels = set(np.concatenate([train_y, val_y, test_y])) - set(classes)
        print(f"Missing labels in encoder mapping: {missing_labels}")
        return

    print(f"Loaded training set: X shape = {train_X.shape}, y shape = {train_y_idx.shape}")
    print(f"Loaded validation set: X shape = {val_X.shape}, y shape = {val_y_idx.shape}")
    print(f"Loaded test set: X shape = {test_X.shape}, y shape = {test_y_idx.shape}")

    # Convert y to categorical for tf model evaluation
    train_y_cat = tf.keras.utils.to_categorical(train_y_idx, num_classes=len(classes))
    val_y_cat = tf.keras.utils.to_categorical(val_y_idx, num_classes=len(classes))
    test_y_cat = tf.keras.utils.to_categorical(test_y_idx, num_classes=len(classes))

    print("\nEvaluating model on training data...")
    train_loss, train_acc = model.evaluate(train_X, train_y_cat, verbose=0)
    print(f"  Training Loss: {train_loss:.4f}")
    print(f"  Training Accuracy: {train_acc * 100:.2f}%")

    print("\nEvaluating model on validation data...")
    val_loss, val_acc = model.evaluate(val_X, val_y_cat, verbose=0)
    print(f"  Validation Loss: {val_loss:.4f}")
    print(f"  Validation Accuracy: {val_acc * 100:.2f}%")

    print("\nEvaluating model on test data...")
    test_loss, test_acc = model.evaluate(test_X, test_y_cat, verbose=0)
    print(f"  Test Loss: {test_loss:.4f}")
    print(f"  Test Accuracy: {test_acc * 100:.2f}%")

    # 6. Detailed Classification Metrics
    print("\n[6] Detailed Classification Report on Test Set:")
    predictions = model.predict(test_X, verbose=0)
    pred_idx = np.argmax(predictions, axis=1)
    
    print(classification_report(test_y_idx, pred_idx, target_names=classes, labels=range(len(classes)), zero_division=0))

    # Confusion matrix
    print("Confusion Matrix:")
    cm = confusion_matrix(test_y_idx, pred_idx, labels=range(len(classes)))
    print(cm)

    # 7. Sample Predictions
    print("\n[7] Sample Predictions on Test Set (First 15 samples):")
    for i in range(min(15, len(test_X))):
        true_label = classes[test_y_idx[i]]
        pred_label = classes[pred_idx[i]]
        confidence = predictions[i][pred_idx[i]]
        status = "CORRECT" if true_label == pred_label else "INCORRECT"
        print(f"Sample {i+1:2d}: True: '{true_label}' | Pred: '{pred_label}' (Conf: {confidence*100:.1f}%) | {status}")

if __name__ == "__main__":
    main()
