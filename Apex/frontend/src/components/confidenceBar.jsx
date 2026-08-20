function ConfidenceBar({ confidence }) {
  const percent = Math.min(100, Math.max(0, Math.round(confidence * 100)));

  let levelClass = "low";
  if (percent >= 50) {
    levelClass = "high";
  } else if (percent >= 25) {
    levelClass = "medium";
  }

  return (
    <div className="glass-card confidence-card">
      <h3>Confidence</h3>
      <div className="confidence-track">
        <div
          className={`confidence-fill ${levelClass}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className={`confidence-value`} style={{
        color: levelClass === "high" ? "var(--accent-green)" :
               levelClass === "medium" ? "var(--accent-amber)" :
               "var(--accent-red)"
      }}>
        {percent}%
      </div>
    </div>
  );
}

export default ConfidenceBar;