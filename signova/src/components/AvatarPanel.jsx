import { Zap } from 'lucide-react'
import './AvatarPanel.css'

/**
 * AvatarPanel Component
 * 
 * This is a placeholder for the 3D avatar visualization module.
 * The actual avatar component from AK's team will replace this
 * without requiring changes to the parent layout.
 * 
 * Props:
 * - avatarComponent: (optional) React component to render in the visualization area
 * - isActive: (optional) Whether video feed is active
 * - onInitialize: (optional) Callback when avatar system should initialize
 */
export default function AvatarPanel({ 
  avatarComponent = null, 
  isActive = false,
  onInitialize = () => {}
}) {
  return (
    <section className="avatar-panel-card">
      <div className="card-header">
        <h3 className="card-title">3D VISUALIZATION</h3>
        <button 
          className="btn-avatar-settings"
          aria-label="Avatar settings"
          title="Avatar settings"
        >
          <Zap size={16} />
        </button>
      </div>

      <div className="avatar-visualization">
        {avatarComponent ? (
          <div className="avatar-content">
            {avatarComponent}
          </div>
        ) : (
          <>
            <div className="placeholder-avatar">
              <Zap size={48} />
            </div>
            <p className="placeholder-status">Avatar Module Inactive</p>
            <p className="placeholder-hint">Requires Video Feed</p>
            {!isActive && (
              <button 
                className="btn-init-avatar"
                onClick={onInitialize}
              >
                Initialize
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
