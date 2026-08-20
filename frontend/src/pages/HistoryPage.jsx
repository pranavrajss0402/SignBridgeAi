import { Trash2, Calendar, ShieldCheck } from 'lucide-react'
import './HistoryPage.css'

export default function HistoryPage({ history = [], onClearHistory }) {
  // Convert standard date string to local user format
  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleString()
    } catch {
      return 'Today • 15:22'
    }
  }

  return (
    <section className="history-page">
      <div className="history-header">
        <h1 className="history-title">Interpretation History</h1>
        <p className="history-subtitle">View and manage logs of previous ISL interpretation sessions.</p>
      </div>

      <div className="history-container">
        <div className="history-page-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)' }}>
              Saved Session Logs
            </h3>
            {history.length > 0 && (
              <button 
                className="btn-clear-history-large"
                onClick={onClearHistory}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                <Trash2 size={12} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} />
                Clear Logs
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--accent-purple)' }} />
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: 14 }}>No translation logs stored in this session yet.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 12 }}>Run a live interpretation session to register translations.</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="history-item-row">
                  <div className="history-info">
                    <h3 className="history-item-title">
                      Sign Detected: &quot;{item.text}&quot;
                    </h3>
                    <p className="history-item-details">
                      Timestamp: {formatTime(item.timestamp)} · Type: {(item.type || 'word').toUpperCase()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      {Math.round(item.confidence * 100)}% Conf
                    </span>
                    <span className="history-status-badge">
                      <ShieldCheck size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'text-bottom' }} />
                      Verified
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
