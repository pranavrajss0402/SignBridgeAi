import os
import json
import numpy as np
import tensorflow as tf
import requests
from collections import deque
from flask import Flask, request, jsonify
from flask_cors import CORS
from gesture_classifier import classify_sequence

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "MODELS", "signova_bilstm.keras")
LABEL_PATH = os.path.join(BASE_DIR, "MODELS", "label_encoder.json")
BACKEND_URL = "http://localhost:5000/api/prediction"

# ============================================================
# SETTINGS
# ============================================================

CONFIDENCE_THRESHOLD = 0.03    # Minimum confidence to accept a prediction (3% — just above 1/98 random baseline)
SMOOTHING_WINDOW = 2           # Number of recent predictions for majority vote
UNCERTAIN_LABEL = "Uncertain -- please perform the sign again"

# ============================================================
# PREDICTION SMOOTHING (majority vote buffer)
# ============================================================

recent_predictions = deque(maxlen=SMOOTHING_WINDOW)

print("=" * 80)
print("SIGNOVA AI INFERENCE SERVER")
print("=" * 80)

# ============================================================
# LOAD LABEL ENCODER
# ============================================================

print(f"Loading labels from {LABEL_PATH}...")
try:
    with open(LABEL_PATH, "r", encoding="utf-8") as f:
        label_mapping = json.load(f)

    # The label_encoder.json maps: sentence -> index
    # We need: index -> sentence
    # Check if keys are strings of integers (old format) or sentence strings (new format)
    first_key = list(label_mapping.keys())[0]
    if first_key.isdigit():
        # Old format: {0: "sentence", 1: "sentence", ...}
        classes = [label_mapping[str(i)] for i in range(len(label_mapping))]
    else:
        # New format: {"sentence": 0, "sentence": 1, ...}
        reverse_map = {v: k for k, v in label_mapping.items()}
        classes = [reverse_map[i] for i in range(len(reverse_map))]

    print(f"Loaded {len(classes)} classes.")
except Exception as e:
    print(f"ERROR loading label encoder: {e}")
    exit(1)

# ============================================================
# LOAD KERAS MODEL
# ============================================================

print(f"Loading Bi-LSTM model from {MODEL_PATH}...")
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("OK: Bi-LSTM model loaded successfully.")
    print(f"Model input shape:  {model.input_shape}")
    print(f"Model output shape: {model.output_shape}")
except Exception as e:
    print(f"ERROR loading Keras model: {e}")
    exit(1)


# ============================================================
# MAJORITY VOTE HELPER
# ============================================================

def get_majority_prediction():
    """Return the most common prediction from the recent window."""
    if not recent_predictions:
        return None, 0.0

    # Count occurrences
    from collections import Counter
    counts = Counter(p["label"] for p in recent_predictions)
    most_common_label, count = counts.most_common(1)[0]

    # Average confidence for the majority label
    avg_confidence = np.mean([
        p["confidence"] for p in recent_predictions
        if p["label"] == most_common_label
    ])

    return most_common_label, float(avg_confidence)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "classes": len(classes)
    })


# ============================================================
# RESET ENDPOINT — Clear prediction buffers
# ============================================================

@app.route("/reset", methods=["POST"])
def reset():
    recent_predictions.clear()
    print("Prediction buffer cleared.")
    return jsonify({
        "success": True,
        "message": "Prediction buffer cleared."
    })


# ============================================================
# PREDICT ENDPOINT
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data or "sequence" not in data:
            return jsonify({
                "success": False,
                "message": "Missing 'sequence' in request body."
            }), 400

        sequence = data["sequence"]

        # Validation
        if not isinstance(sequence, list):
            return jsonify({
                "success": False,
                "message": "'sequence' must be a list."
            }), 400

        num_frames = len(sequence)

        # Handle zero-padding if sequence length is less than 30, or slice if greater
        if num_frames < 30:
            padding = [[0.0] * 126] * (30 - num_frames)
            sequence = sequence + padding
        elif num_frames > 30:
            sequence = sequence[-30:]

        # Validate feature size for each frame
        for idx, frame in enumerate(sequence):
            if len(frame) != 126:
                return jsonify({
                    "success": False,
                    "message": f"Frame {idx} has {len(frame)} features, expected 126."
                }), 400

        # Convert to numpy array and reshape to (1, 30, 126)
        sequence_np = np.array(sequence, dtype=np.float32)

        # Check if the sequence is all zeros (no hands detected)
        if np.all(sequence_np == 0):
            return jsonify({
                "success": True,
                "prediction": UNCERTAIN_LABEL,
                "confidence": 0.0,
                "type": "none"
            })

        # Check static gesture / ISL letters first
        static_label, static_conf, static_source = classify_sequence(sequence)
        
        # Get sentence model toggle value (default to True)
        sentence_model_enabled = data.get("sentenceModelEnabled", True)
        
        # Determine prediction type
        pred_type = "none"
        
        if static_label is not None:
            # We found a strong static gesture or ISL letter match!
            pred_label = static_label
            confidence = static_conf
            pred_type = static_source  # "letter", "word", or "gesture"
            print(f"Static Detection: '{pred_label}' | Type: {pred_type} | Confidence: {confidence*100:.1f}%")
        elif not sentence_model_enabled:
            # Sentence model is turned off, and no static gesture matched
            pred_label = UNCERTAIN_LABEL
            confidence = 0.0
            pred_type = "none"
            print("Sentence model is disabled. Skipping deep learning prediction.")
        else:
            # Fallback to Keras Bi-LSTM model sequence inference
            input_data = np.expand_dims(sequence_np, axis=0)
            predictions = model.predict(input_data, verbose=0)
            pred_idx = int(np.argmax(predictions, axis=1)[0])
            confidence = float(predictions[0][pred_idx])
            raw_label = classes[pred_idx] if pred_idx < len(classes) else "unknown"
            pred_type = "sentence"

            # Always add to smoothing buffer regardless of threshold
            recent_predictions.append({
                "label": raw_label,
                "confidence": confidence
            })

            if confidence < CONFIDENCE_THRESHOLD:
                # Below minimum threshold — return uncertain
                pred_label = UNCERTAIN_LABEL
                pred_type = "none"
                print(f"VERY LOW CONFIDENCE: '{raw_label}' ({confidence*100:.1f}%) < threshold ({CONFIDENCE_THRESHOLD*100:.0f}%)")
            else:
                # Get majority vote from smoothing buffer
                majority_label, majority_conf = get_majority_prediction()
                pred_label = majority_label
                confidence = majority_conf
                print(f"Sentence: '{pred_label}' | Confidence: {confidence*100:.1f}% (majority vote over {SMOOTHING_WINDOW} frames)")

        # ============================================================
        # FORWARD TO EXPRESS BACKEND
        # ============================================================

        try:
            payload = {
                "text": pred_label,
                "confidence": confidence,
                "type": pred_type
            }
            resp = requests.post(BACKEND_URL, json=payload, timeout=2)
            if resp.status_code != 200:
                print(f"WARN: Express backend returned status {resp.status_code}.")
        except Exception as e:
            print(f"WARN: Failed to forward to Express: {e}")

        return jsonify({
            "success": True,
            "prediction": pred_label,
            "confidence": confidence,
            "type": pred_type
        })

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


if __name__ == "__main__":
    port = 8000
    print(f"\nConfidence threshold: {CONFIDENCE_THRESHOLD*100:.0f}%")
    print(f"Smoothing window:    {SMOOTHING_WINDOW} predictions")
    print(f"Starting server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
