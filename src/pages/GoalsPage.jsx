import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Link2, LoaderCircle, Plus, ShieldAlert, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../state/AppDataContext.jsx'

const money = (value) => `Rs ${Math.round(value || 0).toLocaleString('en-MU')}`
const defaultDate = () => { const d = new Date(); d.setMonth(d.getMonth() + 8); return d.toISOString().split('T')[0] }
const emptyForm = () => ({ name: '', category: 'Education', targetAmount: '', targetDate: defaultDate(), currentSavings: '', link: '', description: '' })

function analyse(form, capacity) {
  const today = new Date(); const target = new Date(`${form.targetDate}T23:59:59`)
  const months = Math.max(1, (target.getFullYear() - today.getFullYear()) * 12 + target.getMonth() - today.getMonth())
  const remaining = Math.max(Number(form.targetAmount) - Number(form.currentSavings || 0), 0)
  const monthlyRequired = Math.ceil(remaining / months)
  const verdict = monthlyRequired <= capacity * .8 ? 'SAFE' : monthlyRequired <= capacity ? 'TIGHT' : 'NOT_SAFE'
  return { ...form, targetAmount: Number(form.targetAmount), currentSavings: Number(form.currentSavings || 0), monthlyRequired, monthlyCapacity: capacity, monthsNeeded: capacity ? Math.ceil(remaining / capacity) : null, progress: Math.min(100, Math.round(Number(form.currentSavings || 0) / Number(form.targetAmount) * 100)), verdict }
}

function GoalCard({ goal }) {
  return <article className="goal-card"><div className="goal-card-top"><div><small>{goal.category}</small><h3>{goal.name}</h3></div><span className={`status-badge ${goal.verdict.toLowerCase().replace('_','-')}`}>{goal.verdict.replace('_',' ')}</span></div><strong className="goal-amount">{money(goal.targetAmount)}</strong><div className="goal-progress-label"><span>{money(goal.currentSavings)} saved</span><b>{goal.progress}%</b></div><div className="goal-progress"><span style={{ width: `${goal.progress}%` }} /></div><p className="goal-timeline"><CalendarClock size={17} />About {goal.monthsNeeded ?? '—'} months at current capacity</p></article>
}

function RiskModal({ result, onClose, onAdd }) {
  if (!result) return null
  const Icon = result.verdict === 'SAFE' ? CheckCircle2 : result.verdict === 'TIGHT' ? AlertTriangle : ShieldAlert
  return <div className="modal-backdrop"><section className="risk-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose}><X size={20} /></button><div className="modal-kicker"><Sparkles size={17} />AI-assisted goal review</div><h2>Your risk profile</h2><p>Review this analysis before deciding whether to add the goal.</p><div className={`verdict-banner ${result.verdict.toLowerCase().replace('_','-')}`}><Icon size={25} /><div><small>VERDICT</small><strong>{result.verdict === 'SAFE' ? 'Safe to pursue' : result.verdict === 'TIGHT' ? 'Possible, but tight' : 'Not safe today'}</strong></div></div><div className="metric-grid"><article><small>Goal amount</small><strong>{money(result.targetAmount)}</strong></article><article><small>Monthly amount needed</small><strong>{money(result.monthlyRequired)}</strong></article><article><small>Safe saving capacity</small><strong>{money(result.monthlyCapacity)}</strong></article></div><div className="explanation-box"><h3>Why GoalPath gave this result</h3><p>The monthly amount required is compared with the safe saving capacity from your Financial Overview.</p></div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Decline</button><button className="primary-button" onClick={onAdd}>Add goal</button></div></section></div>
}

export default function GoalsPage({ startCreating = false }) {
  const { data, addGoal } = useAppData(); const navigate = useNavigate()
  const [creating, setCreating] = useState(startCreating); const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(''); const [analysing, setAnalysing] = useState(false); const [result, setResult] = useState(null)
  const progress = useMemo(() => form.targetAmount ? Math.min(100, Math.round(Number(form.currentSavings || 0) / Number(form.targetAmount) * 100)) : 0, [form])
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  function extract() {
    const text = form.description.trim(); if (!text) return setError('Describe the goal first.')
    const amount = text.replaceAll(',', '').match(/(?:rs\s*)?(\d{3,})/i)?.[1] || ''
    setForm((f) => ({ ...f, name: f.name || text.split(/\bfor\b|\bby\b/i)[0].slice(0, 50), targetAmount: f.targetAmount || amount }))
    setError('')
  }
  function submit(e) {
    e.preventDefault(); setError('')
    if (!form.name.trim() || Number(form.targetAmount) <= 0 || !form.targetDate) return setError('Enter a goal name, valid amount and target date.')
    setAnalysing(true); setTimeout(() => { setResult(analyse(form, data.safeSavingCapacity)); setAnalysing(false) }, 650)
  }
  function confirm() {
    addGoal({ ...result, id: `goal-${Date.now()}` }); setResult(null); setForm(emptyForm()); setCreating(false); navigate('/goals')
  }

  return <main className="main-content goals-page"><section className="page-title-row"><div><span className="eyebrow">MY GOALS</span><h1>{creating ? 'Create a new goal' : 'Your financial goals'}</h1><p>{creating ? 'Tell GoalPath what you want to achieve and review the risk profile before adding it.' : 'Track your saved goals and see how they fit your financial capacity.'}</p></div><button className="new-goal-button" onClick={() => setCreating(true)}><Plus size={18} />New goal</button></section>
  {!creating ? <><div className="saved-heading"><div><span className="eyebrow">YOUR PLAN</span><h2>Saved goals</h2></div><span>{data.goals.length} active</span></div><section className="saved-goals">{data.goals.map((g) => <GoalCard goal={g} key={g.id} />)}</section></> :
  <form className="goal-form" onSubmit={submit}><section className="form-card"><div className="section-heading">
  <h2>Goal details</h2>
</div>

<div className="progress-track">
  <span style={{ width: '100%' }} />
</div>

<div className="field-grid"><label><span>Goal name</span><input name="name" value={form.name} onChange={update} placeholder="e.g. University laptop" /></label><label><span>Category</span><select name="category" value={form.category} onChange={update}><option>Education</option><option>Emergency</option><option>Travel</option><option>Vehicle</option><option>Home</option><option>Other</option></select></label><label><span>Goal amount</span><div className="money-input"><b>Rs</b><input name="targetAmount" type="number" min="1" value={form.targetAmount} onChange={update} placeholder="80,000" /></div></label><label><span>Target date</span><input name="targetDate" type="date" value={form.targetDate} onChange={update} /></label><label className="full-width"><span>Current savings</span><div className="money-input"><b>Rs</b><input name="currentSavings" type="number" min="0" value={form.currentSavings} onChange={update} placeholder="20,000" /></div><div className="savings-preview"><span style={{ width:`${progress}%` }} /></div></label><label className="full-width"><span>Reference link (optional)</span><div className="icon-input"><Link2 size={17} /><input name="link" value={form.link} onChange={update} placeholder="https://shop.example/product" /></div></label></div></section><aside className="natural-card"><Sparkles size={22} /><h2>Describe it your way</h2><p>Type naturally in English, French or Mauritian Creole.</p><textarea name="description" value={form.description} onChange={update} rows="7" placeholder="I need Rs 80,000 for university by next August." /><button type="button" className="extract-button" onClick={extract}>Extract goal</button></aside>{error && <p className="form-error">{error}</p>}<div className="form-footer"><p>The analysis uses the saving capacity from your Financial Overview.</p><button className="analyse-button" disabled={analysing}>{analysing ? <LoaderCircle className="spinner" /> : <Sparkles size={19} />}{analysing ? 'Analysing...' : 'Analyse goal'}<ArrowRight size={18} /></button></div></form>}
  <RiskModal result={result} onClose={() => setResult(null)} onAdd={confirm} /></main>
}