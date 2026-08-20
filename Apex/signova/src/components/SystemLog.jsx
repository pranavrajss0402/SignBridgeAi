import { useEffect, useState, useRef } from 'react'
import './SystemLog.css'

export default function SystemLog() {
  const [logs, setLogs] = useState([
    { time: '10:42:01', type: 'INIT', message: 'AI Model v4.2 loaded successfully.' },
    { time: '10:42:03', type: 'SYNC', message: 'Hand tracking modules initialized.' },
    { time: '10:42:05', type: 'WARN', message: 'Waiting for video stream input...' },
  ])
  const logsEndRef = useRef(null)

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  useEffect(() => {
    // Simulate periodic log entries
    const logMessages = [
      { type: 'INFO', message: 'Hand gesture recognized in frame 142.' },
      { type: 'SYNC', message: 'Pose estimation updated.' },
      { type: 'INFO', message: 'Confidence threshold: 0.87' },
      { type: 'SYNC', message: 'Executing gesture recognition pipeline.' },
      { type: 'INFO', message: 'Frame rate: 30 FPS' },
    ]

    const interval = setInterval(() => {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      const newLog = logMessages[Math.floor(Math.random() * logMessages.length)]

      setLogs((prevLogs) => [
        ...prevLogs.slice(-9), // Keep last 10 logs
        {
          time: timeStr,
          type: newLog.type,
          message: newLog.message,
        },
      ])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getLogTypeClass = (type) => {
    switch (type) {
      case 'INIT':
        return 'log-init'
      case 'SYNC':
        return 'log-sync'
      case 'WARN':
        return 'log-warn'
      case 'INFO':
        return 'log-info'
      default:
        return 'log-info'
    }
  }

  return (
    <section className="system-log-card">
      <div className="log-header">
        <h3 className="log-title">SYSTEM LOG</h3>
        <div className="status-indicator">
          <span className="status-dot connected" />
          <span className="status-text">CONNECTED</span>
        </div>
      </div>

      <div className="log-container" role="log" aria-live="polite" aria-label="System log">
        {logs.map((log, index) => (
          <div key={index} className={`log-entry ${getLogTypeClass(log.type)}`}>
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
