import { useEffect, useRef, useState } from 'react'
import { Wifi, Bell, HelpCircle, User } from 'lucide-react'
import './Header.css'

const PAGE_TITLES = {
  dashboard: { title: 'Live Interpretation', subtitle: 'Real-time ISL detection & translation' },
  history: { title: 'History', subtitle: 'Your previous sessions and detections' },
  settings: { title: 'Settings', subtitle: 'Configure Signova preferences' },
  profile: { title: 'Profile Settings', subtitle: 'Manage your account information' },
  dataset: { title: 'Word Dataset', subtitle: 'All 113 supported ISL signs' },
}

export default function Header({ onProfileSettings, backendOnline, aiOnline, activePage }) {
  const [activeMenu, setActiveMenu] = useState(null)
  const headerRef = useRef(null)

  const pageInfo = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard

  useEffect(() => {
    const handleOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setActiveMenu(null)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const toggleMenu = (menu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu))
  }

  const handleProfileSettings = () => {
    setActiveMenu(null)
    if (typeof onProfileSettings === 'function') onProfileSettings()
  }

  return (
    <header className="app-header" ref={headerRef}>

      {/* Page title */}
      <div className="header-page-info">
        <h2 className="header-page-title">{pageInfo.title}</h2>
        <p className="header-page-subtitle">{pageInfo.subtitle}</p>
      </div>

      <div className="header-spacer" />

      <nav className="header-actions" aria-label="Header actions">

        {/* ── Connection ── */}
        <div className="header-menu-wrapper">
          <button
            type="button"
            className="header-icon-btn"
            aria-label="Connection status"
            aria-haspopup="true"
            aria-expanded={activeMenu === 'connection'}
            onClick={() => toggleMenu('connection')}
          >
            <Wifi size={18} />
          </button>

          {activeMenu === 'connection' && (
            <div className="header-dropdown" role="dialog" aria-label="Connection status">
              <div className="dropdown-title">Connection Status</div>

              <div className="dropdown-conn-row">
                <span>Express Backend</span>
                <span className={`conn-badge ${backendOnline ? 'online' : 'offline'}`}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}} />
                  {backendOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="dropdown-conn-row">
                <span>Python AI Server</span>
                <span className={`conn-badge ${aiOnline ? 'online' : 'offline'}`}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}} />
                  {aiOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <p className="dropdown-small-text" style={{marginTop:10}}>
                {backendOnline && aiOnline
                  ? 'All systems operational. Ready for detection.'
                  : 'Some services are offline. Start backend and AI server.'}
              </p>
            </div>
          )}
        </div>

        {/* ── Notifications ── */}
        <div className="header-menu-wrapper">
          <button
            type="button"
            className="header-icon-btn"
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={activeMenu === 'notifications'}
            onClick={() => toggleMenu('notifications')}
          >
            <Bell size={18} />
            <span className="notification-dot" aria-hidden="true" />
          </button>

          {activeMenu === 'notifications' && (
            <div className="header-dropdown" role="dialog" aria-label="Notifications">
              <div className="dropdown-title">Notifications</div>
              <div className="notification-item">
                <span className="notification-item-dot" />
                <div>
                  <strong>System Ready</strong>
                  <p>Signova is ready for ISL interpretation.</p>
                </div>
              </div>
              {!backendOnline && (
                <div className="notification-item" style={{marginTop:8}}>
                  <span className="notification-item-dot" style={{background:'var(--accent-red)'}} />
                  <div>
                    <strong>Backend Offline</strong>
                    <p>Start the Express backend on port 5000.</p>
                  </div>
                </div>
              )}
              {!aiOnline && (
                <div className="notification-item" style={{marginTop:8}}>
                  <span className="notification-item-dot" style={{background:'var(--accent-amber)'}} />
                  <div>
                    <strong>AI Server Offline</strong>
                    <p>Start the Python AI server on port 8000.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Help ── */}
        <div className="header-menu-wrapper">
          <button
            type="button"
            className="header-icon-btn"
            aria-label="Help"
            aria-haspopup="true"
            aria-expanded={activeMenu === 'help'}
            onClick={() => toggleMenu('help')}
          >
            <HelpCircle size={18} />
          </button>

          {activeMenu === 'help' && (
            <div className="header-dropdown" role="dialog" aria-label="Help">
              <div className="dropdown-title">Quick Guide</div>
              <p className="help-text">1. Click <strong style={{color:'var(--accent-cyan)'}}>Start Session</strong> in the sidebar to activate your webcam.</p>
              <p className="help-text">2. Hold an ISL sign in front of the camera clearly, with good lighting.</p>
              <p className="help-text">3. The AI model detects <strong style={{color:'var(--accent-purple)'}}>113 words</strong>, all letters A–Z, and gestures.</p>
              <p className="help-text">4. Translation appears instantly in the detection panel. Sentence builder accumulates words.</p>
              <p className="help-text" style={{marginBottom:0}}>5. Enable TTS in Settings to hear translations aloud.</p>
            </div>
          )}
        </div>

        {/* ── Profile ── */}
        <div className="header-menu-wrapper">
          <button
            type="button"
            className="header-avatar"
            aria-label="User profile"
            aria-haspopup="true"
            aria-expanded={activeMenu === 'profile'}
            onClick={() => toggleMenu('profile')}
          >
            <div className="avatar-circle" aria-hidden="true">
              <User size={16} />
            </div>
          </button>

          {activeMenu === 'profile' && (
            <div className="header-dropdown profile-dropdown" role="menu">
              <div className="profile-name">Signova User</div>
              <div className="profile-role">ISL Interpreter · AI Powered</div>
              <div className="profile-divider" />
              <button
                type="button"
                className="profile-action"
                role="menuitem"
                onClick={handleProfileSettings}
              >
                👤 Profile Settings
              </button>
              <button
                type="button"
                className="profile-action danger"
                role="menuitem"
                onClick={() => setActiveMenu(null)}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>

      </nav>
    </header>
  )
}