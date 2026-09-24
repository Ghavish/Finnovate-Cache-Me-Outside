import { FileText, Keyboard, Mic, Upload, WalletCards } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../state/AppDataContext.jsx'

const methods = [
  { id: 'upload', label: 'Upload document', description: 'Payslip or statement', Icon: Upload },
  { id: 'voice', label: 'Voice input', description: 'Describe your finances', Icon: Mic },
  { id: 'manual', label: 'Manual entry', description: 'Type the amounts', Icon: Keyboard },
]

export default function InputDataPage() {
  const { data, saveFinancialProfile } = useAppData()
  const navigate = useNavigate()
  const [method, setMethod] = useState('upload')
  const [salary, setSalary] = useState(data.salary)
  const [expenses, setExpenses] = useState(data.expenses)
  const [fileName, setFileName] = useState('')
  const [recording, setRecording] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [error, setError] = useState('')
  const salaryInputRef = useRef(null)

  function chooseMethod(nextMethod) {
    setMethod(nextMethod)
    setError('')

    // Manual entry starts with empty fields so the user can type their own values.
    if (nextMethod === 'manual') {
      setSalary('')
      setExpenses('')
      window.setTimeout(() => salaryInputRef.current?.focus(), 0)
    }
  }

  function finish(event) {
    event.preventDefault()
    const incomeValue = Number(salary); const expenseValue = Number(expenses)
    if (!Number.isFinite(incomeValue) || incomeValue <= 0 || !Number.isFinite(expenseValue) || expenseValue < 0) {
      setError('Enter a valid monthly salary and expense amount.'); return
    }
    const sourceLabel = method === 'upload' ? (fileName || 'Demo_Payslip.pdf') : method === 'voice' ? 'Voice entry' : 'Manual entry'
    saveFinancialProfile({ salary: incomeValue, expenses: expenseValue, sourceLabel })
    navigate('/analysis-result')
  }

  function simulateVoice() {
    setRecording((current) => !current)
    if (!recording) setTimeout(() => { setRecording(false); setVoiceText('Monthly salary Rs 35,000. Monthly expenses Rs 24,300.'); setSalary(35000); setExpenses(24300) }, 900)
  }

  return <main className="main-content input-page">
    <section className="page-heading"><span className="eyebrow">FINANCIAL INPUT</span><h1>Add your financial data</h1><p>Choose one method. You can review extracted values before they are saved.</p></section>
    <div className="flow-progress"><span className="done">1</span><i /><span className="active">2</span><i /><span>3</span><i /><span>4</span></div>
    <section className="method-grid">{methods.map(({ id,label,description,Icon }) => <button type="button" key={id} className={method === id ? 'selected' : ''} onClick={() => chooseMethod(id)}><Icon size={23} /><strong>{label}</strong><small>{description}</small></button>)}</section>
    <form className="input-workspace" onSubmit={finish}>
      {method === 'upload' && <section className="input-method-panel"><FileText size={29} /><h2>Upload a financial document</h2><p>Select a PDF or image. This demo displays the existing sample values; backend extraction can replace it later.</p><label className="upload-zone"><Upload size={24} /><strong>{fileName || 'Choose a file'}</strong><small>PDF, JPG or PNG</small><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} /></label></section>}
      {method === 'voice' && <section className="input-method-panel"><Mic size={29} /><h2>Describe your finances</h2><p>Use the microphone button to simulate a voice entry in this standalone version.</p><button type="button" className={`record-button ${recording ? 'recording' : ''}`} onClick={simulateVoice}><Mic />{recording ? 'Listening…' : 'Start recording'}</button>{voiceText && <div className="transcript"><strong>Transcript</strong><p>{voiceText}</p></div>}</section>}
      {method === 'manual' && <section className="input-method-panel"><WalletCards size={29} /><h2>Enter the values manually</h2><p>Click the editable fields under “Enter your values” and type your own monthly salary and expenses.</p></section>}
      <section className="review-values"><h2>{method === 'manual' ? 'Enter your values' : 'Review values'}</h2><div><label>Monthly salary<span className="money-input"><b>Rs</b><input ref={salaryInputRef} type="number" inputMode="decimal" min="1" step="1" required placeholder="e.g. 35000" value={salary} onChange={(e) => setSalary(e.target.value)} /></span></label><label>Monthly expenses<span className="money-input"><b>Rs</b><input type="number" inputMode="decimal" min="0" step="1" required placeholder="e.g. 24300" value={expenses} onChange={(e) => setExpenses(e.target.value)} /></span></label></div>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit">Analyse my finances</button></section>
    </form>
  </main>
}
