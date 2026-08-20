import { useState, useRef } from "react";
import { Mic, MicOff, Send, Trash2, Copy, Volume2 } from "lucide-react";
import "./TextToAvatarPanel.css";

export default function TextToAvatarPanel({ onTextSubmit }) {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const recognitionRef = useRef(null);

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    onTextSubmit(inputText.trim());
    setSpeechStatus(`Translating: "${inputText.trim()}"`);
  };

  const handleClear = () => {
    setInputText("");
    setSpeechStatus("");
    onTextSubmit("");
  };

  const handleSpeak = () => {
    if (!inputText.trim()) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(inputText.trim());
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  };

  const handleCopy = () => {
    if (inputText) navigator.clipboard.writeText(inputText);
  };

  const toggleMic = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setSpeechStatus("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechStatus("Stopped listening.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => {
      setIsListening(true);
      setSpeechStatus("Listening… speak now");
    };

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join("");
      setInputText(transcript);
      
      if (event.results[event.results.length - 1].isFinal) {
        setSpeechStatus(`Translating: "${transcript}"`);
        onTextSubmit(transcript); // Automatically submit to Avatar
      }
    };

    rec.onerror = (e) => {
      setSpeechStatus(`Error: ${e.error}`);
      setIsListening(false);
    };

    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
    rec.start();
  };

  return (
    <div className="tta-panel">
      <div className="tta-header">
        <h3 className="tta-title">Text / Speech Input</h3>
        <p className="tta-subtitle">Type or speak — the 3D avatar will translate into sign language</p>
      </div>

      {/* Textarea */}
      <div className="tta-input-wrap">
        <textarea
          className="tta-textarea"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Type your message here…&#10;e.g. Hello how are you"
          rows={4}
          onKeyDown={e => { if (e.ctrlKey && e.key === "Enter") handleSubmit(); }}
        />
        <div className="tta-char-count">{inputText.length} chars</div>
      </div>

      {/* Status */}
      {speechStatus && (
        <div className="tta-status">
          <span className={isListening ? "tta-status-dot tta-status-active" : "tta-status-dot"} />
          {speechStatus}
        </div>
      )}

      {/* Action Buttons */}
      <div className="tta-actions">
        <button
          className={`tta-btn tta-btn-mic ${isListening ? "active" : ""}`}
          onClick={toggleMic}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening ? "Stop" : "Voice"}
        </button>

        <button className="tta-btn tta-btn-icon" onClick={handleSpeak} title="Read aloud" disabled={!inputText}>
          <Volume2 size={16} />
        </button>

        <button className="tta-btn tta-btn-icon" onClick={handleCopy} title="Copy text" disabled={!inputText}>
          <Copy size={16} />
        </button>

        <button className="tta-btn tta-btn-icon tta-btn-clear" onClick={handleClear} title="Clear" disabled={!inputText}>
          <Trash2 size={16} />
        </button>

        <button className="tta-btn tta-btn-translate" onClick={handleSubmit} disabled={!inputText.trim()}>
          <Send size={16} />
          Translate to Sign
        </button>
      </div>

      {/* Quick Phrases */}
      <div className="tta-quick-wrap">
        <p className="tta-quick-label">Quick phrases:</p>
        <div className="tta-quick-chips">
          {["Hello", "Thank you", "How are you", "Good", "Yes", "No", "Please", "Sorry"].map(phrase => (
            <button
              key={phrase}
              className="tta-chip"
              onClick={() => { setInputText(phrase); onTextSubmit(phrase); setSpeechStatus(`Translating: "${phrase}"`); }}
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
