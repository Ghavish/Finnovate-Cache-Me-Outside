import {
  FileText,
  Keyboard,
  Mic,
  Upload,
  WalletCards,
} from 'lucide-react'

import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../state/AppDataContext.jsx'

const methods = [
  {
    id: 'upload',
    label: 'Upload document',
    description: 'Payslip or statement',
    Icon: Upload,
  },
  {
    id: 'voice',
    label: 'Voice input',
    description: 'Describe your finances',
    Icon: Mic,
  },
  {
    id: 'manual',
    label: 'Manual entry',
    description: 'Type the amounts',
    Icon: Keyboard,
  },
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

  // Changes the selected financial input method.
  function chooseMethod(nextMethod) {
    setMethod(nextMethod)
    setError('')

    // Clear the sample values when Manual entry is selected.
    if (nextMethod === 'manual') {
      setSalary('')
      setExpenses('')

      // Automatically put the cursor inside the salary field.
      window.setTimeout(() => {
        salaryInputRef.current?.focus()
      }, 0)
    }
  }

  // Validates and saves the entered financial values.
  function finish(event) {
    event.preventDefault()

    const incomeValue = Number(salary)
    const expenseValue = Number(expenses)

    if (
      !Number.isFinite(incomeValue) ||
      incomeValue <= 0 ||
      !Number.isFinite(expenseValue) ||
      expenseValue < 0
    ) {
      setError('Enter a valid monthly salary and expense amount.')
      return
    }

    let sourceLabel = 'Manual entry'

    if (method === 'upload') {
      sourceLabel = fileName || 'Demo_Payslip.pdf'
    }

    if (method === 'voice') {
      sourceLabel = 'Voice entry'
    }

    // Save the data in the shared application state.
    saveFinancialProfile({
      salary: incomeValue,
      expenses: expenseValue,
      sourceLabel,
    })

    // Open the analysis result page.
    navigate('/analysis-result')
  }

  // Simulates speech recognition for the standalone version.
  function simulateVoice() {
    setRecording(true)

    window.setTimeout(() => {
      setRecording(false)

      setVoiceText(
        'Monthly salary Rs 35,000. Monthly expenses Rs 24,300.',
      )

      setSalary(35000)
      setExpenses(24300)
    }, 900)
  }

  return (
    <main className="main-content input-page">
      {/* Page heading */}
      <section className="page-heading">
        <span className="eyebrow">FINANCIAL INPUT</span>

        <h1>Add your financial data</h1>

        <p>
          Choose one method. You can review the values before they are
          saved.
        </p>
      </section>

      {/* Progress indicator */}
      <div className="flow-progress">
        <span className="done">1</span>
        <i />

        <span className="active">2</span>
        <i />

        <span>3</span>
        <i />

        <span>4</span>
      </div>

      {/* Financial input method cards */}
      <section className="method-grid">
        {methods.map(({ id, label, description, Icon }) => (
          <button
            type="button"
            key={id}
            className={method === id ? 'selected' : ''}
            onClick={() => chooseMethod(id)}
          >
            <Icon size={23} />

            <strong>{label}</strong>

            <small>{description}</small>
          </button>
        ))}
      </section>

      <form className="input-workspace" onSubmit={finish}>
        {/* Upload document method */}
        {method === 'upload' && (
          <>
            <section className="input-method-panel">
              <FileText size={29} />

              <h2>Upload a financial document</h2>

              <p>
                Select a payslip, bank statement or another financial
                document.
              </p>

              <label className="upload-zone">
                <Upload size={24} />

                <strong>{fileName || 'Choose a file'}</strong>

                <small>PDF, JPG or PNG</small>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => {
                    setFileName(
                      event.target.files?.[0]?.name || '',
                    )
                  }}
                />
              </label>
            </section>

            <ReviewValues
              salary={salary}
              expenses={expenses}
              setSalary={setSalary}
              setExpenses={setExpenses}
              salaryInputRef={salaryInputRef}
              error={error}
              setError={setError}
            />
          </>
        )}

        {/* Voice input method */}
        {method === 'voice' && (
          <>
            <section className="input-method-panel">
              <Mic size={29} />

              <h2>Describe your finances</h2>

              <p>
                Use the microphone button to simulate voice entry in this
                standalone version.
              </p>

              <button
                type="button"
                className={`record-button ${
                  recording ? 'recording' : ''
                }`}
                onClick={simulateVoice}
                disabled={recording}
              >
                <Mic />

                {recording ? 'Listening…' : 'Start recording'}
              </button>

              {voiceText && (
                <div className="transcript">
                  <strong>Transcript</strong>

                  <p>{voiceText}</p>
                </div>
              )}
            </section>

            <ReviewValues
              salary={salary}
              expenses={expenses}
              setSalary={setSalary}
              setExpenses={setExpenses}
              salaryInputRef={salaryInputRef}
              error={error}
              setError={setError}
            />
          </>
        )}

        {/* Manual entry method */}
        {method === 'manual' && (
          <section className="input-method-panel manual-entry-panel">
            <WalletCards size={29} />

            <h2>Enter the values manually</h2>

            <p>
              Enter your monthly salary and monthly expenses below.
            </p>

            <div className="manual-entry-fields">
              <label>
                Monthly salary

                <span className="money-input">
                  <b>Rs</b>

                  <input
                    ref={salaryInputRef}
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 35000"
                    value={salary}
                    onChange={(event) => {
                      setSalary(event.target.value)
                      setError('')
                    }}
                  />
                </span>
              </label>

              <label>
                Monthly expenses

                <span className="money-input">
                  <b>Rs</b>

                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 24300"
                    value={expenses}
                    onChange={(event) => {
                      setExpenses(event.target.value)
                      setError('')
                    }}
                  />
                </span>
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button className="primary-button" type="submit">
              Analyse my finances
            </button>
          </section>
        )}
      </form>
    </main>
  )
}

// Reusable review section for Upload and Voice input.
function ReviewValues({
  salary,
  expenses,
  setSalary,
  setExpenses,
  salaryInputRef,
  error,
  setError,
}) {
  return (
    <section className="review-values">
      <h2>Review values</h2>

      <div>
        <label>
          Monthly salary

          <span className="money-input">
            <b>Rs</b>

            <input
              ref={salaryInputRef}
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              required
              placeholder="e.g. 35000"
              value={salary}
              onChange={(event) => {
                setSalary(event.target.value)
                setError('')
              }}
            />
          </span>
        </label>

        <label>
          Monthly expenses

          <span className="money-input">
            <b>Rs</b>

            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              required
              placeholder="e.g. 24300"
              value={expenses}
              onChange={(event) => {
                setExpenses(event.target.value)
                setError('')
              }}
            />
          </span>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" type="submit">
        Analyse my finances
      </button>
    </section>
  )
}