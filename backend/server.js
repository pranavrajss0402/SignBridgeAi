const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// STATE
// ============================================

// Store latest AI prediction
let latestPrediction = {
    text: "",
    confidence: 0,
    type: "none",
    timestamp: null
};

// Sentence builder state
let sentenceBuilder = {
    letters: [],           // Individual detected letters
    currentWord: "",       // Current word being built
    words: [],             // Completed words
    fullSentence: "",      // The complete sentence string
    lastLetterTime: null,  // Timestamp of last letter detection
    lastPrediction: "",    // Last prediction to avoid duplicates
    lastPredictionTime: 0  // Timestamp of last prediction
};

// Tracks whether the user has returned to a neutral/uncertain hand state since the last added prediction
let hasBeenUncertainSinceLast = true;

// Prediction history (last 50)
let predictionHistory = [];
const MAX_HISTORY = 50;

// Duplicate detection: minimum ms between identical predictions
const DUPLICATE_COOLDOWN_MS = 2000;

// Space insertion: ms of no letters before inserting a space
const SPACE_DELAY_MS = 1500;

// Check for space insertion periodically
setInterval(() => {
    if (sentenceBuilder.lastLetterTime && sentenceBuilder.currentWord.length > 0) {
        const elapsed = Date.now() - sentenceBuilder.lastLetterTime;
        if (elapsed > SPACE_DELAY_MS) {
            // Auto-insert space: finalize current word
            sentenceBuilder.words.push(sentenceBuilder.currentWord);
            sentenceBuilder.currentWord = "";
            sentenceBuilder.fullSentence = sentenceBuilder.words.join(" ");
            sentenceBuilder.lastLetterTime = null;
        }
    }
}, 500);


// ============================================
// HOME / HEALTH CHECK
// ============================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SIGNOVA Backend is running"
    });
});


// ============================================
// RECEIVE AI PREDICTION FROM PYTHON
// ============================================

app.post("/api/prediction", (req, res) => {
    const { text, confidence, type } = req.body;

    if (!text) {
        return res.status(400).json({
            success: false,
            message: "Prediction text is required"
        });
    }

    const now = Date.now();
    const predType = type || "unknown";

    latestPrediction = {
        text: text,
        confidence: Number(confidence) || 0,
        type: predType,
        timestamp: new Date().toISOString()
    };

    // Skip uncertain predictions for history and sentence building
    const isUncertain = text.toLowerCase().includes("uncertain");

    if (isUncertain) {
        hasBeenUncertainSinceLast = true;
    } else {
        // Prevent idle repeat loops:
        // A prediction is considered a duplicate if it's the same as the last prediction
        // AND the user hasn't lowered their hands (which registers an "uncertain" prediction) in between.
        const isDuplicate = (text === sentenceBuilder.lastPrediction && !hasBeenUncertainSinceLast);

        if (!isDuplicate) {
            sentenceBuilder.lastPrediction = text;
            sentenceBuilder.lastPredictionTime = now;
            hasBeenUncertainSinceLast = false; // Reset transition flag

            // Add to history
            predictionHistory.unshift({
                text: text,
                confidence: Number(confidence) || 0,
                type: predType,
                timestamp: new Date().toISOString()
            });

            // Keep history capped
            if (predictionHistory.length > MAX_HISTORY) {
                predictionHistory = predictionHistory.slice(0, MAX_HISTORY);
            }

            // Sentence building logic based on type
            if (predType === "letter") {
                // Single letter — append to current word
                // Strip "ISL Letter: " prefix if present
                let letter = text.replace(/^ISL Letter:\s*/i, "").trim();
                if (letter.length === 1) {
                    sentenceBuilder.currentWord += letter;
                    sentenceBuilder.lastLetterTime = now;

                    // Update full sentence preview
                    const wordsSoFar = [...sentenceBuilder.words];
                    if (sentenceBuilder.currentWord) {
                        wordsSoFar.push(sentenceBuilder.currentWord);
                    }
                    sentenceBuilder.fullSentence = wordsSoFar.join(" ");
                }
            } else if (predType === "word") {
                // Detected word — finalize current letters as a word, then add this word
                if (sentenceBuilder.currentWord.length > 0) {
                    sentenceBuilder.words.push(sentenceBuilder.currentWord);
                    sentenceBuilder.currentWord = "";
                }
                sentenceBuilder.words.push(text);
                sentenceBuilder.fullSentence = sentenceBuilder.words.join(" ");
                sentenceBuilder.lastLetterTime = null;
            } else if (predType === "sentence") {
                // Full sentence from Bi-LSTM — replace entire sentence
                if (sentenceBuilder.currentWord.length > 0) {
                    sentenceBuilder.words.push(sentenceBuilder.currentWord);
                    sentenceBuilder.currentWord = "";
                }
                sentenceBuilder.words.push(text);
                sentenceBuilder.fullSentence = sentenceBuilder.words.join(" ");
                sentenceBuilder.lastLetterTime = null;
            }
            // Gestures don't contribute to sentence building
        }
    }

    console.log(`[${predType.toUpperCase()}] "${text}" (${(Number(confidence) * 100).toFixed(1)}%)`);

    res.json({
        success: true,
        message: "Prediction received successfully",
        prediction: latestPrediction
    });
});


// ============================================
// SEND LATEST PREDICTION TO FRONTEND
// ============================================

app.get("/api/prediction", (req, res) => {
    res.json({
        success: true,
        prediction: latestPrediction
    });
});


// ============================================
// SENTENCE BUILDER ENDPOINTS
// ============================================

// Get current built sentence
app.get("/api/sentence", (req, res) => {
    const wordsSoFar = [...sentenceBuilder.words];
    if (sentenceBuilder.currentWord) {
        wordsSoFar.push(sentenceBuilder.currentWord);
    }

    res.json({
        success: true,
        sentence: wordsSoFar.join(" "),
        words: wordsSoFar,
        currentWord: sentenceBuilder.currentWord,
        letterCount: sentenceBuilder.currentWord.length
    });
});

// Reset sentence builder
app.post("/api/sentence/reset", (req, res) => {
    sentenceBuilder = {
        letters: [],
        currentWord: "",
        words: [],
        fullSentence: "",
        lastLetterTime: null,
        lastPrediction: "",
        lastPredictionTime: 0
    };

    hasBeenUncertainSinceLast = true;

    console.log("Sentence builder reset.");

    res.json({
        success: true,
        message: "Sentence builder reset."
    });
});

// Backspace — remove last character/word
app.post("/api/sentence/backspace", (req, res) => {
    if (sentenceBuilder.currentWord.length > 0) {
        // Remove last letter from current word
        sentenceBuilder.currentWord = sentenceBuilder.currentWord.slice(0, -1);
    } else if (sentenceBuilder.words.length > 0) {
        // Remove last word
        sentenceBuilder.words.pop();
    }

    const wordsSoFar = [...sentenceBuilder.words];
    if (sentenceBuilder.currentWord) {
        wordsSoFar.push(sentenceBuilder.currentWord);
    }
    sentenceBuilder.fullSentence = wordsSoFar.join(" ");

    res.json({
        success: true,
        sentence: sentenceBuilder.fullSentence
    });
});

// Add space (finalize current word)
app.post("/api/sentence/space", (req, res) => {
    if (sentenceBuilder.currentWord.length > 0) {
        sentenceBuilder.words.push(sentenceBuilder.currentWord);
        sentenceBuilder.currentWord = "";
        sentenceBuilder.fullSentence = sentenceBuilder.words.join(" ");
    }

    res.json({
        success: true,
        sentence: sentenceBuilder.fullSentence
    });
});


// ============================================
// HISTORY ENDPOINT
// ============================================

app.get("/api/history", (req, res) => {
    res.json({
        success: true,
        history: predictionHistory
    });
});

// Clear history
app.post("/api/history/clear", (req, res) => {
    predictionHistory = [];
    console.log("Prediction history cleared.");

    res.json({
        success: true,
        message: "History cleared."
    });
});


// ============================================
// DATASET LABELS ENDPOINT
// ============================================

app.get("/api/dataset", (req, res) => {
    const encoderPath = path.join(__dirname, "MODELS", "label_encoder.json");
    fs.readFile(encoderPath, "utf8", (err, data) => {
        if (err) {
            // fallback if MODELS is at parent path
            const parentEncoderPath = path.join(__dirname, "..", "MODELS", "label_encoder.json");
            fs.readFile(parentEncoderPath, "utf8", (parentErr, parentData) => {
                if (parentErr) {
                    console.error("Error reading label encoder:", parentErr);
                    return res.status(500).json({ success: false, message: "Could not load dataset labels" });
                }
                try {
                    const labelsObj = JSON.parse(parentData);
                    const list = Object.keys(labelsObj).sort();
                    res.json({ success: true, dataset: list });
                } catch (e) {
                    res.status(500).json({ success: false, message: "Error parsing dataset labels" });
                }
            });
            return;
        }
        try {
            const labelsObj = JSON.parse(data);
            const list = Object.keys(labelsObj).sort();
            res.json({ success: true, dataset: list });
        } catch (e) {
            res.status(500).json({ success: false, message: "Error parsing dataset labels" });
        }
    });
});


// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log("========================================");
    console.log("SIGNOVA BACKEND SERVER");
    console.log("========================================");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Endpoints:");
    console.log("  POST /api/prediction    — Receive AI prediction");
    console.log("  GET  /api/prediction    — Get latest prediction");
    console.log("  GET  /api/sentence      — Get built sentence");
    console.log("  POST /api/sentence/reset     — Reset sentence");
    console.log("  POST /api/sentence/backspace — Backspace");
    console.log("  POST /api/sentence/space     — Insert space");
    console.log("  GET  /api/history       — Get prediction history");
    console.log("  POST /api/history/clear  — Clear history");
    console.log("Waiting for AI predictions...");
});