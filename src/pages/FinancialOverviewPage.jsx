import { ArrowDownLeft, ArrowUpRight, ChevronDown, LoaderCircle, Pencil, Plus, RotateCw, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { callN8n, readN8n } from '../firebase/apiClient.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { categoryLabel, EXPENSE_GROUP_LABELS } from '../i18n/labels.js'
import { k } from '../i18n/strings.js'
import { centsToRupees, moneyFromCents, rupeesToCents } from '../utils/money.js'

const GROUPS = [
  { id: 'essential', label: EXPENSE_GROUP_LABELS.essential, hint: k('Rent, bills, groceries, transport') },
  { id: 'adjustable', label: EXPENSE_GROUP_LABELS.adjustable, hint: k('Eating out, clothing, household') },
  { id: 'optional', label: EXPENSE_GROUP_LABELS.optional, hint: k('Entertainment, subscriptions, gifts') },
]
const TRANSACTION_LIMIT = 20


// --- Monthly salary: the only editable stat card ---
function SalaryCard({ salaryCents, onSaved }) {
  const { t } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    const amount = Number(draft)
    if (draft === '' || !Number.isFinite(amount) || amount < 0) return setError(k('Enter a valid amount.'))
    setSaving(true); setError('')
    try {
      await callN8n({ inputType: 'updateSalary', salaryCents: rupeesToCents(amount) })
      setEditing(false)
      await onSaved()
    } catch (err) {
      console.error('Salary save failed:', err)
      setError(k('Could not save. Try again.'))
    } finally { setSaving(false) }
  }

  return <article className="fo-stat-card blue">
    <small>{t('Monthly salary')}</small>
    {editing ? <>
      <div className="edit-input"><b>Rs</b><input type="number" min="0" step="0.01" inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={t('Monthly salary in rupees')} autoFocus /></div>
      {error && <p className="form-error">{t(error)}</p>}
      <div className="fo-edit-actions"><button type="button" className="small-primary" onClick={save} disabled={saving}>{saving ? t('Saving…') : t('Save')}</button><button type="button" className="text-button" onClick={() => { setEditing(false); setError('') }}>{t('Cancel')}</button></div>
    </> : <div className="fo-value-row"><strong>{moneyFromCents(salaryCents)}</strong><button type="button" className="text-button" onClick={() => { setDraft(String(centsToRupees(salaryCents))); setEditing(true) }}>{t('Edit')}</button></div>}
  </article>
}

// --- Expense summary: three groups, each opens to list its expenses ---
function ExpenseGroup({ group, items, open, onToggle }) {
  const { t } = useLanguage()
  const total = items.reduce((sum, item) => sum + item.amountCents, 0)
  return <div className={`expense-group ${group.id} ${open ? 'open' : ''}`}>
    <button type="button" className="expense-row" onClick={onToggle} aria-expanded={open}>
      <span>{t(group.label)}<small>{items.length === 1 ? t('{count} expense', { count: 1 }) : t('{count} expenses', { count: items.length })}</small></span>
      <strong>{moneyFromCents(total)}<ChevronDown size={18} /></strong>
    </button>
    {open && (items.length ? <ul className="expense-items">
      {items.map((item, index) => <li key={`${item.name}-${index}`}><span>{item.name}</span><b>{moneyFromCents(item.amountCents)}</b></li>)}
    </ul> : <p className="expense-empty">{t('Nothing added to {group} yet.', { group: t(group.label) })}</p>)}
  </div>
}

// --- Edit monthly expenses: add, change or remove items in each group ---
function ExpensesEditor({ expenses, onClose, onSaved }) {
  const { t } = useLanguage()
  const [rows, setRows] = useState(() => expenses.map((e) => ({ name: e.name, amount: String(centsToRupees(e.amountCents)), group: e.group })))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (index, field, value) => setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  const add = (group) => setRows((current) => [...current, { name: '', amount: '', group }])
  const remove = (index) => setRows((current) => current.filter((_, i) => i !== index))
  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)

  async function save(event) {
    event.preventDefault()
    for (const row of rows) {
      if (!row.name.trim()) return setError(t('Every expense needs a name.'))
      if (!(Number(row.amount) > 0)) return setError(t('Enter an amount above 0 for "{name}".', { name: row.name }))
    }
    setSaving(true); setError('')
    try {
      await callN8n({
        inputType: 'saveExpenses',
        monthlyExpenses: rows.map((row) => ({ name: row.name.trim(), amountCents: rupeesToCents(row.amount), group: row.group })),
      })
      await onSaved()
    } catch (err) {
      console.error('Expenses save failed:', err)
      setError(k('Could not save your expenses. Try again.'))
      setSaving(false)
    }
  }

  return <div className="modal-backdrop"><form className="risk-modal expenses-modal" role="dialog" aria-modal="true" aria-labelledby="expenses-title" onSubmit={save}>
    <button type="button" className="modal-close" onClick={onClose} aria-label={t('Close')}><X size={20} /></button>
    <div className="modal-kicker"><Pencil size={16} />{t('Expense summary')}</div>
    <h2 id="expenses-title">{t('Your monthly expenses')}</h2>
    <p>{t('Add the costs you pay every month. Their total is your monthly expenses, used across MoBudget.')}</p>
    {GROUPS.map((group) => (
      <section className={`expense-editor-group ${group.id}`} key={group.id}>
        <header><h3>{t(group.label)}</h3><small>{t(group.hint)}</small></header>
        {rows.map((row, index) => row.group !== group.id ? null : (
          <div className="expense-editor-row" key={index}>
            <input value={row.name} onChange={(e) => update(index, 'name', e.target.value)} placeholder={t('Expense name')} aria-label={t('Expense name')} maxLength={60} />
            <div className="money-input"><b>Rs</b><input type="number" min="0" step="0.01" inputMode="decimal" value={row.amount} onChange={(e) => update(index, 'amount', e.target.value)} placeholder="0" aria-label={t('Amount for {name}', { name: row.name || t('expense') })} /></div>
            <select value={row.group} onChange={(e) => update(index, 'group', e.target.value)} aria-label={t('Group')}>
              {GROUPS.map((option) => <option key={option.id} value={option.id}>{t(option.label)}</option>)}
            </select>
            <button type="button" className="icon-button" onClick={() => remove(index)} aria-label={t('Remove {name}', { name: row.name || t('expense') })}><Trash2 size={17} /></button>
          </div>
        ))}
        <button type="button" className="add-line" onClick={() => add(group.id)}><Plus size={16} />{t('Add to {group}', { group: t(group.label) })}</button>
      </section>
    ))}
    <p className="draft-total">{t('Monthly expenses')} <strong>{moneyFromCents(rupeesToCents(total))}</strong></p>
    {error && <p className="form-error">{t(error)}</p>}
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('Cancel')}</button><button className="primary-button" disabled={saving}>{saving && <LoaderCircle className="spinner" size={18} />}{saving ? t('Saving…') : t('Save expenses')}</button></div>
  </form></div>
}

export default function FinancialOverviewPage() {
  const { t, formatDate } = useLanguage()
  const [overview, setOverview] = useState(null)
  const [transactions, setTransactions] = useState(null)
  const [error, setError] = useState('')
  const [openGroup, setOpenGroup] = useState(null)
  const [editingExpenses, setEditingExpenses] = useState(false)

  const load = useCallback(() => Promise.all([
    readN8n({ inputType: 'getDashboard' }),
    readN8n({ inputType: 'listTransactions', limit: TRANSACTION_LIMIT }),
  ]).then(([dashboard, list]) => {
    setOverview(dashboard); setTransactions(list.transactions); setError('')
  }).catch((err) => {
    console.error('Overview load failed:', err)
    setError(k('Could not load your data from the server.'))
  }), [])

  useEffect(() => { load() }, [load])

  const expenses = overview?.monthlyExpenses || []
  const value = (render) => (overview ? render(overview) : error ? '—' : '…')

  return <main className="main-content financial-page">
    <section className="page-heading"><span className="eyebrow">{t('FINANCIAL OVERVIEW')}</span><h1>{t('Salary, expenses and past transactions')}</h1><p>{t('Keep your salary and monthly expenses up to date. MoBudget uses them on the Dashboard and for your goals.')}</p></section>
    {error && <div className="load-error"><p>{t(error)}</p><button type="button" className="secondary-button" onClick={load}><RotateCw size={16} /> {t('Try again')}</button></div>}

    <section className="fo-stat-row">
      {overview ? <SalaryCard salaryCents={overview.salaryCents} onSaved={load} /> : <article className="fo-stat-card blue"><small>{t('Monthly salary')}</small><strong>{value(() => '')}</strong></article>}
      <article className="fo-stat-card amber"><small>{t('Monthly expenses')}</small><strong>{value((d) => moneyFromCents(d.monthlyRoutineCents))}</strong><span className="fo-note">{overview?.spendingSource === 'declared' ? t('Total of your expense summary') : t('Estimated from repeat spending until you add your expenses')}</span></article>
      <article className="fo-stat-card safe"><small>{t('Safe saving capacity')}</small><strong>{value((d) => moneyFromCents(d.safeSavingCapacityCents))}</strong><span className="fo-note">{t('Salary minus monthly expenses')}</span></article>
    </section>

    <section className="fo-card-row">
      <article className="fo-card">
        <div className="fo-card-head"><h2>{t('Expense summary')}</h2><button type="button" className="text-button fo-edit" onClick={() => setEditingExpenses(true)} disabled={!overview}><Pencil size={15} />{t('Edit')}</button></div>
        {!overview && !error && <p className="empty-state"><LoaderCircle className="spinner" size={18} /> {t('Loading…')}</p>}
        {overview && !expenses.length && <p className="expense-hint">{t('No monthly expenses yet. Click Edit to add rent, bills and other costs you pay each month.')}</p>}
        {overview && GROUPS.map((group) => (
          <ExpenseGroup key={group.id} group={group} items={expenses.filter((e) => e.group === group.id)} open={openGroup === group.id} onToggle={() => setOpenGroup((current) => (current === group.id ? null : group.id))} />
        ))}
      </article>

      <article className="fo-card">
        <h2>{t('Past transactions')}</h2>
        {!transactions && !error && <p className="empty-state"><LoaderCircle className="spinner" size={18} /> {t('Loading…')}</p>}
        {transactions?.length === 0 && <p className="expense-hint">{t('No transactions yet.')} <Link to="/input-data">{t('Add your first one')}</Link></p>}
        {transactions?.length > 0 && <ul className="transaction-list">
          {transactions.map((tx) => <li key={tx.id}>
            <span>{formatDate(tx.txnDate)}</span>
            <span className="tx-label">{tx.direction === 'income' ? <ArrowDownLeft size={16} className="income" /> : <ArrowUpRight size={16} />}<span><b>{tx.name || t(categoryLabel(tx.category))}</b><small>{[tx.vendor, t(categoryLabel(tx.category))].filter(Boolean).join(' · ')}</small></span></span>
            <strong className={tx.direction}>{tx.direction === 'income' ? '+ ' : '- '}{moneyFromCents(tx.amountCents)}</strong>
          </li>)}
        </ul>}
      </article>
    </section>

    {editingExpenses && <ExpensesEditor expenses={expenses} onClose={() => setEditingExpenses(false)} onSaved={async () => { setEditingExpenses(false); await load() }} />}
  </main>
}
