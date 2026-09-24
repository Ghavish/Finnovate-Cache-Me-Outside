import { Camera, CameraOff, LoaderCircle, RotateCcw, ScanLine, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// --- Config ---
const MAX_PHOTO_SIDE = 1600 // px; plenty for the AI to read, small enough to upload fast
const PHOTO_QUALITY = 0.85
const MAX_PHOTO_MB = 10

// Live preview needs camera access, which browsers only allow on https or localhost.
const canUseLiveCamera = () => Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia)

const CAMERA_ERRORS = {
  NotAllowedError: 'Camera access was blocked. Allow it in your browser settings, or use your camera app below.',
  NotFoundError: 'No camera was found on this device. Use Upload document instead.',
  NotReadableError: 'The camera is busy in another app. Close it and try again.',
}

// --- Helpers ---
function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Photo could not be created'))), 'image/jpeg', PHOTO_QUALITY)
  })
}

// Draws a video frame or image onto a canvas no larger than MAX_PHOTO_SIDE.
function drawScaled(source, width, height) {
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvasToJpeg(canvas)
}

// Phone photos are often 5-10 MB; shrink them before upload.
async function shrinkPhotoFile(file) {
  try {
    const bitmap = await createImageBitmap(file)
    try {
      return await drawScaled(bitmap, bitmap.width, bitmap.height)
    } finally {
      bitmap.close()
    }
  } catch {
    return file // a format this browser cannot decode (e.g. HEIC): send it as it is
  }
}

export default function CameraCapture({ busy, onPhoto, onError }) {
  const [liveOn, setLiveOn] = useState(false)
  const [starting, setStarting] = useState(false)
  const [photo, setPhoto] = useState(null) // { blob, url }
  const [videoRatio, setVideoRatio] = useState(null) // width / height of the live feed

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const photoUrlRef = useRef('')
  const liveSupported = canUseLiveCamera()

  // Turn the camera off and free the preview when the panel closes.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
  }, [])

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setLiveOn(false)
  }

  function showPhoto(blob) {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    photoUrlRef.current = blob ? URL.createObjectURL(blob) : ''
    setPhoto(blob ? { blob, url: photoUrlRef.current } : null)
  }

  async function startCamera() {
    onError('')
    showPhoto(null)
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      // The frame takes the feed's shape, so the preview shows exactly what the photo captures.
      setVideoRatio(videoRef.current.videoWidth / videoRef.current.videoHeight || null)
      setLiveOn(true)
    } catch (err) {
      stopCamera()
      onError(CAMERA_ERRORS[err.name] || 'The camera could not start. Use your camera app below instead.')
    } finally {
      setStarting(false)
    }
  }

  async function takePhoto() {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const blob = await drawScaled(video, video.videoWidth, video.videoHeight)
    stopCamera()
    showPhoto(blob)
  }

  // Fallback: the phone's own camera app, through a file input with "capture".
  async function onCameraAppPhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onError('That was not a photo. Try again.')
      return
    }
    onError('')
    const blob = await shrinkPhotoFile(file)
    if (blob.size > MAX_PHOTO_MB * 1024 * 1024) {
      onError(`That photo is too large. The limit is ${MAX_PHOTO_MB} MB.`)
      return
    }
    stopCamera()
    showPhoto(blob)
  }

  return (
    <section className="input-method-panel camera-panel">
      <Camera size={29} />
      <h2>Scan with your camera</h2>
      <p>Point your camera at a payslip, receipt or purchase record. Lay it flat in good light and fill the frame.</p>

      <div className="camera-frame" style={liveOn && videoRatio ? { aspectRatio: videoRatio } : undefined}>
        <video ref={videoRef} className={liveOn ? '' : 'hidden'} playsInline muted aria-label="Camera preview" />
        {liveOn && <div className="camera-guide" aria-hidden="true" />}
        {photo && <img src={photo.url} alt="Your captured document" />}
        {!liveOn && !photo && (
          <div className="camera-placeholder">
            {liveSupported ? <Camera size={34} /> : <CameraOff size={34} />}
            <span>{liveSupported ? 'Your camera preview will appear here.' : 'Live preview needs a secure (https) page. Use your camera app below.'}</span>
          </div>
        )}
      </div>

      <div className="camera-actions">
        {photo ? (
          <>
            <button type="button" className="secondary-button" onClick={liveSupported ? startCamera : () => showPhoto(null)} disabled={busy}>
              <RotateCcw size={17} />Retake
            </button>
            <button type="button" className="primary-button" onClick={() => onPhoto(photo.blob)} disabled={busy}>
              {busy ? <LoaderCircle className="spinner" size={18} /> : <ScanLine size={18} />}
              {busy ? 'Reading…' : 'Read photo'}
            </button>
          </>
        ) : liveOn ? (
          <>
            <button type="button" className="secondary-button" onClick={stopCamera}>Cancel</button>
            <button type="button" className="primary-button" onClick={takePhoto}><Camera size={18} />Take photo</button>
          </>
        ) : liveSupported ? (
          <button type="button" className="primary-button" onClick={startCamera} disabled={starting || busy}>
            {starting ? <LoaderCircle className="spinner" size={18} /> : <Camera size={18} />}
            {starting ? 'Starting camera…' : 'Start camera'}
          </button>
        ) : null}
      </div>

      {!liveOn && (
        <label className={`camera-app-link ${busy ? 'disabled' : ''}`}>
          <Smartphone size={17} />
          {photo ? 'Retake with your camera app' : liveSupported ? 'Or use your phone’s camera app' : 'Open your camera app'}
          <input className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={onCameraAppPhoto} disabled={busy} />
        </label>
      )}
    </section>
  )
}
