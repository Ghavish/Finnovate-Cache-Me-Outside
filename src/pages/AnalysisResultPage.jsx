import { ArrowRight, CheckCircle2, CircleDollarSign, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { readN8n } from '../firebase/apiClient.js'
import { moneyFromCents } from '../utils/money.js'

export default function AnalysisResultPage() {
  const saved = useLocation().state
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    readN8n({ inputType: 'getDashboard' })
      .then(setDashboard)
      .catch((err) => {
        console.error('Dashboard load failed:', err)
        setError('Your data was saved, but the latest figures could not be loaded.')
      })
  }, [])

  const value = (render) => (dashboard ? render(dashboard) : error ? '—' : '…')
  const savedText = saved?.count
    ? `${saved.count} ${saved.count === 1 ? 'entry' : 'entries'} saved, ${moneyFromCents(saved.totalCents)} in total.`
    : 'Your entries were saved.'

  return <main className="main-content result-page">
    <section className="page-heading"><span className="eyebrow">ANALYSIS COMPLETE</span><h1>Your financial picture is updated</h1><p>These figures come straight from your saved data.</p></section>
    <section className="result-banner"><CheckCircle2 size={28} /><div><strong>Data added successfully</strong><p>{savedText}{saved?.docType === 'payslip' ? ' Your monthly salary was updated from the payslip.' : ''}</p></div></section>
    {error && <p className="form-error">{error}</p>}
    <section className="result-grid"><article><CircleDollarSign /><small>Monthly salary</small><strong>{value((d) => moneyFromCents(d.salaryCents))}</strong></article><article><CircleDollarSign /><small>Usual monthly spending</small><strong>{value((d) => moneyFromCents(d.monthlyRoutineCents))}</strong></article><article className="highlight"><ShieldCheck /><small>Safe saving capacity</small><strong>{value((d) => moneyFromCents(d.safeSavingCapacityCents))}</strong></article></section>
    <section className="result-explanation"><h2>What this means</h2><p>Safe saving capacity is your monthly salary minus your usual monthly spending. Usual spending only counts repeat expenses: a new expense counts once its category already appears in at least two earlier months, so this figure fills in as you add more history. This value is used when you analyse a new goal.</p></section>
    <div className="result-actions"><Link className="secondary-link" to="/input-data">Add more data</Link><Link className="primary-link" to="/goals/new">Continue to goals <ArrowRight size={18} /></Link></div>
  </main>
}
