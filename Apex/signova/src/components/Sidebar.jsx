import {
  LayoutGrid,
  Clock,
  Settings,
  Menu,
  X
} from 'lucide-react'

import './Sidebar.css'

export default function Sidebar({
  activePage,
  onNavigate,
  onStartSession,
  onMenuToggle,
  isMobileMenuOpen
}) {

  const handleNavigation = (page) => {
    console.log('Sidebar clicked:', page)

    onNavigate(page)
  }

  return (
    <>
      {/* =====================================================
          MOBILE MENU BUTTON
          ===================================================== */}

      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? (
          <X size={24} />
        ) : (
          <Menu size={24} />
        )}
      </button>


      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`sidebar ${
          isMobileMenuOpen ? 'mobile-open' : ''
        }`}
      >

        {/* =================================================
            LOGO
            ================================================= */}

        <div className="sidebar-logo">

          <div className="logo-icon">

            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >

              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="var(--color-primary-purple)"
                strokeWidth="2"
              />

              <path
                d="M12 14c0-2.2 1.8-4 4-4s4 1.8 4 4"
                stroke="var(--color-primary-purple)"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <circle
                cx="16"
                cy="20"
                r="2"
                fill="var(--color-primary-purple)"
              />

            </svg>

          </div>

          <div className="logo-text">

            <h1 className="logo-title">
              Signova
            </h1>

            <p className="logo-subtitle">
              AI Interpreter
            </p>

          </div>

        </div>


        {/* =================================================
            NAVIGATION
            ================================================= */}

        <nav className="sidebar-nav">

          {/* Dashboard */}

          <button
            type="button"
            className={`nav-item ${
              activePage === 'dashboard'
                ? 'active'
                : ''
            }`}
            onClick={() => handleNavigation('dashboard')}
          >
            <LayoutGrid size={20} />

            <span>
              Dashboard
            </span>
          </button>


          {/* History */}

          <button
            type="button"
            className={`nav-item ${
              activePage === 'history'
                ? 'active'
                : ''
            }`}
            onClick={() => handleNavigation('history')}
          >
            <Clock size={20} />

            <span>
              History
            </span>
          </button>


          {/* Settings */}

          <button
            type="button"
            className={`nav-item ${
              activePage === 'settings'
                ? 'active'
                : ''
            }`}
            onClick={() => handleNavigation('settings')}
          >
            <Settings size={20} />

            <span>
              Settings
            </span>
          </button>

        </nav>


        {/* =================================================
            START SESSION
            ================================================= */}

        <div className="sidebar-footer">

          <button
            type="button"
            className="btn-start-session"
            onClick={onStartSession}
          >
            Start Session
          </button>

        </div>

      </aside>


      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}

      {isMobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={onMenuToggle}
        />
      )}

    </>
  )
}