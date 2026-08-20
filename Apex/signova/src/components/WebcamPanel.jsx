import { useCallback, useEffect, useRef, useState } from 'react'
import './webcampanel.css'

export default function WebcamPanel({
  onStopSession,
  onDetectionUpdate,
}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mountedRef = useRef(true)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState('')

  /* =========================================================
     START CAMERA
     ========================================================= */

  const startCamera = useCallback(async () => {
    if (streamRef.current || cameraLoading) {
      console.log('Camera is already running or starting')
      return
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        'Camera access is not supported by this browser.'
      )
      return
    }

    try {
      setCameraLoading(true)
      setCameraError('')

      console.log('Requesting camera permission...')

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
        },
        audio: false,
      })

      /* If component was unmounted while permission was requested */
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        try {
          await videoRef.current.play()
        } catch (error) {
          console.warn('Video playback warning:', error)
        }
      }

      setCameraActive(true)

      console.log('Camera started successfully')

      if (typeof onDetectionUpdate === 'function') {
        onDetectionUpdate({
          sign: 'HELLO',
          confidence: 0,
        })
      }
    } catch (error) {
      console.error('Camera start error:', error)

      if (error.name === 'NotAllowedError') {
        setCameraError(
          'Camera permission was denied. Please allow camera access.'
        )
      } else if (error.name === 'NotFoundError') {
        setCameraError(
          'No camera was found on this device.'
        )
      } else if (error.name === 'NotReadableError') {
        setCameraError(
          'The camera is already being used by another application.'
        )
      } else if (error.name === 'OverconstrainedError') {
        setCameraError(
          'The requested camera settings are not available.'
        )
      } else {
        setCameraError(
          'Unable to access the camera. Please try again.'
        )
      }

      setCameraActive(false)
    } finally {
      if (mountedRef.current) {
        setCameraLoading(false)
      }
    }
  }, [cameraLoading, onDetectionUpdate])

  /* =========================================================
     STOP CAMERA
     ========================================================= */

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...')

    const stream = streamRef.current

    if (stream) {
      const tracks = stream.getTracks()

      console.log(`Stopping ${tracks.length} camera track(s)`)

      tracks.forEach((track) => {
        console.log(
          `Stopping ${track.kind} track: ${track.readyState}`
        )

        track.stop()
      })

      streamRef.current = null
    }

    /* Completely disconnect stream from video element */
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    setCameraActive(false)
    setCameraLoading(false)

    console.log('Camera stopped successfully')

    if (typeof onStopSession === 'function') {
      onStopSession()
    }
  }, [onStopSession])

  /* =========================================================
     VIDEO METADATA
     ========================================================= */

  const handleVideoLoaded = () => {
    console.log('Video metadata loaded')

    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch((error) => {
        console.warn(
          'Unable to start video playback:',
          error
        )
      })
    }
  }

  /* =========================================================
     COMPONENT CLEANUP
     ========================================================= */

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false

      console.log(
        'WebcamPanel unmounted - cleaning camera'
      )

      const stream = streamRef.current

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })

        streamRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      }
    }
  }, [])

  /* =========================================================
     ESCAPE KEY
     ========================================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && cameraActive) {
        stopCamera()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [cameraActive, stopCamera])

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <section
      className="webcam-panel"
      aria-label="Webcam interpretation panel"
    >

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="webcam-panel-header">

        <div>
          <h2>Live Camera</h2>

          <p>
            {cameraActive
              ? 'Camera is active'
              : 'Camera is ready to start'}
          </p>
        </div>

        <div
          className={`camera-status ${
            cameraActive ? 'active' : 'inactive'
          }`}
          aria-live="polite"
        >
          <span
            className="camera-status-dot"
            aria-hidden="true"
          />

          {cameraActive
            ? 'Camera Active'
            : 'Camera Off'}
        </div>

      </div>

      {/* =====================================================
          VIDEO
          ===================================================== */}

      <div className="webcam-container">

        <video
          ref={videoRef}
          className="webcam-video"
          autoPlay
          playsInline
          muted
          onLoadedMetadata={handleVideoLoaded}
          aria-label="Live camera preview"
        />

        {!cameraActive && !cameraLoading && (
          <div className="webcam-placeholder">

            <div className="placeholder-icon">
              📷
            </div>

            <h3 className="placeholder-title">
              Camera is Off
            </h3>

            <p className="placeholder-text">
              Click Start Camera to begin
              sign language detection.
            </p>

          </div>
        )}

        {cameraLoading && (
          <div className="webcam-placeholder">

            <div className="placeholder-title">
              Starting camera...
            </div>

            <p className="placeholder-text">
              Please allow camera permission
              if your browser asks.
            </p>

          </div>
        )}

      </div>

      {/* =====================================================
          ERROR MESSAGE
          ===================================================== */}

      {cameraError && (
        <div
          className="error-message"
          role="alert"
        >
          {cameraError}
        </div>
      )}

      {/* =====================================================
          CAMERA CONTROLS
          ===================================================== */}

      <div className="camera-controls">

        {/* START CAMERA */}

        <button
          type="button"
          className={`btn-camera ${
            cameraLoading ? 'loading' : ''
          }`}
          onClick={startCamera}
          disabled={cameraActive || cameraLoading}
          aria-label="Start camera"
        >
          {cameraLoading
            ? 'Starting...'
            : 'Start Camera'}
        </button>

        {/* STOP CAMERA */}

        <button
          type="button"
          className="btn-stop"
          onClick={stopCamera}
          disabled={!cameraActive}
          aria-label="Stop camera"
        >
          Stop Camera
        </button>

      </div>

    </section>
  )
}