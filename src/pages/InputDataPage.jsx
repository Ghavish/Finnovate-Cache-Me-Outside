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
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { categoryLabel, DOC_TYPE_LABELS } from '../i18n/labels.js'
import { k } from '../i18n/strings.js'
import { centsToRupees, money, rupeesToCents } from '../utils/money.js'

// --- Config ---
const LOW_CONFIDENCE = 0.7 // same threshold as the n8n Guardrail
const MAX_FILE_MB = 10
const MAX_RECORDING_SECONDS = 120

const methods = [
  { id: 'upload', label: k('Upload document'), description: k('Payslip, receipt or purchase'), Icon: Upload },
  { id: 'camera', label: k('Scan with camera'), description: k('Use your phone camera'), Icon: Camera },
  { id: 'voice', label: k('Voice input'), description: k('Describe it out loud'), Icon: Mic },
  { id: 'manual', label: k('Manual entry'), description: k('Type the details'), Icon: Keyboard },
]

const DOC_TYPES = [
  { id: 'payslip', label: DOC_TYPE_LABELS.payslip },
  { id: 'receipt', label: DOC_TYPE_LABELS.receipt },
  { id: 'purchase', label: DOC_TYPE_LABELS.purchase },
]

// Same list as the n8n Guardrail and Confirm Check nodes.
const CATEGORIES = [
  'groceries', 'dining', 'transport', 'fuel', 'utilities', 'rent', 'telecom',
  'health', 'education', 'clothing', 'household', 'entertainment',
  'subscriptions', 'gifts', 'festival', 'salary', 'other',
]

const ERROR_TEXT = {
  EXTRACTION_FAILED: k('The AI could not read this. Try a clearer file, or use Manual entry.'),
  UNAUTHORIZED: k('Your session has expired. Log in again.'),
}

// --- Helpers ---
const todayLocal = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
const docTypeLabel = (id) => DOC_TYPES.find((type) => type.id === id)?.label || k('Document')

function blankLine(docType, t) {
  return docType === 'payslip'
    ? { name: t('Net salary'), amount: '', qty: 1, category: 'salary', direction: 'income' }
    : { name: '', amount: '', qty: 1, category: 'other', direction: 'expense' }
}

function manualDraft(t) {
  return {
    docType: 'receipt', summary: '', confidenceScore: null, lowConfidence: false, flags: [],
    vendor: '', txnDate: todayLocal(), lineItems: [blankLine('receipt', t)], source: 'manual',
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

function validate(draft, t) {
  if (!draft.lineItems.length) return t('Add at least one line.')
  for (const line of draft.lineItems) {
    if (!line.name.trim()) return t('Every line needs a name.')
    if (!(Number(line.amount) > 0)) return t('Enter an amount above 0 for "{name}".', { name: line.name })
    if (!(Number(line.qty) > 0)) return t('Enter a quantity above 0 for "{name}".', { name: line.name })
  }
  if (draft.docType === 'payslip' && !draft.lineItems.some((line) => line.direction === 'income')) {
    return t('A payslip needs an income line with your net salary.')
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
  const { t, language } = useLanguage()

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
    setDraft(nextMethod === 'manual' ? manualDraft(t) : null)
    setEditing(nextMethod === 'manual')
  }

  // --- AI preview (nothing is saved yet) ---
  async function requestPreview(payload) {
    setBusy('reading')
    setError('')
    setDraft(null)
    try {
      const preview = draftFromPreview(await callN8n({ ...payload, language }))
      setDraft(preview)
      setEditing(false)
      setShowLowConfidence(preview.lowConfidence)
    } catch (err) {
      console.error('AI preview failed:', err)
      setError(ERROR_TEXT[err.message] || k('Something went wrong while reading this. Try again.'))
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
      setError(k('Only images (JPG, PNG and similar) and PDF files can be read.'))
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(t('That file is too large. The limit is {size} MB.', { size: MAX_FILE_MB }))
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
      setError(k('This browser cannot record audio. Try Chrome, Edge or Firefox.'))
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError(k('Microphone access was blocked. Allow it in your browser and try again.'))
      return
    }

    const recorder = new MediaRecorder(stream)
    const chunks = []
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop())
      const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
      if (!audio.size) {
        setError(k('Nothing was recorded. Try again.'))
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
    ...current, lineItems: [...current.lineItems, blankLine(current.docType, t)],
  }))
  const removeLine = (index) => setDraft((current) => ({
    ...current, lineItems: current.lineItems.filter((_, i) => i !== index),
  }))

  // Manual entry: switching to Payslip swaps an untouched blank line for "Net salary".
  function changeDocType(docType) {
    setDraft((current) => {
      const untouched = current.lineItems.length === 1 && !current.lineItems[0].amount
      return { ...current, docType, lineItems: untouched ? [blankLine(docType, t)] : current.lineItems }
    })
  }

  // --- Save: the only step that writes to MongoDB ---
  async function analyseFinances() {
    const problem = validate(draft, t)
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
      setError(ERROR_TEXT[err.message] || k('Could not save your data. Try again.'))
      setBusy('')
    }
  }

  const locked = recording || busy !== ''

  return (
    <main className="main-content input-page">
      <section className="page-heading">
        <span className="eyebrow">{t('FINANCIAL INPUT')}</span>
        <h1>{t('Add your financial data')}</h1>
        <p>{t('Choose one method. You can review everything before it is saved.')}</p>
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
            <strong>{t(label)}</strong>
            <small>{t(description)}</small>
          </button>
        ))}
      </section>

      <div className={`input-workspace ${method === 'manual' ? 'single' : ''}`}>
        {method === 'upload' && (
          <section className="input-method-panel">
            <FileText size={29} />
            <h2>{t('Upload a financial document')}</h2>
            <p>{t('Choose a payslip, receipt or purchase record. The AI works out which one it is and reads the amounts.')}</p>
            <label className={`upload-zone ${locked ? 'disabled' : ''}`}>
              {busy === 'reading' ? <LoaderCircle className="spinner" size={24} /> : <Upload size={24} />}
              <strong>{busy === 'reading' ? t('Reading your document…') : fileName || t('Choose a file')}</strong>
              <small>{t('Images (JPG, PNG) or PDF, up to {size} MB', { size: MAX_FILE_MB })}</small>
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
            <h2>{t('Describe it out loud')}</h2>
            <p>{t('Say what you received or spent, for example: "I got my salary of Rs 35,000" or "I spent Rs 1,850 at the supermarket". English, French and Kreol all work.')}</p>
            {recording ? (
              <button type="button" className="record-button recording" onClick={stopRecording}>
                <Square size={18} /> {t('Stop recording ({seconds}s)', { seconds })}
              </button>
            ) : (
              <button type="button" className="record-button" onClick={startRecording} disabled={busy !== ''}>
                {busy === 'reading' ? <LoaderCircle className="spinner" size={20} /> : <Mic size={20} />}
                {busy === 'reading' ? t('Listening to your note…') : t('Start recording')}
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
            <h2>{t('AI summary')}</h2>
            <p>{busy === 'reading' ? t('The AI is reading your input…') : t('Your AI summary and confidence score will appear here.')}</p>
            {error && <p className="form-error">{t(error)}</p>}
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
  const { t } = useLanguage()
  const percent = Math.round((score || 0) * 100)
  const low = score < LOW_CONFIDENCE
  return (
    <div className={`confidence ${low ? 'low' : 'ok'}`}>
      <span>{t('Confidence {percent}%', { percent })}</span>
      <div className="confidence-bar"><i style={{ width: `${percent}%` }} /></div>
    </div>
  )
}

function ReviewPanel({
  draft, isManual, editing, onEdit, onDraft, onDocType, onLine, onAddLine, onRemoveLine,
  onSave, saving, error,
}) {
  const { t } = useLanguage()
  const total = draft.lineItems.reduce((sum, line) => sum + lineTotal(line), 0)

  return (
    <section className="review-panel">
      {isManual ? (
        <>
          <WalletCards size={29} className="panel-icon" />
          <h2>{t('Enter the details')}</h2>
          <p className="panel-intro">{t('Type what is on your payslip, receipt or purchase.')}</p>
        </>
      ) : (
        <div className="ai-summary">
          <div className="ai-summary-top">
            <span className="modal-kicker"><Sparkles size={16} />{t('AI summary')}</span>
            <span className="doc-chip">{t(docTypeLabel(draft.docType))}</span>
          </div>
          <p>{t(draft.summary)}</p>
          <ConfidenceBadge score={draft.confidenceScore} />
          {draft.flags.length > 0 && (
            <ul className="ai-flags">
              {draft.flags.map((flag) => <li key={flag}><AlertTriangle size={14} />{t(flag)}</li>)}
            </ul>
          )}
        </div>
      )}

      {editing ? (
        <div className="draft-editor">
          <div className="draft-fields">
            <label>{t('Type')}
              <select value={draft.docType} onChange={(e) => (isManual ? onDocType(e.target.value) : onDraft('docType', e.target.value))}>
                {DOC_TYPES.map((type) => <option key={type.id} value={type.id}>{t(type.label)}</option>)}
              </select>
            </label>
            <label>{draft.docType === 'payslip' ? t('Employer') : t('Shop or vendor')}
              <input value={draft.vendor} onChange={(e) => onDraft('vendor', e.target.value)} placeholder={t('Optional')} />
            </label>
            <label>{t('Date')}
              <input type="date" value={draft.txnDate} onChange={(e) => onDraft('txnDate', e.target.value)} />
            </label>
          </div>

          {draft.lineItems.map((line, index) => (
            <fieldset className="line-editor" key={index}>
              <label className="wide">{t('Item')}
                <input value={line.name} onChange={(e) => onLine(index, 'name', e.target.value)} placeholder={t('e.g. Groceries')} />
              </label>
              <label>{t('Amount (Rs)')}
                <input type="number" min="0" step="0.01" inputMode="decimal" value={line.amount} onChange={(e) => onLine(index, 'amount', e.target.value)} />
              </label>
              <label>{t('Qty')}
                <input type="number" min="0" step="any" inputMode="decimal" value={line.qty} onChange={(e) => onLine(index, 'qty', e.target.value)} />
              </label>
              <label>{t('Category')}
                <select value={line.category} onChange={(e) => onLine(index, 'category', e.target.value)}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{t(categoryLabel(category))}</option>)}
                </select>
              </label>
              <label>{t('Money')}
                <select value={line.direction} onChange={(e) => onLine(index, 'direction', e.target.value)}>
                  <option value="expense">{t('Spent')}</option>
                  <option value="income">{t('Received')}</option>
                </select>
              </label>
              <button type="button" className="icon-button" onClick={() => onRemoveLine(index)} aria-label={t('Remove {name}', { name: line.name || t('line') })} disabled={draft.lineItems.length === 1}>
                <Trash2 size={17} />
              </button>
            </fieldset>
          ))}
          <button type="button" className="add-line" onClick={onAddLine}><Plus size={16} /> {t('Add line')}</button>
        </div>
      ) : (
        <div className="draft-view">
          <dl>
            <div><dt>{t('Type')}</dt><dd>{t(docTypeLabel(draft.docType))}</dd></div>
            <div><dt>{draft.docType === 'payslip' ? t('Employer') : t('Vendor')}</dt><dd>{draft.vendor || '—'}</dd></div>
            <div><dt>{t('Date')}</dt><dd>{draft.txnDate}</dd></div>
          </dl>
          <ul className="line-list">
            {draft.lineItems.map((line, index) => (
              <li key={index}>
                <div><strong>{line.name || t('Item')}</strong><small>{t(categoryLabel(line.category))}{Number(line.qty) !== 1 ? ` · ${line.qty} × ${money(line.amount)}` : ''}</small></div>
                <b className={line.direction}>{line.direction === 'income' ? '+' : '−'}{money(lineTotal(line))}</b>
              </li>
            ))}
          </ul>
          <button type="button" className="secondary-button edit-draft" onClick={onEdit}><Pencil size={16} /> {t('Edit details')}</button>
        </div>
      )}

      <p className="draft-total">{t('Total')} <strong>{money(total)}</strong></p>
      {draft.docType === 'payslip' && <p className="panel-note">{t('Saving a payslip also updates your monthly salary.')}</p>}
      {error && <p className="form-error">{t(error)}</p>}

      <button className="primary-button" type="button" onClick={onSave} disabled={saving}>
        {saving ? <LoaderCircle className="spinner" size={19} /> : null}
        {saving ? t('Saving…') : t('Analyse my finances')}
      </button>
    </section>
  )
}

function LowConfidenceModal({ draft, onUseAi, onEdit }) {
  const { t } = useLanguage()
  return (
    <div className="modal-backdrop">
      <section className="risk-modal low-confidence-modal" role="dialog" aria-modal="true" aria-labelledby="low-confidence-title">
        <div className="modal-kicker warning"><AlertTriangle size={17} />{t('Low confidence')}</div>
        <h2 id="low-confidence-title">{t('Check this before saving')}</h2>
        <p>{t('The AI is only {percent}% sure about what it read. You can use its data as it is, or edit it yourself first.', { percent: Math.round(draft.confidenceScore * 100) })}</p>
        <div className="explanation-box">
          <h3>{t('What the AI understood')}</h3>
          <p>{t(draft.summary)}</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onUseAi}>{t('Use AI data')}</button>
          <button type="button" className="primary-button" onClick={onEdit}><Pencil size={17} />{t('Edit it myself')}</button>
        </div>
      </section>
    </div>
  )
}
