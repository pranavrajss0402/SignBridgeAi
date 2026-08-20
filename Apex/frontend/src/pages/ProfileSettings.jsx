import { useState } from 'react'
import './ProfileSettings.css'

export default function ProfileSettings({ onCancel }) {
  const [profile, setProfile] = useState({
    fullName: 'Signova User',
    username: 'signova_user',
    age: '',
    bio: '',
    location: '',
    phone: '',
    email: 'user@signova.ai',
    pronouns: '',
    website: '',
    language: 'English',
    timezone: 'Asia/Kolkata',
    privacy: 'private',
    sessionNotifications: true,
    systemNotifications: true,
  })

  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setMessage('')
  }

  const handleSave = () => {
    if (!profile.fullName.trim()) {
      setMessage('Please enter your full name.')
      return
    }
    if (!profile.username.trim()) {
      setMessage('Please enter a username.')
      return
    }
    setMessage('Profile settings saved successfully.')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <section className="profile-settings-page">
      <div className="profile-section-title">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: -0.5 }}>
          Profile Settings
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Manage your Signova profile credentials and local user preferences.
        </p>
      </div>

      <div className="settings-card">
        <div className="profile-section-title">
          <h2>Profile Credentials</h2>
          <p>Update personal information and verification options.</p>
        </div>

        {/* Full Name */}
        <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Full Name</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Public display name of the interpreter.</p>
          </div>
          <input
            className="profile-setting-input"
            type="text"
            name="fullName"
            value={profile.fullName}
            onChange={handleChange}
            maxLength={100}
            placeholder="Enter your full name"
          />
        </div>

        {/* Username */}
        <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Username</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Unique interpreter handle.</p>
          </div>
          <input
            className="profile-setting-input"
            type="text"
            name="username"
            value={profile.username}
            onChange={handleChange}
            maxLength={30}
            placeholder="Enter username"
          />
        </div>

        {/* Email */}
        <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Email Address</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Primary notification email.</p>
          </div>
          <div className="profile-input-group">
            <input
              className="profile-setting-input"
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              maxLength={254}
              placeholder="Enter email"
            />
            <span className="verified-badge">✓ Verified</span>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="settings-card">
        <div className="profile-section-title">
          <h2>Regional Preferences</h2>
          <p>Timezone and accessibility preferences.</p>
        </div>

        <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Preferred Language</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Primary output translation language.</p>
          </div>
          <select
            className="profile-setting-input"
            name="language"
            value={profile.language}
            onChange={handleChange}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="Tamil">Tamil (தமிழ்)</option>
            <option value="Telugu">Telugu (తెలుగు)</option>
          </select>
        </div>

        <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Timezone</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Local timezone tracking.</p>
          </div>
          <select
            className="profile-setting-input"
            name="timezone"
            value={profile.timezone}
            onChange={handleChange}
          >
            <option value="Asia/Kolkata">India (GMT+5:30)</option>
            <option value="UTC">Coordinated Universal Time (UTC)</option>
          </select>
        </div>
      </div>

      {/* Save Action */}
      <div className="settings-card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Make sure to save changes before navigating.</span>
          <div className="profile-action-buttons">
            <button className="profile-save-button" onClick={handleSave}>Save Changes</button>
            <button className="profile-cancel-button" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>

      {message && <div className="profile-success-message">{message}</div>}
    </section>
  )
}
