// --- Voice notes: browser recording -> 16 kHz mono WAV ---
// Browsers record WebM (Chrome, Firefox) or MP4 (Safari). Gemini reliably accepts WAV,
// so the recording is decoded, mixed to mono, resampled and saved as 16-bit PCM WAV.
// About 1.9 MB per minute, well under n8n's default 16 MB request limit.

const SAMPLE_RATE = 16000

export async function toWav(blob) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  const decoder = new AudioContextClass()
  try {
    const decoded = await decoder.decodeAudioData(await blob.arrayBuffer())
    const frameCount = Math.max(1, Math.ceil(decoded.duration * SAMPLE_RATE))
    const offline = new OfflineAudioContext(1, frameCount, SAMPLE_RATE) // 1 channel: the browser mixes down to mono
    const source = offline.createBufferSource()
    source.buffer = decoded
    source.connect(offline.destination)
    source.start()
    const rendered = await offline.startRendering()
    return encodeWav(rendered.getChannelData(0), SAMPLE_RATE)
  } finally {
    decoder.close?.()
  }
}

export function encodeWav(samples, sampleRate) {
  const bytesPerSample = 2
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeText = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)) }

  // --- Header ---
  writeText(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true) // byte rate
  view.setUint16(32, bytesPerSample, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeText(36, 'data')
  view.setUint32(40, dataSize, true)

  // --- Samples: float -1..1 -> 16-bit integers ---
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * bytesPerSample, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
