import { useState } from 'react'
import './Settings.css'

export default function Settings() {
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [faceDetection, setFaceDetection] = useState(true)
  const [handDetection, setHandDetection] = useState(true)
  const [poseDetection, setPoseDetection] = useState(true)
  const [voice, setVoice] = useState('Default Voice')

  return (
    <section className="settings-page">

      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your Signova application preferences.</p>
        </div>
      </div>

      <div className="settings-container">

        {/* ================= CAMERA ================= */}
        <div className="settings-card">

          <div className="settings-card-header">
            <div>
              <h2>Camera</h2>
              <p>
                Camera settings for sign language detection.
              </p>
            </div>

            <span className={cameraEnabled ? 'status-badge ready' : 'status-badge disabled'}>
              {cameraEnabled ? 'Ready' : 'Disabled'}
            </span>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row">
            <div>
              <h3>Camera Detection</h3>
              <p>Enable camera input for real-time interpretation.</p>
            </div>

            <button
              type="button"
              className={`toggle ${cameraEnabled ? 'active' : ''}`}
              onClick={() => setCameraEnabled(!cameraEnabled)}
              aria-label="Toggle camera detection"
              aria-pressed={cameraEnabled}
            >
              <span className="toggle-circle" />
            </button>
          </div>

        </div>


        {/* ================= AUDIO ================= */}
        <div className="settings-card">

          <div className="settings-card-header">
            <div>
              <h2>Audio</h2>
              <p>
                Text-to-speech output settings.
              </p>
            </div>

            <span className={audioEnabled ? 'status-badge enabled' : 'status-badge disabled'}>
              {audioEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row">
            <div>
              <h3>Text-to-Speech</h3>
              <p>Speak translated sign language results aloud.</p>
            </div>

            <button
              type="button"
              className={`toggle ${audioEnabled ? 'active' : ''}`}
              onClick={() => setAudioEnabled(!audioEnabled)}
              aria-label="Toggle text to speech"
              aria-pressed={audioEnabled}
            >
              <span className="toggle-circle" />
            </button>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row voice-row">
            <div>
              <h3>Voice</h3>
              <p>Select the voice used for speech output.</p>
            </div>

            <select
              className="voice-select"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
            >
              <option>Default Voice</option>
              <option>Voice 1</option>
              <option>Voice 2</option>
              <option>Voice 3</option>
            </select>
          </div>

        </div>


        {/* ================= AI DETECTION ================= */}
        <div className="settings-card">

          <div className="settings-card-header">
            <div>
              <h2>AI Detection</h2>
              <p>
                Configure face, hand and pose detection.
              </p>
            </div>

            <span className="status-badge ready">
              Ready
            </span>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row">
            <div>
              <h3>Face Detection</h3>
              <p>Detect facial landmarks during interpretation.</p>
            </div>

            <button
              type="button"
              className={`toggle ${faceDetection ? 'active' : ''}`}
              onClick={() => setFaceDetection(!faceDetection)}
              aria-label="Toggle face detection"
              aria-pressed={faceDetection}
            >
              <span className="toggle-circle" />
            </button>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row">
            <div>
              <h3>Hand Detection</h3>
              <p>Detect hand landmarks for sign recognition.</p>
            </div>

            <button
              type="button"
              className={`toggle ${handDetection ? 'active' : ''}`}
              onClick={() => setHandDetection(!handDetection)}
              aria-label="Toggle hand detection"
              aria-pressed={handDetection}
            >
              <span className="toggle-circle" />
            </button>
          </div>

          <div className="settings-divider" />

          <div className="setting-control-row">
            <div>
              <h3>Pose Detection</h3>
              <p>Track body pose for improved recognition.</p>
            </div>

            <button
              type="button"
              className={`toggle ${poseDetection ? 'active' : ''}`}
              onClick={() => setPoseDetection(!poseDetection)}
              aria-label="Toggle pose detection"
              aria-pressed={poseDetection}
            >
              <span className="toggle-circle" />
            </button>
          </div>

        </div>

      </div>
    </section>
  )
}