import { useEffect, useRef, useState } from 'react'
import './SystemLog.css'

const BOOT_LOGS = [
  { type: 'INIT', message: 'Signova AI Interpreter v2.0 starting...' },
  { type: 'INIT', message: 'MediaPipe HandLandmarker loaded.' },
  { type: 'INIT', message: 'MediaPipe PoseLandmarker loaded.' },
  { type: 'SYNC', message: 'Sequence buffer initialised (30 frames × 126 features).' },
  { type: 'INFO', message: 'ISL dataset: 113 words ready.' },
]

export default function SystemLog({ backendOnline, aiOnline, lastPrediction }) {
  const [logs, setLogs] = useState([])
  const logsEndRef = useRef(null)
  const prevPred = useRef('')
  const prevBackend = useRef(null)
  const prevAi = useRef(null)
  const bootDone = useRef(false)

  const addLog = (type, message) => {
    const now = new Date()
    const timeStr = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(n => String(n).padStart(2, '0'))
      .join(':')
    setLogs(prev => [...prev.slice(-24), { time: timeStr, type, message }])
  }

  // Boot sequence
  useEffect(() => {
    if (bootDone.current) return
    bootDone.current = true
    BOOT_LOGS.forEach((log, i) => {
      setTimeout(() => addLog(log.type, log.message), i * 300)
    })
  }, [])

  // Backend status changes
  useEffect(() => {
    if (prevBackend.current === null) { prevBackend.current = backendOnline; return }
    if (prevBackend.current !== backendOnline) {
      prevBackend.current = backendOnline
      addLog(backendOnline ? 'SYNC' : 'WARN',
        backendOnline ? 'Express backend connected on port 5000.' : 'Express backend connection lost.')
    }
  }, [backendOnline])

  // AI server status changes
  useEffect(() => {
    if (prevAi.current === null) { prevAi.current = aiOnline; return }
    if (prevAi.current !== aiOnline) {
      prevAi.current = aiOnline
      addLog(aiOnline ? 'INIT' : 'WARN',
        aiOnline ? 'Python AI server online on port 8000.' : 'Python AI server offline.')
    }
  }, [aiOnline])

  // Log new predictions
  useEffect(() => {
    if (!lastPrediction) return
    const { text, confidence, type } = lastPrediction
    if (!text || text === prevPred.current || text === 'Waiting for prediction...') return
    prevPred.current = text
    const confStr = `${Math.round((confidence || 0) * 100)}%`
    addLog('PRED', `[${(type || 'word').toUpperCase()}] "${text}" — conf: ${confStr}`)
  }, [lastPrediction])

  // Auto-scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const typeClass = (type) => {
    switch (type) {
      case 'INIT': return 'log-init'
      case 'SYNC': return 'log-sync'
      case 'WARN': return 'log-warn'
      case 'INFO': return 'log-info'
      case 'PRED': return 'log-pred'
      case 'ERR':  return 'log-err'
      default:     return 'log-info'
    }
  }

  return (
    <section className="system-log-card">
      <div className="log-header">
        <h3 className="log-title">System Log</h3>
        <div className="status-indicator">
          <span className="status-dot connected" />
          LIVE
        </div>
      </div>

      <div className="log-container" role="log" aria-live="polite" aria-label="System log">
        {logs.map((log, idx) => (
          <div key={idx} className={`log-entry ${typeClass(log.type)}`}>
            <span className="log-time">[{log.time}]</span>
            <span className="log-type">{log.type}:</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </section>
  )
}
