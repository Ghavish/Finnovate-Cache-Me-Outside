import {
  AlertTriangle,
  Camera,
  FileText,
  Keyboard,
  LoaderCircle,
  Mic,
  Pencil,
  Plus,
  Sparkles,
  Square,
  Trash2,
  Upload,
  WalletCards,
} from 'lucide-react'

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraCapture from '../components/input/CameraCapture.jsx'
import { callN8n } from '../firebase/apiClient.js'
import { centsToRupees, money, rupeesToCents } from '../utils/money.js'

// --- Config ---
const LOW_CONFIDENCE = 0.7 // same threshold as the n8n Guardrail
const MAX_FILE_MB = 10
const MAX_RECORDING_SECONDS = 120

const methods = [
  { id: 'upload', label: 'Upload document', description: 'Payslip, receipt or purchase', Icon: Upload },
  { id: 'camera', label: 'Scan with camera', description: 'Use your phone camera', Icon: Camera },
  { id: 'voice', label: 'Voice input', description: 'Describe it out loud', Icon: Mic },
  { id: 'manual', label: 'Manual entry', description: 'Type the details', Icon: Keyboard },
]

const DOC_TYPES = [
  { id: 'payslip', label: 'Payslip' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'purchase', label: 'Purchase' },
]

// Same list as the n8n Guardrail and Confirm Check nodes.
const CATEGORIES = [
  'groceries', 'dining', 'transport', 'fuel', 'utilities', 'rent', 'telecom',
  'health', 'education', 'clothing', 'household', 'entertainment',
  'subscriptions', 'gifts', 'festival', 'salary', 'other',
]

const ERROR_TEXT = {
  EXTRACTION_FAILED: 'The AI could not read this. Try a clearer file, or use Manual entry.',
  UNAUTHORIZED: 'Your session has expired. Log in again.',
}

// --- Helpers ---
const todayLocal = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
const capitalise = (text) => (text ? text[0].toUpperCase() + text.slice(1) : '')
const docTypeLabel = (id) => DOC_TYPES.find((type) => type.id === id)?.label || 'Document'

function blankLine(docType) {
  return docType === 'payslip'
    ? { name: 'Net salary', amount: '', qty: 1, category: 'salary', direction: 'income' }
    : { name: '', amount: '', qty: 1, category: 'other', direction: 'expense' }
}

function manualDraft() {
  return {
    docType: 'receipt', summary: '', confidenceScore: null, lowConfidence: false, flags: [],
    vendor: '', txnDate: todayLocal(), lineItems: [blankLine('receipt')], source: 'manual',
  }
}

// Turns the n8n preview (integer cents) into an editable draft (rupees).
function draftFromPreview(preview) {
  return {
    docType: preview.docType || 'purchase',
    summary: preview.summary || '',
    confidenceScore: Number(preview.confidenceScore) || 0,
    lowConfidence: Boolean(preview.lowConfidence),
    flags: preview.flags || [],
    vendor: preview.vendor || '',
    txnDate: preview.txnDate || todayLocal(),
    source: preview.source || 'document',
    lineItems: (preview.lineItems || []).map((line) => ({
      name: line.name || '',
      amount: String(centsToRupees(line.price)),
      qty: line.qty || 1,
      category: CATEGORIES.includes(line.category) ? line.category : 'other',
      direction: line.direction === 'income' ? 'income' : 'expense',
    })),
  }
}

const lineTotal = (line) => (Number(line.amount) || 0) * (Number(line.qty) || 0)

function validate(draft) {
  if (!draft.lineItems.length) return 'Add at least one line.'
  for (const line of draft.lineItems) {
    if (!line.name.trim()) return 'Every line needs a name.'
    if (!(Number(line.amount) > 0)) return `Enter an amount above 0 for "${line.name}".`
    if (!(Number(line.qty) > 0)) return `Enter a quantity above 0 for "${line.name}".`
  }
  if (draft.docType === 'payslip' && !draft.lineItems.some((line) => line.direction === 'income')) {
    return 'A payslip needs an income line with your net salary.'
  }
  return ''
}

function readAsBase64(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(fileOrBlob)
  })
}

export default function InputDataPage() {
  const navigate = useNavigate()

  const [method, setMethod] = useState('upload')
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState('') // '' | 'reading' | 'saving'
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [showLowConfidence, setShowLowConfidence] = useState(false)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)

  const recorderRef = useRef(null)
  const timerRef = useRef(null)

  // Release the microphone if the user leaves mid-recording.
  useEffect(() => () => {
    window.clearInterval(timerRef.current)
    const recorder = recorderRef.current
    if (recorder) {
      recorder.onstop = null
      if (recorder.state !== 'inactive') recorder.stop()
      recorder.stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function chooseMethod(nextMethod) {
    setMethod(nextMethod)
    setError('')
    setFileName('')
    setShowLowConfidence(false)
    setDraft(nextMethod === 'manual' ? manualDraft() : null)
    setEditing(nextMethod === 'manual')
  }

  // --- AI preview (nothing is saved yet) ---
  async function requestPreview(payload) {
    setBusy('reading')
    setError('')
    setDraft(null)
    try {
      const preview = draftFromPreview(await callN8n(payload))
      setDraft(preview)
      setEditing(false)
      setShowLowConfidence(preview.lowConfidence)
    } catch (err) {
      console.error('AI preview failed:', err)
      setError(ERROR_TEXT[err.message] || 'Something went wrong while reading this. Try again.')
    } finally {
      setBusy('')
    }
  }

  async function onFileChosen(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // lets the same file be picked again
    if (!file) return

    const isPdf = file.type === 'application/pdf'
    if (!isPdf && !file.type.startsWith('image/')) {
      setError('Only images (JPG, PNG and similar) and PDF files can be read.')
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`That file is too large. The limit is ${MAX_FILE_MB} MB.`)
      return
    }

    setFileName(file.name)
    await requestPreview({
      inputType: isPdf ? 'document' : 'receipt',
      fileData: await readAsBase64(file),
      mimeType: file.type,
      fileName: file.name,
    })
  }

  // Camera photos are already shrunk to a JPEG; they go through the image (receipt) route.
  async function onCameraPhoto(photo) {
    await requestPreview({
      inputType: 'receipt',
      fileData: await readAsBase64(photo),
      mimeType: photo.type || 'image/jpeg',
      fileName: 'camera-scan.jpg',
    })
  }

  // --- Voice recording ---
  async function startRecording() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio. Try Chrome, Edge or Firefox.')
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone access was blocked. Allow it in your browser and try again.')
      return
    }

    const recorder = new MediaRecorder(stream)
    const chunks = []
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop())
      const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
      if (!audio.size) {
        setError('Nothing was recorded. Try again.')
        return
      }
      await requestPreview({
        inputType: 'voiceNote',
        fileData: await readAsBase64(audio),
        mimeType: audio.type.split(';')[0],
      })
    }

    recorderRef.current = recorder
    recorder.start()
    setDraft(null)
    setRecording(true)
    setSeconds(0)
    let elapsed = 0
    timerRef.current = window.setInterval(() => {
      elapsed += 1
      setSeconds(elapsed)
      if (elapsed >= MAX_RECORDING_SECONDS) stopRecording()
    }, 1000)
  }

  function stopRecording() {
    window.clearInterval(timerRef.current)
    setRecording(false)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  // --- Draft editing ---
  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }))
  const updateLine = (index, field, value) => setDraft((current) => ({
    ...current,
    lineItems: current.lineItems.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
  }))
  const addLine = () => setDraft((current) => ({
    ...current, lineItems: [...current.lineItems, blankLine(current.docType)],
  }))
  const removeLine = (index) => setDraft((current) => ({
    ...current, lineItems: current.lineItems.filter((_, i) => i !== index),
  }))

  // Manual entry: switching to Payslip swaps an untouched blank line for "Net salary".
  function changeDocType(docType) {
    setDraft((current) => {
      const untouched = current.lineItems.length === 1 && !current.lineItems[0].amount
      return { ...current, docType, lineItems: untouched ? [blankLine(docType)] : current.lineItems }
    })
  }

  // --- Save: the only step that writes to MongoDB ---
  async function analyseFinances() {
    const problem = validate(draft)
    if (problem) {
      setError(problem)
      setEditing(true)
      return
    }

    setBusy('saving')
    setError('')
    try {
      const saved = await callN8n({
        inputType: 'confirmTransaction',
        docType: draft.docType,
        vendor: draft.vendor.trim() || null,
        txnDate: draft.txnDate,
        source: draft.source,
        lineItems: draft.lineItems.map((line) => ({
          name: line.name.trim(),
          price: rupeesToCents(line.amount),
          qty: Number(line.qty),
          category: line.category,
          direction: line.direction,
        })),
      })
      navigate('/analysis-result', {
        state: { count: saved.count, totalCents: saved.totalCents, docType: draft.docType },
      })
    } catch (err) {
      console.error('Save failed:', err)
      setError(ERROR_TEXT[err.message] || 'Could not save your data. Try again.')
      setBusy('')
    }
  }

  const locked = recording || busy !== ''

  return (
    <main className="main-content input-page">
      <section className="page-heading">
        <span className="eyebrow">FINANCIAL INPUT</span>
        <h1>Add your financial data</h1>
        <p>Choose one method. You can review everything before it is saved.</p>
      </section>

      <section className="method-grid">
        {methods.map(({ id, label, description, Icon }) => (
          <button
            type="button"
            key={id}
            className={method === id ? 'selected' : ''}
            onClick={() => chooseMethod(id)}
            disabled={locked}
          >
            <Icon size={23} />
            <strong>{label}</strong>
            <small>{description}</small>
          </button>
        ))}
      </section>

      <div className={`input-workspace ${method === 'manual' ? 'single' : ''}`}>
        {method === 'upload' && (
          <section className="input-method-panel">
            <FileText size={29} />
            <h2>Upload a financial document</h2>
            <p>Choose a payslip, receipt or purchase record. The AI works out which one it is and reads the amounts.</p>
            <label className={`upload-zone ${locked ? 'disabled' : ''}`}>
              {busy === 'reading' ? <LoaderCircle className="spinner" size={24} /> : <Upload size={24} />}
              <strong>{busy === 'reading' ? 'Reading your document…' : fileName || 'Choose a file'}</strong>
              <small>Images (JPG, PNG) or PDF, up to {MAX_FILE_MB} MB</small>
              <input type="file" accept="image/*,application/pdf" onChange={onFileChosen} disabled={locked} />
            </label>
          </section>
        )}

        {method === 'camera' && (
          <CameraCapture busy={busy !== ''} onPhoto={onCameraPhoto} onError={setError} />
        )}

        {method === 'voice' && (
          <section className="input-method-panel">
            <Mic size={29} />
            <h2>Describe it out loud</h2>
            <p>Say what you received or spent, for example: "I got my salary of Rs 35,000" or "I spent Rs 1,850 at the supermarket". English, French and Kreol all work.</p>
            {recording ? (
              <button type="button" className="record-button recording" onClick={stopRecording}>
                <Square size={18} /> Stop recording ({seconds}s)
              </button>
            ) : (
              <button type="button" className="record-button" onClick={startRecording} disabled={busy !== ''}>
                {busy === 'reading' ? <LoaderCircle className="spinner" size={20} /> : <Mic size={20} />}
                {busy === 'reading' ? 'Listening to your note…' : 'Start recording'}
              </button>
            )}
          </section>
        )}

        {draft ? (
          <ReviewPanel
            draft={draft}
            isManual={method === 'manual'}
            editing={editing}
            onEdit={() => setEditing(true)}
            onDraft={updateDraft}
            onDocType={changeDocType}
            onLine={updateLine}
            onAddLine={addLine}
            onRemoveLine={removeLine}
            onSave={analyseFinances}
            saving={busy === 'saving'}
            error={error}
          />
        ) : (
          <section className="review-panel placeholder">
            <Sparkles size={26} />
            <h2>AI summary</h2>
            <p>{busy === 'reading' ? 'The AI is reading your input…' : 'Your AI summary and confidence score will appear here.'}</p>
            {error && <p className="form-error">{error}</p>}
          </section>
        )}
      </div>

      {showLowConfidence && draft && (
        <LowConfidenceModal
          draft={draft}
          onUseAi={() => setShowLowConfidence(false)}
          onEdit={() => { setEditing(true); setShowLowConfidence(false) }}
        />
      )}
    </main>
  )
}

function ConfidenceBadge({ score }) {
  const percent = Math.round((score || 0) * 100)
  const low = score < LOW_CONFIDENCE
  return (
    <div className={`confidence ${low ? 'low' : 'ok'}`}>
      <span>Confidence {percent}%</span>
      <div className="confidence-bar"><i style={{ width: `${percent}%` }} /></div>
    </div>
  )
}

function ReviewPanel({
  draft, isManual, editing, onEdit, onDraft, onDocType, onLine, onAddLine, onRemoveLine,
  onSave, saving, error,
}) {
  const total = draft.lineItems.reduce((sum, line) => sum + lineTotal(line), 0)

  return (
    <section className="review-panel">
      {isManual ? (
        <>
          <WalletCards size={29} className="panel-icon" />
          <h2>Enter the details</h2>
          <p className="panel-intro">Type what is on your payslip, receipt or purchase.</p>
        </>
      ) : (
        <div className="ai-summary">
          <div className="ai-summary-top">
            <span className="modal-kicker"><Sparkles size={16} />AI summary</span>
            <span className="doc-chip">{docTypeLabel(draft.docType)}</span>
          </div>
          <p>{draft.summary}</p>
          <ConfidenceBadge score={draft.confidenceScore} />
          {draft.flags.length > 0 && (
            <ul className="ai-flags">
              {draft.flags.map((flag) => <li key={flag}><AlertTriangle size={14} />{flag}</li>)}
            </ul>
          )}
        </div>
      )}

      {editing ? (
        <div className="draft-editor">
          <div className="draft-fields">
            <label>Type
              <select value={draft.docType} onChange={(e) => (isManual ? onDocType(e.target.value) : onDraft('docType', e.target.value))}>
                {DOC_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </label>
            <label>{draft.docType === 'payslip' ? 'Employer' : 'Shop or vendor'}
              <input value={draft.vendor} onChange={(e) => onDraft('vendor', e.target.value)} placeholder="Optional" />
            </label>
            <label>Date
              <input type="date" value={draft.txnDate} onChange={(e) => onDraft('txnDate', e.target.value)} />
            </label>
          </div>

          {draft.lineItems.map((line, index) => (
            <fieldset className="line-editor" key={index}>
              <label className="wide">Item
                <input value={line.name} onChange={(e) => onLine(index, 'name', e.target.value)} placeholder="e.g. Groceries" />
              </label>
              <label>Amount (Rs)
                <input type="number" min="0" step="0.01" inputMode="decimal" value={line.amount} onChange={(e) => onLine(index, 'amount', e.target.value)} />
              </label>
              <label>Qty
                <input type="number" min="0" step="any" inputMode="decimal" value={line.qty} onChange={(e) => onLine(index, 'qty', e.target.value)} />
              </label>
              <label>Category
                <select value={line.category} onChange={(e) => onLine(index, 'category', e.target.value)}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{capitalise(category)}</option>)}
                </select>
              </label>
              <label>Money
                <select value={line.direction} onChange={(e) => onLine(index, 'direction', e.target.value)}>
                  <option value="expense">Spent</option>
                  <option value="income">Received</option>
                </select>
              </label>
              <button type="button" className="icon-button" onClick={() => onRemoveLine(index)} aria-label={`Remove ${line.name || 'line'}`} disabled={draft.lineItems.length === 1}>
                <Trash2 size={17} />
              </button>
            </fieldset>
          ))}
          <button type="button" className="add-line" onClick={onAddLine}><Plus size={16} /> Add line</button>
        </div>
      ) : (
        <div className="draft-view">
          <dl>
            <div><dt>Type</dt><dd>{docTypeLabel(draft.docType)}</dd></div>
            <div><dt>{draft.docType === 'payslip' ? 'Employer' : 'Vendor'}</dt><dd>{draft.vendor || '—'}</dd></div>
            <div><dt>Date</dt><dd>{draft.txnDate}</dd></div>
          </dl>
          <ul className="line-list">
            {draft.lineItems.map((line, index) => (
              <li key={index}>
                <div><strong>{line.name || 'Item'}</strong><small>{capitalise(line.category)}{Number(line.qty) !== 1 ? ` · ${line.qty} × ${money(line.amount)}` : ''}</small></div>
                <b className={line.direction}>{line.direction === 'income' ? '+' : '−'}{money(lineTotal(line))}</b>
              </li>
            ))}
          </ul>
          <button type="button" className="secondary-button edit-draft" onClick={onEdit}><Pencil size={16} /> Edit details</button>
        </div>
      )}

      <p className="draft-total">Total <strong>{money(total)}</strong></p>
      {draft.docType === 'payslip' && <p className="panel-note">Saving a payslip also updates your monthly salary.</p>}
      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" type="button" onClick={onSave} disabled={saving}>
        {saving ? <LoaderCircle className="spinner" size={19} /> : null}
        {saving ? 'Saving…' : 'Analyse my finances'}
      </button>
    </section>
  )
}

function LowConfidenceModal({ draft, onUseAi, onEdit }) {
  return (
    <div className="modal-backdrop">
      <section className="risk-modal low-confidence-modal" role="dialog" aria-modal="true" aria-labelledby="low-confidence-title">
        <div className="modal-kicker warning"><AlertTriangle size={17} />Low confidence</div>
        <h2 id="low-confidence-title">Check this before saving</h2>
        <p>The AI is only {Math.round(draft.confidenceScore * 100)}% sure about what it read. You can use its data as it is, or edit it yourself first.</p>
        <div className="explanation-box">
          <h3>What the AI understood</h3>
          <p>{draft.summary}</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onUseAi}>Use AI data</button>
          <button type="button" className="primary-button" onClick={onEdit}><Pencil size={17} />Edit it myself</button>
        </div>
      </section>
    </div>
  )
}
