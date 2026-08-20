import { useState } from 'react'
import './Settings.css'

export default function Settings({
  threshold,
  onThresholdChange,
  ttsEnabled,
  onTtsToggle,
  sentenceModelEnabled,
  onSentenceModelToggle,
  cameraActive,
}) {
  const [voice, setVoice] = useState('Default Voice')

  return (
    <section className="settings-page">
      <div className="settings-header">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: -0.5 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Manage your Signova translation workspace preferences.
        </p>
      </div>

      <div className="settings-container">
        {/* ================= CAMERA ================= */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Camera Feed</h2>
              <p>Camera source and detection visibility state.</p>
            </div>
            <span className={cameraActive ? 'status-badge ready' : 'status-badge disabled'}>
              {cameraActive ? 'Active' : 'Offline'}
            </span>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row">
            <div>
              <h3>Interpretation Session</h3>
              <p>Webcam feedback is required to estimate pose and hand skeletons.</p>
            </div>
            <button
              type="button"
              className={`toggle ${cameraActive ? 'active' : ''}`}
              aria-label="Interpretation session state"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              disabled
            >
              <span className="toggle-circle" />
            </button>
          </div>
        </div>

        {/* ================= AUDIO ================= */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Audio & Speech</h2>
              <p>Configure automatic speech translation properties.</p>
            </div>
            <span className={ttsEnabled ? 'status-badge enabled' : 'status-badge disabled'}>
              {ttsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row">
            <div>
              <h3>Text-to-Speech (TTS)</h3>
              <p>Speak predicted signs aloud automatically at high confidence.</p>
            </div>
            <button
              type="button"
              className={`toggle ${ttsEnabled ? 'active' : ''}`}
              onClick={() => onTtsToggle(!ttsEnabled)}
              aria-label="Toggle text to speech"
              aria-pressed={ttsEnabled}
            >
              <span className="toggle-circle" />
            </button>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row voice-row">
            <div>
              <h3>Preferred Voice</h3>
              <p>Select speech synthesis reader profile voice.</p>
            </div>
            <select
              className="voice-select"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
            >
              <option>Default System Voice</option>
              <option>Google US English (Female)</option>
              <option>Google UK English (Male)</option>
              <option>Hindi Male Voice</option>
            </select>
          </div>
        </div>

        {/* ================= AI DETECTION ================= */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>AI Engine Parameters</h2>
              <p>Calibrate classification algorithms and sequence builders.</p>
            </div>
            <span className="status-badge ready">Operational</span>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row">
            <div>
              <h3>AI Sentence Model (Bi-LSTM / LLM)</h3>
              <p>Join sequential words using contextual translation instead of literal letters.</p>
            </div>
            <button
              type="button"
              className={`toggle ${sentenceModelEnabled ? 'active' : ''}`}
              onClick={() => onSentenceModelToggle(!sentenceModelEnabled)}
              aria-label="Toggle sentence builder model"
              aria-pressed={sentenceModelEnabled}
            >
              <span className="toggle-circle" />
            </button>
          </div>

          <div className="settings-divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Confidence Threshold
              </h3>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {Math.round(threshold * 100)}%
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
              Minimum prediction accuracy required to log and speak the translated sign.
            </p>
            <input
              type="range"
              min="1"
              max="90"
              value={Math.round(threshold * 100)}
              onChange={(e) => onThresholdChange(Number(e.target.value) / 100)}
              style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: 'var(--accent-cyan)',
                height: 4,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 99,
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
