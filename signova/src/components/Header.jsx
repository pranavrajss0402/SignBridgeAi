import { useEffect, useRef, useState } from 'react'
import {
  Wifi,
  Bell,
  HelpCircle,
  User,
} from 'lucide-react'

import './Header.css'

export default function Header({ onProfileSettings }) {
  const [activeMenu, setActiveMenu] = useState(null)

  const headerRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setActiveMenu(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  // Close dropdown with Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setActiveMenu(null)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Toggle dropdown
  const toggleMenu = (menu) => {
    setActiveMenu((previousMenu) => {
      return previousMenu === menu ? null : menu
    })
  }

  // Profile Settings button
  const handleProfileSettings = () => {
    console.log('Profile Settings clicked')

    // Close dropdown
    setActiveMenu(null)

    // Tell App.jsx to open profile page
    if (typeof onProfileSettings === 'function') {
      onProfileSettings()
    } else {
      console.error(
        'onProfileSettings function was not passed to Header'
      )
    }
  }

  // Sign out
  const handleSignOut = () => {
    console.log('Sign Out clicked')

    setActiveMenu(null)

    alert('Sign out clicked')
  }

  return (
    <header
      className="app-header"
      ref={headerRef}
    >

      <div className="header-spacer" />

      <nav
        className="header-actions"
        aria-label="Header actions"
      >

        {/* ================= CONNECTION ================= */}

        <div className="header-menu-wrapper">

          <button
            type="button"
            className="header-icon-btn"
            aria-label="Connection status"
            aria-haspopup="true"
            aria-expanded={activeMenu === 'connection'}
            onClick={() => toggleMenu('connection')}
          >
            <Wifi size={20} />
          </button>

          {activeMenu === 'connection' && (
            <div
              className="header-dropdown"
              role="dialog"
              aria-label="Connection status"
            >
              <div className="dropdown-title">
                Connection Status
              </div>

              <div className="connection-status">
                <span
                  className="status-dot"
                  aria-hidden="true"
                />

                <span>
                  System Connected
                </span>
              </div>

              <div className="dropdown-small-text">
                All services are running normally.
              </div>
            </div>
          )}

        </div>


        {/* ================= NOTIFICATIONS ================= */}

        <div className="header-menu-wrapper">

          <button
            type="button"
            className="header-icon-btn"
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={activeMenu === 'notifications'}
            onClick={() => toggleMenu('notifications')}
          >
            <Bell size={20} />

            <span
              className="notification-dot"
              aria-hidden="true"
            />
          </button>

          {activeMenu === 'notifications' && (
            <div
              className="header-dropdown"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="dropdown-title">
                Notifications
              </div>

              <div className="notification-item">

                <span
                  className="status-dot"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    System Ready
                  </strong>

                  <p>
                    Signova is ready for interpretation.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>


        {/* ================= HELP ================= */}

        <div className="header-menu-wrapper">

          <button
            type="button"
            className="header-icon-btn"
            aria-label="Help"
            aria-haspopup="true"
            aria-expanded={activeMenu === 'help'}
            onClick={() => toggleMenu('help')}
          >
            <HelpCircle size={20} />
          </button>

          {activeMenu === 'help' && (
            <div
              className="header-dropdown"
              role="dialog"
              aria-label="Signova Help"
            >
              <div className="dropdown-title">
                Signova Help
              </div>

              <p className="help-text">
                Start the camera to begin real-time
                sign language interpretation.
              </p>

              <p className="help-text">
                Make sure your camera permission is enabled.
              </p>
            </div>
          )}

        </div>


        {/* ================= PROFILE ================= */}

        <div className="header-menu-wrapper">

          <button
            type="button"
            className="header-avatar"
            aria-label="Open user profile menu"
            aria-haspopup="true"
            aria-expanded={activeMenu === 'profile'}
            onClick={() => toggleMenu('profile')}
          >
            <div
              className="avatar-circle"
              aria-hidden="true"
            >
              <User size={20} />
            </div>
          </button>

          {activeMenu === 'profile' && (
            <div
              className="header-dropdown profile-dropdown"
              role="menu"
              aria-label="User profile menu"
            >

              <div className="profile-name">
                Signova User
              </div>

              <div className="profile-role">
                AI Interpreter
              </div>

              {/* Profile Settings */}
              <button
                type="button"
                className="profile-action"
                role="menuitem"
                onClick={handleProfileSettings}
              >
                Profile Settings
              </button>

              {/* Sign Out */}
              <button
                type="button"
                className="profile-action"
                role="menuitem"
                onClick={handleSignOut}
              >
                Sign Out
              </button>

            </div>
          )}

        </div>

      </nav>
    </header>
  )
}