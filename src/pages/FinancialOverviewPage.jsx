import { useState } from 'react'
import { useAppData } from '../state/AppDataContext.jsx'

const money = (value) => `Rs ${Math.round(value || 0).toLocaleString('en-MU')}`

function EditableStat({ label, value, accent, onSave }) {
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(value)
  function save() { const amount = Number(draft); if (!Number.isFinite(amount) || amount < 0) return; onSave(amount); setEditing(false) }
  return <article className={`fo-stat-card ${accent}`}><small>{label}</small>{editing ? <><div className="edit-input"><b>Rs</b><input type="number" min="0" value={draft} onChange={(e) => setDraft(e.target.value)} /></div><div><button className="small-primary" onClick={save}>Save</button><button className="text-button" onClick={() => setEditing(false)}>Cancel</button></div></> : <div className="fo-value-row"><strong>{money(value)}</strong><button className="text-button" onClick={() => { setDraft(value); setEditing(true) }}>Edit</button></div>}</article>
}

export default function FinancialOverviewPage() {
  const { data, updateFinancial } = useAppData()
  return <main className="main-content financial-page"><section className="page-heading"><span className="eyebrow">FINANCIAL OVERVIEW</span><h1>Salary, expenses and past transactions</h1><p>Values are shared with Dashboard and Goals. Correct them here without uploading a document again.</p></section><p className="source-note">Updated from <strong>{data.sourceLabel}</strong> and your manual entries.</p>
  <section className="fo-stat-row"><EditableStat label="Monthly salary" value={data.salary} accent="blue" onSave={(v) => updateFinancial('salary', v)} /><EditableStat label="Monthly expenses" value={data.expenses} accent="amber" onSave={(v) => updateFinancial('expenses', v)} /><article className="fo-stat-card safe"><small>Safe saving capacity</small><strong>{money(data.safeSavingCapacity)}</strong></article></section>
  <section className="fo-card-row"><article className="fo-card"><h2>Expense summary</h2>{Object.entries(data.expenseBreakdown).map(([key,value]) => <div className={`expense-row ${key}`} key={key}><span>{key[0].toUpperCase()+key.slice(1)}</span><strong>{money(value)}</strong></div>)}</article><article className="fo-card"><h2>Past transactions</h2><ul className="transaction-list">{data.transactions.map((tx) => <li key={tx.id}><span>{tx.date}</span><span>{tx.description}</span><strong className={tx.type}>{tx.type === 'income' ? '+ ' : '- '}{money(Math.abs(tx.amount))}</strong></li>)}</ul></article></section></main>
}
