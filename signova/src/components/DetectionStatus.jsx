import { Check } from 'lucide-react'
import './DetectionStatus.css'

export default function DetectionStatus({ data = null }) {
  const displayData = data || {
    sign: 'HELLO',
    confidence: 0,
    status: 'Ready'
  }

  return (
    <section className="detection-status-card">
      <div className="card-header">
        <h3 className="card-title">DETECTION STATUS</h3>
        <div className="status-badge">
          <Check size={14} />
          <span>{displayData.status}</span>
        </div>
      </div>

      <div className="detected-sign">
        {displayData.sign}
      </div>

      <p className="detection-subtext">Awaiting Gesture</p>

      <div className="confidence-section">
        <div className="confidence-label">
          <span>Confidence Score</span>
          <span className="confidence-value">{displayData.confidence}%</span>
        </div>
        <div className="confidence-bar-container">
          <div 
            className="confidence-bar"
            style={{ width: `${displayData.confidence}%` }}
            role="progressbar"
            aria-valuenow={displayData.confidence}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>
    </section>
  )
}
