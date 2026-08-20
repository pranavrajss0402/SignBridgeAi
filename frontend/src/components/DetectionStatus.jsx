import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import './DetectionStatus.css'

const TYPE_BADGE = {
  letter:   { label: '🔤 Letter',   style: { background:'rgba(0,212,255,0.12)', color:'#00d4ff', border:'1px solid rgba(0,212,255,0.25)' } },
  word:     { label: '📝 Word',     style: { background:'rgba(168,85,247,0.12)', color:'#a855f7', border:'1px solid rgba(168,85,247,0.25)' } },
  sentence: { label: '💬 Sentence', style: { background:'rgba(236,72,153,0.12)', color:'#ec4899', border:'1px solid rgba(236,72,153,0.25)' } },
  gesture:  { label: '👋 Gesture',  style: { background:'rgba(245,158,11,0.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.25)' } },
  none:     { label: '⏳ Waiting',  style: { background:'rgba(255,255,255,0.04)', color:'#5a5a7a', border:'1px solid rgba(255,255,255,0.08)' } },
}

export default function DetectionStatus({ prediction }) {
  const signRef = useRef(null)
  const prevText = useRef('')

  const conf = prediction?.confidence ?? 0
  const text = prediction?.text ?? '—'
  const type = prediction?.type ?? 'none'
  const confPct = Math.round(Math.min(100, Math.max(0, conf * 100)))

  const badge = TYPE_BADGE[type] || TYPE_BADGE.none

  // Pop animation on new prediction
  useEffect(() => {
    if (text !== prevText.current && text !== '—' && text !== 'Waiting for prediction...') {
      prevText.current = text
      if (signRef.current) {
        signRef.current.classList.remove('pop')
        void signRef.current.offsetWidth // reflow
        signRef.current.classList.add('pop')
        setTimeout(() => signRef.current?.classList.remove('pop'), 300)
      }
    }
  }, [text])

  const displayText = (text === 'Waiting for prediction...' || !text) ? '—' : text

  return (
    <section className="detection-status-card">
      <div className="card-header">
        <h3 className="card-title">Detection Status</h3>
        <div className="status-badge">
          <Check size={12} />
          <span>Ready</span>
        </div>
      </div>

      <div className="detected-sign" ref={signRef}>
        {displayText}
      </div>

      <p className="detection-subtext">
        {type === 'none' ? 'Show a sign to the camera' : 'Sign detected — translating'}
      </p>

      <div className="confidence-section">
        <div className="confidence-label">
          <span>Confidence Score</span>
          <span className="confidence-value-text">{confPct}%</span>
        </div>
        <div className="confidence-bar-container">
          <div
            className="confidence-bar"
            style={{ width: `${confPct}%` }}
            role="progressbar"
            aria-valuenow={confPct}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>

      <div className="detection-type-row">
        <span className="detection-type-badge" style={badge.style}>
          {badge.label}
        </span>
      </div>
    </section>
  )
}
