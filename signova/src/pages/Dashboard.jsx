import { useState, useCallback } from 'react'
import WebcamPanel from '../components/WebcamPanel'
import DetectionStatus from '../components/DetectionStatus'
import AvatarPanel from '../components/AvatarPanel'
import SystemLog from '../components/SystemLog'
import OutputTranslation from '../components/OutputTranslation'
import Footer from '../components/Footer'
import './Dashboard.css'

export default function Dashboard({ sessionActive, onStopSession }) {
  const [detectionData, setDetectionData] = useState({
    sign: 'HELLO',
    confidence: 0,
    status: 'Ready'
  })

  const handleDetectionUpdate = useCallback((data) => {
    setDetectionData({
      sign: data.sign,
      confidence: data.confidence,
      status: 'Ready'
    })
  }, [])

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        {/* Page Title */}
        <section className="page-header">
          <div>
            <h1 className="page-title">Live Interpretation Workspace</h1>
            <p className="page-subtitle">Real-time ASL detection and translation.</p>
          </div>
        </section>

        {/* Main Layout */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-left">
            <WebcamPanel 
              onStopSession={onStopSession}
              onDetectionUpdate={handleDetectionUpdate}
            />

            <SystemLog />
          </div>

          {/* Right Column */}
          <div className="dashboard-right">
            <DetectionStatus data={detectionData} />
            <AvatarPanel isActive={sessionActive} />
            <OutputTranslation text={detectionData.sign} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
