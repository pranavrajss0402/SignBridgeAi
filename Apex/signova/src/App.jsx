import { useState } from 'react'

import Sidebar from './components/Sidebar'
import Header from './components/Header'

import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Settings from './pages/Settings'
import ProfileSettings from './pages/ProfileSettings'

import './App.css'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sessionActive, setSessionActive] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Start session
  const handleStartSession = () => {
    console.log('Starting Signova session')

    setSessionActive(true)
    setCurrentPage('dashboard')
    setIsMobileMenuOpen(false)
  }

  // Stop session
  const handleStopSession = () => {
    console.log('Stopping Signova session')

    setSessionActive(false)
  }

  // Sidebar navigation
  const handleNavigate = (page) => {
    console.log('Navigating to:', page)

    setCurrentPage(page)
    setIsMobileMenuOpen(false)
  }

  // Open Profile Settings
  const handleProfileSettings = () => {
    console.log('Opening Profile Settings')

    setCurrentPage('profile')
    setIsMobileMenuOpen(false)
  }

  // Mobile menu
  const handleMenuToggle = () => {
    setIsMobileMenuOpen((previous) => !previous)
  }

  // Render selected page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'history':
        return <History />

      case 'settings':
        return <Settings />

      case 'profile':
        return (
          <ProfileSettings
            onCancel={() => setCurrentPage('dashboard')}
          />
        )

      case 'dashboard':
      default:
        return (
          <Dashboard
            sessionActive={sessionActive}
            onStopSession={handleStopSession}
          />
        )
    }
  }

  return (
    <div className="app-container">

      <Sidebar
        activePage={currentPage}
        onNavigate={handleNavigate}
        onStartSession={handleStartSession}
        onMenuToggle={handleMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="main-wrapper">

        <Header
          onProfileSettings={handleProfileSettings}
        />

        <main className="main-content">
          {renderCurrentPage()}
        </main>

      </div>

    </div>
  )
}