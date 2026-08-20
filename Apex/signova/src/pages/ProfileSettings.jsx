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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setProfile((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setMessage('')
  }

  const handleSave = () => {
    // Basic validation
    if (!profile.fullName.trim()) {
      setMessage('Please enter your full name.')
      return
    }

    if (!profile.username.trim()) {
      setMessage('Please enter a username.')
      return
    }

    if (profile.age !== '') {
      const age = Number(profile.age)

      if (!Number.isInteger(age) || age < 13 || age > 120) {
        setMessage('Age must be a whole number between 13 and 120.')
        return
      }
    }

    if (
      profile.website &&
      !/^https?:\/\/.+/i.test(profile.website)
    ) {
      setMessage('Website must start with http:// or https://.')
      return
    }

    console.log('Profile saved:', profile)

    setMessage('Profile settings saved successfully.')

    setTimeout(() => {
      setMessage('')
    }, 3000)
  }

  const handleCancel = () => {
    console.log('Profile settings cancelled')

    if (onCancel) {
      onCancel()
    }
  }

  return (
    <section className="page-placeholder profile-settings-page">

      {/* Page Header */}
      <div className="page-placeholder-header">
        <h1>Profile Settings</h1>

        <p>
          Manage your Signova profile information and preferences.
        </p>
      </div>


      {/* =====================================================
          PROFILE INFORMATION
          ===================================================== */}

      <div className="settings-card">

        <div className="profile-section-title">
          <h2>Profile Information</h2>
          <p>
            Update your basic personal information.
          </p>
        </div>


        {/* Full Name */}
        <div className="setting-row">
          <div className="setting-content">
            <h3>Full Name</h3>
            <p>Your display name.</p>
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
        <div className="setting-row">
          <div className="setting-content">
            <h3>Username</h3>
            <p>Your unique Signova username.</p>
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


        {/* Age */}
        <div className="setting-row">
          <div className="setting-content">
            <h3>Age</h3>
            <p>Optional. Must be between 13 and 120.</p>
          </div>

          <input
            className="profile-setting-input profile-age-input"
            type="number"
            name="age"
            value={profile.age}
            onChange={handleChange}
            min="13"
            max="120"
            step="1"
            placeholder="Age"
          />
        </div>


        {/* Email */}
        <div className="setting-row">
          <div className="setting-content">
            <h3>Email Address</h3>
            <p>Your account email address.</p>
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

            <span className="verified-badge">
              ✓ Verified
            </span>
          </div>
        </div>


        {/* Phone */}
        <div className="setting-row">
          <div className="setting-content">
            <h3>Phone Number</h3>
            <p>Optional contact number.</p>
          </div>

          <input
            className="profile-setting-input"
            type="tel"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            maxLength={20}
            placeholder="Enter phone number"
          />
        </div>


        {/* Location */}
        <div className="setting-row">
          <div className="setting-content">
            <h3>Location</h3>
            <p>Your city or country.</p>
          </div>

          <input
            className="profile-setting-input"
            type="text"
            name="location"
            value={profile.location}
            onChange={handleChange}
            maxLength={100}
            placeholder="City, Country"
          />
        </div>


        {/* Pronouns */}
        <div className="setting-row">
          <div className="setting-content">
            <h3>Pronouns</h3>
            <p>Optional profile information.</p>
          </div>

          <input
            className="profile-setting-input"
            type="text"
            name="pronouns"
            value={profile.pronouns}
            onChange={handleChange}
            maxLength={30}
            placeholder="e.g. they/them"
          />
        </div>


        {/* Bio */}
        <div className="setting-row profile-textarea-row">
          <div className="setting-content">
            <h3>Bio</h3>
            <p>A short description about yourself.</p>
          </div>

          <textarea
            className="profile-setting-textarea"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            maxLength={250}
            placeholder="Tell us a little about yourself..."
          />

          <span className="character-count">
            {profile.bio.length}/250
          </span>
        </div>

      </div>


      {/* =====================================================
          PREFERENCES
          ===================================================== */}

      <div className="settings-card profile-preferences-card">

        <div className="profile-section-title">
          <h2>Preferences</h2>
          <p>
            Customize your Signova experience.
          </p>
        </div>


        {/* Language */}
        <div className="setting-row">
          <div className="setting-content">
            <h3>Preferred Language</h3>
            <p>Language used in the application.</p>
          </div>

          <select
            className="profile-setting-input"
            name="language"
            value={profile.language}
            onChange={handleChange}
          >
            <option value="English">English</option>
            <option value="Tamil">Tamil</option>
            <option value="Hindi">Hindi</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Telugu">Telugu</option>
            <option value="Kannada">Kannada</option>
          </select>
        </div>


        {/* Timezone */}
        <div className="setting-row">
          <div className="setting-content">
            <h3>Timezone</h3>
            <p>Your preferred timezone.</p>
          </div>

          <select
            className="profile-setting-input"
            name="timezone"
            value={profile.timezone}
            onChange={handleChange}
          >
            <option value="Asia/Kolkata">
              India (Asia/Kolkata)
            </option>

            <option value="UTC">
              UTC
            </option>

            <option value="America/New_York">
              Eastern Time
            </option>

            <option value="Europe/London">
              London
            </option>
          </select>
        </div>


        {/* Website */}
        <div className="setting-row">
          <div className="setting-content">
            <h3>Website</h3>
            <p>Optional website or social profile.</p>
          </div>

          <input
            className="profile-setting-input"
            type="url"
            name="website"
            value={profile.website}
            onChange={handleChange}
            maxLength={200}
            placeholder="https://example.com"
          />
        </div>

      </div>


      {/* =====================================================
          PRIVACY
          ===================================================== */}

      <div className="settings-card">

        <div className="profile-section-title">
          <h2>Privacy</h2>
          <p>
            Control how your profile is displayed.
          </p>
        </div>


        <div className="setting-row">
          <div className="setting-content">
            <h3>Profile Visibility</h3>
            <p>
              Choose who can view your profile.
            </p>
          </div>

          <select
            className="profile-setting-input"
            name="privacy"
            value={profile.privacy}
            onChange={handleChange}
          >
            <option value="private">
              Private
            </option>

            <option value="public">
              Public
            </option>
          </select>
        </div>

      </div>


      {/* =====================================================
          NOTIFICATIONS
          ===================================================== */}

      <div className="settings-card">

        <div className="profile-section-title">
          <h2>Notifications</h2>
          <p>
            Choose which notifications you want to receive.
          </p>
        </div>


        <div className="setting-row">
          <div className="setting-content">
            <h3>Session Notifications</h3>
            <p>
              Notifications related to interpretation sessions.
            </p>
          </div>

          <label className="profile-switch">
            <input
              type="checkbox"
              name="sessionNotifications"
              checked={profile.sessionNotifications}
              onChange={handleChange}
            />

            <span className="profile-slider" />
          </label>
        </div>


        <div className="setting-row">
          <div className="setting-content">
            <h3>System Notifications</h3>
            <p>
              Important Signova system notifications.
            </p>
          </div>

          <label className="profile-switch">
            <input
              type="checkbox"
              name="systemNotifications"
              checked={profile.systemNotifications}
              onChange={handleChange}
            />

            <span className="profile-slider" />
          </label>
        </div>

      </div>


      {/* =====================================================
          ACTIONS
          ===================================================== */}

      <div className="settings-card profile-actions-card">

        <div className="setting-row profile-actions-row">

          <div className="setting-content">
            <h3>Profile Actions</h3>

            <p>
              Save your profile changes or cancel.
            </p>
          </div>

          <div className="profile-action-buttons">

            <button
              type="button"
              className="profile-save-button"
              onClick={handleSave}
            >
              Save Changes
            </button>

            <button
              type="button"
              className="profile-cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>

          </div>

        </div>

      </div>


      {/* Success / Error Message */}
      {message && (
        <div
          className="profile-success-message"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}

    </section>
  )
}