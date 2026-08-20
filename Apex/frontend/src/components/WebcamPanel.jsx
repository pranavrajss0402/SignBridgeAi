import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { FilesetResolver, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { extractUnifiedLandmarks } from "../utils/landmarkExtractor";
import { SequenceBuffer } from "../utils/sequenceBuffer";

export default function WebcamPanel({ sentenceModelEnabled = true, sessionActive = false }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const sequenceBufferRef = useRef(null);
  const lastSendTimeRef = useRef(0);
  const sentenceModelEnabledRef = useRef(sentenceModelEnabled);

  useEffect(() => {
    sentenceModelEnabledRef.current = sentenceModelEnabled;
  }, [sentenceModelEnabled]);

  const [ready, setReady] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [sequenceCount, setSequenceCount] = useState(0);
  const [multiPersonWarning, setMultiPersonWarning] = useState(false);

  // Send sequence to python AI server
  const sendSequenceToAI = async (sequence) => {
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sequence,
          sentenceModelEnabled: sentenceModelEnabledRef.current,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        console.error("AI inference error:", data.message);
      }
    } catch (error) {
      console.error("Error communicating with AI server:", error);
    }
  };

  // Initialize MediaPipe when session starts
  useEffect(() => {
    if (!sessionActive) {
      setReady(false);
      setHandDetected(false);
      setPoseDetected(false);
      setFeatureCount(0);
      setSequenceCount(0);
      setMultiPersonWarning(false);
      return;
    }

    let mounted = true;

    async function initializeMediaPipe() {
      try {
        console.log("Initializing SIGNOVA MediaPipe...");
        const vision = await FilesetResolver.forVisionTasks("/wasm");

        // 1. Hand Landmarker - detect max 2 hands
        const handLandmarker = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: "/hand_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
          }
        );

        // 2. Pose Landmarker - detect up to 3 people for multi-person warning
        const poseLandmarker = await PoseLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: "/pose_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numPoses: 3,
          }
        );

        sequenceBufferRef.current = new SequenceBuffer(30);

        if (mounted) {
          handLandmarkerRef.current = handLandmarker;
          poseLandmarkerRef.current = poseLandmarker;
          setReady(true);
          console.log("SIGNOVA MediaPipe components fully operational.");
        }
      } catch (error) {
        console.error("MediaPipe initialization failed:", error);
      }
    }

    initializeMediaPipe();

    return () => {
      mounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
      if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
      if (sequenceBufferRef.current) sequenceBufferRef.current.clear();
    };
  }, [sessionActive]);

  // Pose Connection drawing helper
  const drawPose = (ctx, poseLandmarks, width, height) => {
    if (!poseLandmarks) return;
    ctx.fillStyle = "rgba(0, 212, 255, 0.7)";
    for (const point of poseLandmarks) {
      if (point.visibility !== undefined && point.visibility < 0.5) continue;
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    const poseConnections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
      [24, 26], [26, 28],
    ];
    ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
    ctx.lineWidth = 1.5;
    for (const [start, end] of poseConnections) {
      const p1 = poseLandmarks[start];
      const p2 = poseLandmarks[end];
      if (!p1 || !p2) continue;
      if (p1.visibility !== undefined && p1.visibility < 0.5) continue;
      if (p2.visibility !== undefined && p2.visibility < 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }
  };

  // Hand Connection drawing helper
  const drawHands = (ctx, handResults, width, height) => {
    if (!handResults?.landmarks) return;
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17],
    ];
    for (const landmarks of handResults.landmarks) {
      ctx.fillStyle = "#a855f7";
      for (const point of landmarks) {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(168, 85, 247, 0.6)";
      ctx.lineWidth = 2;
      for (const [start, end] of connections) {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        if (!p1 || !p2) continue;
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    }
  };

  // Run frame processing
  useEffect(() => {
    if (!ready || !sessionActive) return;

    const detectEverything = () => {
      const webcam = webcamRef.current;
      const video = webcam?.video;

      if (
        video &&
        video.readyState >= 2 &&
        handLandmarkerRef.current &&
        poseLandmarkerRef.current
      ) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (canvas && ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          const timestamp = performance.now();

          // 1. Pose detection (people count check)
          let poseResults = null;
          try {
            poseResults = poseLandmarkerRef.current.detectForVideo(video, timestamp);
          } catch (e) {
            console.error("Pose detection error:", e);
          }

          const numPeople = poseResults?.landmarks?.length || 0;
          setPoseDetected(numPeople > 0);

          if (numPeople > 1) {
            setMultiPersonWarning(true);
            setHandDetected(false);
            setFeatureCount(0);
            if (sequenceBufferRef.current) {
              sequenceBufferRef.current.clear();
              setSequenceCount(0);
            }
            ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
            ctx.fillRect(0, 0, width, height);
            ctx.font = "bold 20px Inter, sans-serif";
            ctx.fillStyle = "#ef4444";
            ctx.textAlign = "center";
            ctx.fillText("⚠ Only one person allowed", width / 2, height / 2);

            if (poseResults?.landmarks) {
              for (const pose of poseResults.landmarks) {
                drawPose(ctx, pose, width, height);
              }
            }
            animationRef.current = requestAnimationFrame(detectEverything);
            return;
          }

          setMultiPersonWarning(false);

          if (numPeople === 1 && poseResults?.landmarks?.[0]) {
            drawPose(ctx, poseResults.landmarks[0], width, height);
          }

          // 2. Hand landmarks
          let handResults = null;
          try {
            handResults = handLandmarkerRef.current.detectForVideo(video, timestamp);
          } catch (e) {
            console.error("Hand detection error:", e);
          }

          const handsFound = handResults?.landmarks?.length > 0;
          setHandDetected(handsFound);

          if (handsFound) {
            drawHands(ctx, handResults, width, height);
            try {
              const features = extractUnifiedLandmarks(null, handResults, null);
              setFeatureCount(features.length);

              if (sequenceBufferRef.current) {
                sequenceBufferRef.current.add(features);
                const currentLength = sequenceBufferRef.current.length;
                setSequenceCount(currentLength);

                if (sequenceBufferRef.current.length > 0) {
                  const seq = sequenceBufferRef.current.buffer.map((f) => [...f]);
                  const now = performance.now();
                  if (now - lastSendTimeRef.current > 300) {
                    lastSendTimeRef.current = now;
                    sendSequenceToAI(seq);
                  }
                }
              }
            } catch (e) {
              console.error("Feature extraction error:", e);
            }
          } else {
            setFeatureCount(0);
          }
        }
      }

      animationRef.current = requestAnimationFrame(detectEverything);
    };

    detectEverything();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [ready, sessionActive]);

  return (
    <div className={`glass-card webcam-card ${handDetected ? "hand-detected" : ""}`} style={{ minHeight: 320 }}>
      <h3>📷 Live Camera Feed</h3>

      {sessionActive ? (
        <>
          <div className="webcam-wrapper">
            <Webcam
              ref={webcamRef}
              audio={false}
              width="100%"
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
            />
            <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
          </div>

          {multiPersonWarning && (
            <div className="multi-person-warning">
              ⚠ Please keep only one person in the camera view
            </div>
          )}

          <div className="sequence-progress">
            <div className="sequence-progress-bar" style={{ width: `${(sequenceCount / 30) * 100}%` }} />
          </div>

          <div className="webcam-status-row">
            <span className={`webcam-status-chip ${ready ? "active" : ""}`}>
              <span className="chip-dot"></span>
              {ready ? "MediaPipe Ready" : "Loading Models..."}
            </span>
            <span className={`webcam-status-chip ${handDetected ? "active" : ""}`}>
              <span className="chip-dot"></span>
              Hands: {handDetected ? "✓" : "—"}
            </span>
            <span className={`webcam-status-chip ${poseDetected ? "active" : ""}`}>
              <span className="chip-dot"></span>
              Pose: {poseDetected ? "✓" : "—"}
            </span>
            <span className="webcam-status-chip">
              {featureCount} features
            </span>
            <span className={`webcam-status-chip ${sequenceCount >= 30 ? "active" : ""}`}>
              Buffer: {sequenceCount}/30
            </span>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, padding: 30, background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Camera Interface Offline</h4>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>
            To protect privacy and reduce background resource usage, the camera turns off when interpretation sessions are inactive.
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Click &quot;Start Session&quot; in the sidebar to activate camera.
          </p>
        </div>
      )}
    </div>
  );
}