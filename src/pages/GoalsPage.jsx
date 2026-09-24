import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Link2, LoaderCircle, Pencil, Plus, RotateCw, ShieldAlert, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { callN8n, readN8n } from '../firebase/apiClient.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { k } from '../i18n/strings.js'
import { centsToRupees, money, moneyFromCents, rupeesToCents } from '../utils/money.js'

const emptyForm = () => ({ name: '', targetAmount: '', currentSavings: '', link: '', description: '' })

const VERDICT_TEXT = { SAFE: k('Affordable now'), TIGHT: k('Possible, but tight'), NOT_SAFE: k('Not yet') }
const STATUS_VERDICT = { tight: 'TIGHT', stalled: 'NOT_SAFE', 'on-track': 'SAFE' }

const percent = (saved, target) => (target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0)
const badgeClass = (verdict) => verdict.toLowerCase().replace('_', '-')

function goalVerdict(goal) {
  return goal.verdict || STATUS_VERDICT[goal.status] || 'NOT_SAFE'
}

function timelineText(goal, t) {
  if (goal.status === 'stalled') return t('Not reachable at your current budget')
  if (!goal.timelineMonths) return t('Affordable with your safe money now')
  return goal.timelineMonths === 1 ? t('About {count} month at your current pace', { count: 1 }) : t('About {count} months at your current pace', { count: goal.timelineMonths })
}

function GoalCard({ goal, onEdit }) {
  const { t } = useLanguage()
  const verdict = goalVerdict(goal)
  const progress = percent(goal.savedAmountCents, goal.targetAmountCents)
  return <article className="goal-card">
    <div className="goal-card-top"><div><small>{goal.goalType === 'cash' ? t('Cash goal') : t('Product')}</small><h3>{goal.itemName || t('Cash goal')}</h3></div><span className={`status-badge ${badgeClass(verdict)}`}>{t(VERDICT_TEXT[verdict])}</span></div>
    <strong className="goal-amount">{moneyFromCents(goal.targetAmountCents)}</strong>
    <div className="goal-progress-label"><span>{t('{amount} saved', { amount: moneyFromCents(goal.savedAmountCents) })}</span><b>{progress}%</b></div>
    <div className="goal-progress"><span style={{ width: `${progress}%` }} /></div>
    <div className="goal-card-bottom"><p className="goal-timeline"><CalendarClock size={17} />{timelineText(goal, t)}</p><button type="button" className="secondary-button goal-edit" onClick={() => onEdit(goal)}><Pencil size={15} />{t('Edit')}</button></div>
  </article>
}

function EditGoalModal({ goal, onClose, onSaved }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    targetAmount: String(centsToRupees(goal.targetAmountCents)),
    savedAmount: String(centsToRupees(goal.savedAmountCents)),
    link: goal.link || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const progress = percent(Number(form.savedAmount) || 0, Number(form.targetAmount) || 0)

  async function save(e) {
    e.preventDefault()
    if (!(Number(form.targetAmount) > 0)) return setError(k('Enter a goal amount above 0.'))
    if (!(Number(form.savedAmount) >= 0)) return setError(k('Saved amount cannot be negative.'))
    setSaving(true); setError('')
    try {
      const saved = await callN8n({
        inputType: 'updateGoal',
        goalKey: goal.goalKey,
        itemName: goal.itemName,
        goalType: goal.goalType,
        link: form.link.trim() || null,
        targetAmountCents: rupeesToCents(form.targetAmount),
        savedAmountCents: rupeesToCents(form.savedAmount),
      })
      if (saved.record !== 'goal') throw new Error('NOT_SAVED')
      onSaved()
    } catch (err) {
      console.error('Goal update failed:', err)
      setError(k('Could not save this goal. Try again.'))
      setSaving(false)
    }
  }

  return <div className="modal-backdrop"><form className="risk-modal edit-goal-modal" role="dialog" aria-modal="true" aria-labelledby="edit-goal-title" onSubmit={save}>
    <button type="button" className="modal-close" onClick={onClose} aria-label={t('Close')}><X size={20} /></button>
    <div className="modal-kicker"><Pencil size={16} />{t('Edit goal')}</div>
    <h2 id="edit-goal-title">{goal.itemName || t('Cash goal')}</h2>
    <p>{t('Update your savings or the goal amount. MoBudget re-checks the timeline when you save.')}</p>
    <div className="field-grid">
      <label><span>{t('Goal amount')}</span><div className="money-input"><b>Rs</b><input name="targetAmount" type="number" min="1" step="0.01" value={form.targetAmount} onChange={update} /></div></label>
      <label><span>{t('Saved so far')}</span><div className="money-input"><b>Rs</b><input name="savedAmount" type="number" min="0" step="0.01" value={form.savedAmount} onChange={update} /></div></label>
      <label className="full-width"><span>{t('Progress {percent}%', { percent: progress })}</span><div className="goal-progress"><span style={{ width: `${progress}%` }} /></div></label>
      <label className="full-width"><span>{t('Reference link (optional)')}</span><div className="icon-input"><Link2 size={17} /><input name="link" value={form.link} onChange={update} placeholder="https://shop.example/product" /></div></label>
    </div>
    {error && <p className="form-error">{t(error)}</p>}
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('Cancel')}</button><button className="primary-button" disabled={saving}>{saving && <LoaderCircle className="spinner" size={18} />}{saving ? t('Saving…') : t('Save changes')}</button></div>
  </form></div>
}

function RiskModal({ result, onClose, onAdd, adding }) {
  const { t } = useLanguage()
  if (!result) return null
  const Icon = result.verdict === 'SAFE' ? CheckCircle2 : result.verdict === 'TIGHT' ? AlertTriangle : ShieldAlert
  const timeNeeded = !result.reachable ? t('Not reachable') : result.monthsNeeded ? (result.monthsNeeded === 1 ? t('{count} month', { count: 1 }) : t('{count} months', { count: result.monthsNeeded })) : t('Now')
  return <div className="modal-backdrop"><section className="risk-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label={t('Close')}><X size={20} /></button><div className="modal-kicker"><Sparkles size={17} />{t('Goal review')}</div><h2>{t('Your risk profile')}</h2><p>{t('Review this analysis before deciding whether to add the goal.')}</p>
    <div className={`verdict-banner ${badgeClass(result.verdict)}`}><Icon size={25} /><div><small>{t('VERDICT')}</small><strong>{t(VERDICT_TEXT[result.verdict])}</strong></div></div>
    <div className="metric-grid"><article><small>{t('Goal amount')}</small><strong>{money(result.targetAmount)}</strong></article><article><small>{t('Safe to spend now')}</small><strong>{moneyFromCents(result.safeToSpendCents)}</strong></article><article><small>{t('Time needed')}</small><strong>{timeNeeded}</strong></article></div>
    <div className="explanation-box"><h3>{t('Why MoBudget gave this result')}</h3><p>{t('The goal amount is compared with the money you can safely spend today, after keeping a buffer for your usual spending and upcoming festivals. If it does not fit yet, MoBudget counts how many months of saving it takes.')}</p></div>
    <div className="modal-actions"><button className="secondary-button" onClick={onClose}>{t('Decline')}</button><button className="primary-button" onClick={onAdd} disabled={adding}>{adding && <LoaderCircle className="spinner" size={18} />}{adding ? t('Adding…') : t('Add goal')}</button></div></section></div>
}

export default function GoalsPage({ startCreating = false }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [goals, setGoals] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [editingGoal, setEditingGoal] = useState(null)
  const [creating, setCreating] = useState(startCreating); const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(''); const [analysing, setAnalysing] = useState(false); const [result, setResult] = useState(null); const [adding, setAdding] = useState(false)
  const progress = useMemo(() => percent(Number(form.currentSavings) || 0, Number(form.targetAmount) || 0), [form])
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const loadGoals = useCallback(() => readN8n({ inputType: 'listGoals' })
    .then((data) => { setGoals(data.goals); setLoadError('') })
    .catch((err) => {
      console.error('Goals load failed:', err)
      setLoadError(k('Could not load your goals from the server.'))
    }), [])

  useEffect(() => { loadGoals() }, [loadGoals])

  function extract() {
    const text = form.description.trim(); if (!text) return setError(k('Describe the goal first.'))
    const amount = text.replaceAll(',', '').match(/(?:rs\s*)?(\d{3,})/i)?.[1] || ''
    setForm((f) => ({ ...f, name: f.name || text.split(/\b(?:for|by|pour|avant|pou|avan)\b/i)[0].slice(0, 50), targetAmount: f.targetAmount || amount }))
    setError('')
  }

  // --- Check the goal (afford route: nothing is saved) ---
  async function submit(e) {
    e.preventDefault(); setError('')
    if (!form.name.trim() || !(Number(form.targetAmount) > 0)) return setError(k('Enter a goal name and a valid amount.'))
    if (Number(form.currentSavings) < 0) return setError(k('Current savings cannot be negative.'))
    setAnalysing(true)
    try {
      const check = await callN8n({ inputType: 'afford', itemName: form.name.trim(), targetAmountCents: rupeesToCents(form.targetAmount), link: form.link.trim() || null })
      if (check.verdict === 'NEEDS_PROFILE') setError(k('Add your salary first. Upload a payslip on the Financial Input page, then try again.'))
      else setResult({ ...check, targetAmount: Number(form.targetAmount) })
    } catch (err) {
      console.error('Goal check failed:', err)
      setError(k('Could not analyse this goal. Try again.'))
    } finally { setAnalysing(false) }
  }

  // --- Save the goal (goal route) ---
  async function confirm() {
    setAdding(true)
    try {
      const saved = await callN8n({ inputType: 'goal', itemName: form.name.trim(), goalType: 'product', targetAmountCents: rupeesToCents(form.targetAmount), savedAmountCents: rupeesToCents(form.currentSavings), link: form.link.trim() || null })
      if (saved.record !== 'goal') throw new Error('NOT_SAVED')
      setResult(null); setForm(emptyForm()); setCreating(false); setGoals(null)
      await loadGoals(); navigate('/goals')
    } catch (err) {
      console.error('Goal save failed:', err)
      setResult(null); setError(k('Could not save this goal. Try again.'))
    } finally { setAdding(false) }
  }

  async function afterEdit() { setEditingGoal(null); await loadGoals() }

  return <main className="main-content goals-page"><section className="page-title-row"><div><span className="eyebrow">{t('MY GOALS')}</span><h1>{creating ? t('Create a new goal') : t('Your financial goals')}</h1><p>{creating ? t('Tell MoBudget what you want to achieve and review the risk profile before adding it.') : t('Track your saved goals and see how they fit your financial capacity.')}</p></div><button className="new-goal-button" onClick={() => setCreating(true)}><Plus size={18} />{t('New goal')}</button></section>
  {!creating ? <>
    <div className="saved-heading"><div><span className="eyebrow">{t('YOUR PLAN')}</span><h2>{t('Saved goals')}</h2></div><span>{goals ? t('{count} active', { count: goals.length }) : '…'}</span></div>
    {loadError && <div className="load-error"><p>{t(loadError)}</p><button type="button" className="secondary-button" onClick={loadGoals}><RotateCw size={16} /> {t('Try again')}</button></div>}
    {!goals && !loadError && <p className="empty-state"><LoaderCircle className="spinner" size={18} /> {t('Loading your goals…')}</p>}
    {goals?.length === 0 && <p className="empty-state">{t('You have no saved goals yet. Click New goal to add one.')}</p>}
    <section className="saved-goals">{goals?.map((g) => <GoalCard goal={g} key={g.goalKey || g.id} onEdit={setEditingGoal} />)}</section>
  </> :
  <form className="goal-form" onSubmit={submit}><section className="form-card"><div className="section-heading"><h2>{t('Goal details')}</h2></div>
    <div className="progress-track"><span style={{ width: '100%' }} /></div>
    <div className="field-grid"><label><span>{t('Goal name')}</span><input name="name" value={form.name} onChange={update} placeholder={t('e.g. University laptop')} /></label><label><span>{t('Goal amount')}</span><div className="money-input"><b>Rs</b><input name="targetAmount" type="number" min="1" value={form.targetAmount} onChange={update} placeholder="80,000" /></div></label><label className="full-width"><span>{t('Current savings')}</span><div className="money-input"><b>Rs</b><input name="currentSavings" type="number" min="0" value={form.currentSavings} onChange={update} placeholder="20,000" /></div><div className="savings-preview"><span style={{ width: `${progress}%` }} /></div></label><label className="full-width"><span>{t('Reference link (optional)')}</span><div className="icon-input"><Link2 size={17} /><input name="link" value={form.link} onChange={update} placeholder="https://shop.example/product" /></div></label></div></section>
    <aside className="natural-card"><Sparkles size={22} /><h2>{t('Describe it your way')}</h2><p>{t('Type naturally in English, French or Mauritian Creole.')}</p><textarea name="description" value={form.description} onChange={update} rows="7" placeholder={t('I need Rs 80,000 for university by next August.')} /><button type="button" className="extract-button" onClick={extract}>{t('Extract goal')}</button></aside>
    {error && <p className="form-error">{t(error)}</p>}
    <div className="form-footer"><p>{t('The analysis uses your saved salary and spending.')}</p><button className="analyse-button" disabled={analysing}>{analysing ? <LoaderCircle className="spinner" /> : <Sparkles size={19} />}{analysing ? t('Analysing...') : t('Analyse goal')}<ArrowRight size={18} /></button></div></form>}
  <RiskModal result={result} onClose={() => setResult(null)} onAdd={confirm} adding={adding} />
  {editingGoal && <EditGoalModal goal={editingGoal} onClose={() => setEditingGoal(null)} onSaved={afterEdit} />}
  </main>
}
