import { useState, useRef, useCallback, useEffect } from 'react'
import './components.css'

export default function CameraStep({ onPhotoTaken }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [mode, setMode] = useState('intro') // intro | camera | preview | upload
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [friendName, setFriendName] = useState('')
  const [cameraError, setCameraError] = useState(null)
  const [facingMode, setFacingMode] = useState('user')

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setMode('camera')
    } catch (err) {
      setCameraError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้อง')
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCapturedPhoto(dataUrl)
    stopCamera()
    setMode('preview')
  }, [facingMode, stopCamera])

  const handleUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCapturedPhoto(ev.target.result)
      setMode('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null)
    startCamera()
  }, [startCamera])

  const handleConfirm = useCallback(() => {
    if (!friendName.trim()) {
      alert('กรุณาใส่ชื่อเพื่อนก่อน! 🥺')
      return
    }
    onPhotoTaken(capturedPhoto, friendName.trim())
  }, [capturedPhoto, friendName, onPhotoTaken])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  // ===== INTRO =====
  if (mode === 'intro') {
    return (
      <div className="camera-step">
        <div className="card intro-card">
          <div className="intro-icon">📸</div>
          <div className="section-title">
            <h2>ขั้นตอนที่ 1</h2>
            <p>ถ่ายรูปเพื่อนที่อยากให้ AI จีบ!</p>
          </div>
          <p className="intro-desc">
            ถ่ายรูปเพื่อนของคุณ แล้ว AI จะสร้างรูปตลกๆ<br/>
            จากนั้น AI จะจีบเพื่อนคุณด้วยเสียง! 🎭💘
          </p>
          {cameraError && <p className="error-msg">⚠️ {cameraError}</p>}
          <div className="intro-actions">
            <button className="btn-primary" id="btn-open-camera" onClick={startCamera}>
              📷 เปิดกล้องถ่ายรูป
            </button>
            <div className="or-divider"><span>หรือ</span></div>
            <label className="btn-secondary upload-label" htmlFor="upload-photo">
              🖼️ อัพโหลดรูปภาพ
            </label>
            <input
              id="upload-photo"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    )
  }

  // ===== CAMERA =====
  if (mode === 'camera') {
    return (
      <div className="camera-step">
        <div className="camera-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          <div className="camera-overlay">
            <div className="camera-frame">
              <div className="camera-corner tl" />
              <div className="camera-corner tr" />
              <div className="camera-corner bl" />
              <div className="camera-corner br" />
            </div>
            <p className="camera-hint">จัดหน้าเพื่อนให้อยู่ในกรอบ ✨</p>
          </div>
          <div className="camera-controls">
            <button className="btn-secondary" id="btn-flip-camera" onClick={() => {
              setFacingMode(m => m === 'user' ? 'environment' : 'user')
              stopCamera()
              setMode('intro')
            }}>🔄 พลิกกล้อง</button>
            <button className="btn-capture" id="btn-capture" onClick={capturePhoto}>
              <div className="capture-inner" />
            </button>
            <button className="btn-secondary" id="btn-cancel-camera" onClick={() => {
              stopCamera()
              setMode('intro')
            }}>✕ ยกเลิก</button>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    )
  }

  // ===== PREVIEW =====
  if (mode === 'preview') {
    return (
      <div className="camera-step">
        <div className="card preview-card">
          <div className="section-title">
            <h2>📸 รูปเพื่อนคุณ!</h2>
            <p>โอ้โห หล่อ/สวยมาก! AI จะปั้นได้สวยแน่ 😏</p>
          </div>
          <div className="preview-photo-wrap">
            <img src={capturedPhoto} alt="friend" className="preview-photo" />
            <div className="preview-photo-glow" />
          </div>
          <div className="name-input-wrap">
            <label className="input-label" htmlFor="friend-name">ชื่อเพื่อนคนนี้คือ?</label>
            <input
              id="friend-name"
              type="text"
              className="input-field"
              placeholder="เช่น น้องบีม, พี่โจ, ต้น..."
              value={friendName}
              onChange={e => setFriendName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            />
          </div>
          <div className="preview-actions">
            <button className="btn-secondary" id="btn-retake" onClick={handleRetake}>
              🔄 ถ่ายใหม่
            </button>
            <button
              className="btn-primary"
              id="btn-confirm-photo"
              onClick={handleConfirm}
              disabled={!friendName.trim()}
            >
              ✨ เจนรูปตลกเลย!
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    )
  }

  return null
}
