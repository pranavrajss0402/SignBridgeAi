function SentenceBuilder({ sentence, onReset, onBackspace, onSpace, onCopy, onSpeak }) {
  return (
    <div className="glass-card sentence-card">
      <h3>📝 Built Sentence</h3>

      <div className={`sentence-display ${!sentence ? "empty" : ""}`}>
        {sentence || "Detected letters and words will appear here..."}
        {sentence !== undefined && <span className="sentence-cursor"></span>}
      </div>

      <div className="sentence-controls">
        <button className="sentence-btn" onClick={onBackspace} title="Remove last character">
          ⌫ Backspace
        </button>
        <button className="sentence-btn" onClick={onSpace} title="Insert space">
          ␣ Space
        </button>
        <button className="sentence-btn primary" onClick={onCopy} title="Copy to clipboard">
          📋 Copy
        </button>
        <button className="sentence-btn primary" onClick={onSpeak} title="Read aloud">
          🔊 Speak
        </button>
        <button className="sentence-btn danger" onClick={onReset} title="Clear sentence">
          🗑 Clear
        </button>
      </div>
    </div>
  );
}

export default SentenceBuilder;
