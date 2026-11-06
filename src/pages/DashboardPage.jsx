import { ArrowDownLeft, ArrowRight, ArrowUpRight, PiggyBank, ReceiptText, RotateCw, Target, TrendingUp, UserRound, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NameDialog from '../components/layout/NameDialog.jsx'
import CountUp from '../components/ui/CountUp.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { peekRead, readN8n } from '../firebase/apiClient.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { categoryLabel } from '../i18n/labels.js'
import { k } from '../i18n/strings.js'
import { moneyFromCents } from '../utils/money.js'

const DASHBOARD = { inputType: 'getDashboard' }

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return k('Good morning')
  if (hour < 18) return k('Good afternoon')
  return k('Good evening')
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, formatDate } = useLanguage()
  const [dashboard, setDashboard] = useState(() => peekRead(DASHBOARD) ?? null)
  const [error, setError] = useState('')
  const [editingName, setEditingName] = useState(false)

  const load = useCallback(() => readN8n(DASHBOARD)
    .then((data) => { setDashboard(data); setError('') })
    .catch((err) => {
      console.error('Dashboard load failed:', err)
      setError(k('Could not load your data from the server.'))
    }), [])

  useEffect(() => { load() }, [load])

  const value = (render) => (dashboard ? render(dashboard) : error ? '—' : '…')
  const name = user?.displayName?.trim()
  const recent = dashboard?.recentTransactions || []

  return <main className="main-content dashboard-page">
    <section className="page-heading">
      <span className="eyebrow">{t('DASHBOARD')}</span>
      <h1>{t(greeting())}{name ? <>, <span className="greeting-name">{name}</span></> : ''}</h1>
      <p>{t('Your financial picture and goals are connected across every screen.')}</p>
      {!name && <button type="button" className="name-prompt" onClick={() => setEditingName(true)}><UserRound size={16} />{t('Add your name')}</button>}
    </section>
    {error && <div className="load-error"><p>{t(error)}</p><button type="button" className="secondary-button" onClick={load}><RotateCw size={16} /> {t('Try again')}</button></div>}

    {/* Coinview "Overview": the big figure on the left, three pastel figure cards on the right */}
    <div className="overview-top">
      <section className="overview-block" aria-labelledby="balance-title">
        <h2 id="balance-title" className="block-title">{t('Safe saving capacity')}</h2>
        <article className={`balance-card ${dashboard?.safeSavingCapacityCents < 0 ? 'negative' : ''}`}>
          <span className="balance-icon" aria-hidden="true"><PiggyBank size={22} /></span>
          <strong>{value((d) => <CountUp value={d.safeSavingCapacityCents || 0} format={moneyFromCents} />)}</strong>
          <small>{t('Salary minus monthly expenses')}</small>
        </article>
      </section>

      <section className="overview-block" aria-labelledby="figures-title">
        <h2 id="figures-title" className="block-title">{t('Your figures')}</h2>
        <div className="summary-grid">
          <article className="tint-lilac">
            <strong>{value((d) => <CountUp value={d.salaryCents || 0} format={moneyFromCents} />)}</strong>
            <small>{t('Monthly salary')}</small>
            <span className="tile-icon" aria-hidden="true"><Wallet size={20} /></span>
          </article>
          <article className="tint-mint">
            <strong>{value((d) => <CountUp value={d.monthlyRoutineCents || 0} format={moneyFromCents} />)}</strong>
            <small>{t('Monthly expenses')}</small>
            <span className="tile-icon" aria-hidden="true"><ReceiptText size={20} /></span>
            {dashboard && <small className="card-note">{dashboard.spendingSource === 'declared' ? t('From your expense summary') : t('Estimated from repeat spending')}</small>}
          </article>
          <article className="tint-cream">
            <strong>{value((d) => d.activeGoals)}</strong>
            <small>{t('Active goals')}</small>
            <span className="tile-icon" aria-hidden="true"><Target size={20} /></span>
          </article>
        </div>
      </section>
    </div>

    <section className="dashboard-hero">
      <div className="aurora" aria-hidden="true" />
      <div><span><TrendingUp size={16} />{t('Financial planning')}</span><h2>{t('Build your financial picture.')}</h2><p>{t('Add your income and expenses so MoBudget can calculate your safe saving capacity and guide your goals.')}</p><Link to="/input-data">{t('Get started')} <ArrowRight size={18} /></Link></div>
    </section>
    <section className="quick-grid">
      <Link to="/financial-overview"><h3>{t('Review finances')}</h3><p>{t('Edit salary, expenses and view recent transactions.')}</p><span>{t('Open overview')} <ArrowRight size={16} /></span></Link>
      <Link to="/goals"><h3>{t('Review goals')}</h3><p>{t('See saved goals or analyse a new one.')}</p><span>{t('Open goals')} <ArrowRight size={16} /></span></Link>
    </section>

    {/* Coinview's market table, with the latest transactions */}
    <section className="recent-card" aria-labelledby="recent-title">
      <div className="recent-head">
        <h2 id="recent-title">{t('Recent transactions')}</h2>
        <Link className="pill-link" to="/financial-overview">{t('View all')} <ArrowRight size={15} /></Link>
      </div>
      {!dashboard && !error && <p className="empty-state">{t('Loading…')}</p>}
      {dashboard && !recent.length && <p className="expense-hint">{t('No transactions yet.')} <Link to="/input-data">{t('Add your first one')}</Link></p>}
      {recent.length > 0 && <table className="recent-table">
        <thead><tr><th scope="col">{t('Name')}</th><th scope="col" className="col-category">{t('Category')}</th><th scope="col">{t('Date')}</th><th scope="col" className="col-amount">{t('Amount')}</th></tr></thead>
        <tbody>
          {recent.map((tx) => <tr key={tx.id}>
            <td><span className="tx-label"><i className={`tx-chip ${tx.direction}`} aria-hidden="true">{tx.direction === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</i><span><b>{tx.name || t(categoryLabel(tx.category))}</b>{tx.vendor && <small>{tx.vendor}</small>}</span></span></td>
            <td className="col-category">{t(categoryLabel(tx.category))}</td>
            <td className="col-date">{formatDate(tx.txnDate)}</td>
            <td className={`col-amount ${tx.direction}`}>{tx.direction === 'income' ? '+ ' : '- '}{moneyFromCents(tx.amountCents)}</td>
          </tr>)}
        </tbody>
      </table>}
    </section>

    {editingName && <NameDialog onClose={() => setEditingName(false)} />}
  </main>
}
