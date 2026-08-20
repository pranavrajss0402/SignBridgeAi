import { LayoutGrid, Clock, Settings, Menu, X, Zap, Database } from 'lucide-react'
import './Sidebar.css'

export default function Sidebar({
  activePage,
  onNavigate,
  onStartSession,
  onStopSession,
  onMenuToggle,
  isMobileMenuOpen,
  backendOnline,
  aiOnline,
  sessionActive,
}) {
  const handleNavigation = (page) => {
    onNavigate(page)
  }

  return (
    <>
      {/* ── Mobile Menu Toggle ── */}
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" stroke="url(#sg)" strokeWidth="2" />
              <path d="M12 14c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="20" r="2.5" fill="#a855f7" />
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00d4ff" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="logo-text">
            <h1 className="logo-title">Signova</h1>
            <p className="logo-subtitle">AI Sign Interpreter</p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="sidebar-status-row">
          <span className={`sidebar-status-pill ${backendOnline ? 'online' : 'offline'}`}>
            <span className="s-dot" />
            Backend
          </span>
          <span className={`sidebar-status-pill ${aiOnline ? 'online' : 'offline'}`}>
            <span className="s-dot" />
            AI Model
          </span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Workspace</span>

          <button
            type="button"
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigation('dashboard')}
          >
            <LayoutGrid size={18} />
            <span>Dashboard</span>
            {sessionActive && <span className="nav-item-badge">Live</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === 'history' ? 'active' : ''}`}
            onClick={() => handleNavigation('history')}
          >
            <Clock size={18} />
            <span>History</span>
          </button>

          <span className="sidebar-section-label">System</span>

          <button
            type="button"
            className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavigation('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === 'dataset' ? 'active' : ''}`}
            onClick={() => handleNavigation('dataset')}
          >
            <Database size={18} />
            <span>Word Dataset</span>
            <span className="nav-item-badge">113</span>
          </button>
        </nav>

        {/* Dataset Info */}
        <div className="sidebar-words-info">
          <p>
            <strong>ISL Dataset</strong><br />
            113 signs · letters A–Z · gestures
          </p>
        </div>

        {/* Start / Stop Session */}
        <div className="sidebar-footer">
          <button
            type="button"
            className={`btn-start-session ${sessionActive ? 'active-session' : ''}`}
            onClick={sessionActive ? onStopSession : onStartSession}
          >
            {sessionActive ? '⏹ Stop Session' : '▶ Start Session'}
          </button>
        </div>

      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={onMenuToggle} />
      )}
    </>
  )
}
