import { ArrowRight, CheckCircle2, CircleDollarSign, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../state/AppDataContext.jsx'

const money = (value) => `Rs ${Math.round(value || 0).toLocaleString('en-MU')}`

export default function AnalysisResultPage() {
  const { data } = useAppData()
  return <main className="main-content result-page">
    <section className="page-heading"><span className="eyebrow">ANALYSIS COMPLETE</span><h1>Your financial picture is ready</h1><p>The reviewed values are now available throughout GoalPath.</p></section>
    <section className="result-banner"><CheckCircle2 size={28} /><div><strong>Data added successfully</strong><p>Source: {data.sourceLabel}</p></div></section>
    <section className="result-grid"><article><CircleDollarSign /><small>Monthly salary</small><strong>{money(data.salary)}</strong></article><article><CircleDollarSign /><small>Monthly expenses</small><strong>{money(data.expenses)}</strong></article><article className="highlight"><ShieldCheck /><small>Safe saving capacity</small><strong>{money(data.safeSavingCapacity)}</strong></article></section>
    <section className="result-explanation"><h2>What this means</h2><p>GoalPath protects a demo monthly buffer of Rs 5,900, then uses the remaining amount as your safe goal-saving capacity. This value is now used when you analyse a new goal.</p></section>
    <div className="result-actions"><Link className="secondary-link" to="/financial-overview">Review financial overview</Link><Link className="primary-link" to="/goals/new">Continue to goals <ArrowRight size={18} /></Link></div>
  </main>
}
