import { useState, useEffect } from "react";
import WebcamPanel from "../components/WebcamPanel";
import PredictionCard from "../components/predictionCard";
import DetectionStatus from "../components/DetectionStatus";
import OutputTranslation from "../components/OutputTranslation";
import SystemLog from "../components/SystemLog";
import AvatarPanel from "../components/AvatarPanel";
import TextToAvatarPanel from "../components/TextToAvatarPanel";
import ModeSwitcher from "../components/ModeSwitcher";
import { Search, BookOpen, Info, HelpCircle } from "lucide-react";
import "./Dashboard.css";

export default function Dashboard({
  prediction,
  sentence,
  history = [],
  backendOnline,
  aiOnline,
  sessionActive,
  onStartSession,
  sentenceModelEnabled,
  onResetSentence,
  onBackspaceSentence,
  onAddSpace,
  onCopySentence,
  onSpeakSentence,
  // Controls
  threshold,
  onThresholdChange,
  ttsEnabled,
  onTtsToggle,
  onSentenceModelToggle,
  onClearHistory,
  // Mode
  translationMode,
  onTranslationModeChange,
}) {
  const [avatarText, setAvatarText] = useState("");
  const [datasetLabels, setDatasetLabels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFaq, setShowFaq] = useState(false);

  // Fetch dataset labels on load
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/dataset");
        const data = await response.json();
        if (data.success && data.dataset) {
          setDatasetLabels(data.dataset);
        }
      } catch (err) {
        console.error("Failed to load dataset labels:", err);
      }
    };
    fetchLabels();
  }, []);


  const filteredLabels = datasetLabels.filter((label) =>
    label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  
  const handleSendToAvatar = () => {
    if (sentence) {
      setAvatarText(sentence);
      onTranslationModeChange("speech-to-avatar");
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">SignBridge Workspace</h1>
          <p className="page-subtitle">
            {translationMode === "sign-to-speech"
              ? "Mode 1 — Real-time sign language detection & speech output · 98 phrases supported"
              : "Mode 2 — Type or speak to animate the 3D sign language avatar"}
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <ModeSwitcher mode={translationMode} onModeChange={onTranslationModeChange} />

      {/* ── MODE 1: Sign to Text / Speech ── */}
      {translationMode === "sign-to-speech" && (
        <div className="dashboard-grid" key="mode1">
          {/* Left Column */}
          <div className="dashboard-left">
            <WebcamPanel
              sentenceModelEnabled={sentenceModelEnabled}
              sessionActive={sessionActive}
              onStartSession={onStartSession}
            />
            <SystemLog
              backendOnline={backendOnline}
              aiOnline={aiOnline}
              lastPrediction={prediction}
            />
          </div>

          {/* Right Column */}
          <div className="dashboard-right-scroll">
            {/* Live Prediction Card — shows detected sign + confidence */}
            <PredictionCard prediction={prediction} threshold={threshold} />

            {/* ── Live Sign Detection Feed ── */}
            <div className="glass-card" style={{ padding: "18px 18px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>📡</span> Sign-to-Text Feed
                </h3>
                <span style={{ fontSize: 11, background: "rgba(14,165,233,0.08)", color: "#0ea5e9", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                  {history.length} detected
                </span>
              </div>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "18px 0", color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>
                  Start a session and perform signs in front of the camera
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                  {history.slice(0, 8).map((item, idx) => (
                    <div key={idx} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 10px",
                      background: idx === 0 ? "rgba(14,165,233,0.06)" : "#f8fafc",
                      borderRadius: 8,
                      border: idx === 0 ? "1px solid rgba(14,165,233,0.2)" : "1px solid #e2e8f0",
                      transition: "all 200ms ease"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>
                          {item.type === "sentence" ? "💬" : item.type === "word" ? "📝" : item.type === "letter" ? "🔤" : "👋"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: idx === 0 ? 700 : 600, color: idx === 0 ? "#0ea5e9" : "var(--text-primary)" }}>
                          {item.text}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", fontWeight: 600 }}>
                        {Math.round((item.confidence ?? 0) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <OutputTranslation
              sentence={sentence}
              onReset={onResetSentence}
              onBackspace={onBackspaceSentence}
              onSpace={onAddSpace}
              onCopy={onCopySentence}
              onSpeak={onSpeakSentence}
            />

            {/* Send to Avatar Bridge Button */}
            {sentence && (
              <div className="glass-card" style={{ padding: "14px 18px" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>
                  🔗 <strong>Bridge to Mode 2</strong> — Send the translated sentence to the avatar for sign-back playback
                </p>
                <button
                  className="bridge-btn"
                  onClick={handleSendToAvatar}
                  style={{
                    width: "100%", padding: "10px", fontWeight: 700,
                    background: "var(--gradient-primary)", color: "#fff",
                    border: "none", borderRadius: "var(--radius-md)",
                    cursor: "pointer", fontSize: 13, letterSpacing: "0.3px",
                    transition: "opacity 200ms ease"
                  }}
                >
                  🤟 Send "{sentence.slice(0, 40)}{sentence.length > 40 ? "…" : ""}" to Avatar
                </button>
              </div>
            )}

            {/* Dynamic Sign Reference Library */}
            <div className="glass-card dataset-library-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={16} style={{ color: "var(--accent-cyan)" }} />
                  Dataset Reference Library
                </h3>
                <span style={{ fontSize: 11, background: "rgba(14,165,233,0.07)", padding: "2px 8px", borderRadius: 4, fontWeight: 700, color: "var(--accent-cyan)" }}>
                  {filteredLabels.length} Signs
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                Search phrases trained in this prototype. Perform these signs in front of the camera.
              </p>

              {/* Search Bar */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Filter signs (e.g. hello, water, help)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 32px",
                    fontSize: 13,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-card)",
                    background: "#f8fafc",
                    color: "var(--text-primary)",
                    outline: "none"
                  }}
                />
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>

              {/* Signs List */}
              <div className="library-list" style={{
                maxHeight: "180px",
                overflowY: "auto",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                padding: 4,
                border: "1px solid rgba(0,0,0,0.04)",
                borderRadius: "var(--radius-sm)",
                background: "#f8fafc"
              }}>
                {filteredLabels.length > 0 ? (
                  filteredLabels.map((label, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 8px",
                        background: "#ffffff",
                        border: "1px solid var(--border-card)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-secondary)",
                        cursor: "default",
                        transition: "all 150ms ease"
                      }}
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <div style={{ width: "100%", textAlign: "center", fontSize: 12, color: "var(--text-muted)", padding: "16px 0" }}>
                    No matching phrases found.
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="glass-card controls-card">
              <h3>⚙ System Controls</h3>

              <div className="control-group">
                <label>Confidence Threshold: {Math.round(threshold * 100)}%</label>
                <input
                  type="range" min="1" max="90"
                  value={Math.round(threshold * 100)}
                  onChange={e => onThresholdChange(Number(e.target.value) / 100)}
                />
              </div>

              <div className="control-group toggle-group">
                <label>AI Sentence Model</label>
                <input type="checkbox" className="toggle-switch"
                  checked={sentenceModelEnabled}
                  onChange={e => onSentenceModelToggle(e.target.checked)} />
              </div>

              <div className="control-group toggle-group">
                <label>Text-to-Speech (TTS)</label>
                <input type="checkbox" className="toggle-switch"
                  checked={ttsEnabled}
                  onChange={e => onTtsToggle(e.target.checked)} />
              </div>

              <button className="clear-btn" onClick={onClearHistory}>
                🗑 Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 2: Text / Speech to 3D Avatar ── */}
      {translationMode === "speech-to-avatar" && (
        <div className="dashboard-grid mode2-grid" key="mode2">
          {/* Left Column — Input */}
          <div className="dashboard-left">
            <TextToAvatarPanel onTextSubmit={setAvatarText} />

            {/* System status mini card */}
            <div className="glass-card" style={{ padding: "16px 18px" }}>
              <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text-muted)", marginBottom: 12 }}>
                System Status
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <StatusRow label="Backend Server" online={backendOnline} />
                <StatusRow label="AI Inference" online={aiOnline} />
                <StatusRow label="Avatar Engine" online={true} />
              </div>
            </div>
          </div>

          {/* Right Column — Avatar */}
          <div className="dashboard-right">
            <AvatarPanel
              text={avatarText}
              isActive={true}
            />

            {/* Info card */}
            <div className="glass-card" style={{ padding: "16px 18px" }}>
              <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text-muted)", marginBottom: 10 }}>
                How It Works
              </h3>
              <ol style={{ paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0 }}>
                <li>Type text or click 🎙 to use voice input</li>
                <li>Click <strong>Translate to Sign</strong> or a Quick Phrase</li>
                <li>The 3D avatar animates the corresponding signs</li>
                <li>Unknown words are <strong>fingerspelled</strong> automatically</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, online }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: "var(--radius-full)",
        background: online ? "rgba(16,185,129,0.1)" : "rgba(220,38,38,0.08)",
        color: online ? "var(--accent-green)" : "var(--accent-red)"
      }}>
        {online ? "● Online" : "○ Offline"}
      </span>
    </div>
  );
}
