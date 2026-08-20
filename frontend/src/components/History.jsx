function History({ history }) {
  // Badge config per type
  const badgeConfig = {
    letter:   { label: "Letter",   className: "badge-letter" },
    word:     { label: "Word",     className: "badge-word" },
    sentence: { label: "Sentence", className: "badge-sentence" },
    gesture:  { label: "Gesture",  className: "badge-gesture" },
    none:     { label: "—",        className: "badge-none" },
  };

  return (
    <div className="glass-card history-card">
      <h3>📜 Prediction History</h3>
      {history.length === 0 ? (
        <p className="history-empty">
          No signs detected yet. Hold a gesture in front of the camera!
        </p>
      ) : (
        <ul className="history-list">
          {history.map((item, idx) => {
            const badge = badgeConfig[item.type] || badgeConfig.none;
            return (
              <li key={idx} className="history-item">
                <span className="history-text">{item.text}</span>
                <div className="history-meta">
                  <span className={`history-badge ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="history-confidence">
                    {Math.round(item.confidence * 100)}%
                  </span>
                  <span className="history-time">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default History;