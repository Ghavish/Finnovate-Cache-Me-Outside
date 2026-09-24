import { ArrowRight, CircleDollarSign, RotateCw, Target, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { readN8n } from '../firebase/apiClient.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { k } from '../i18n/strings.js'
import { moneyFromCents } from '../utils/money.js'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return k('Good morning')
  if (hour < 18) return k('Good afternoon')
  return k('Good evening')
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => readN8n({ inputType: 'getDashboard' })
    .then((data) => { setDashboard(data); setError('') })
    .catch((err) => {
      console.error('Dashboard load failed:', err)
      setError(k('Could not load your data from the server.'))
    }), [])

  useEffect(() => { load() }, [load])

  const value = (render) => (dashboard ? render(dashboard) : error ? '—' : '…')
  const name = user?.displayName || user?.email?.split('@')[0]

  return <main className="main-content">
    <section className="page-heading"><span className="eyebrow">{t('DASHBOARD')}</span><h1>{t(greeting())}{name ? `, ${name}` : ''}</h1><p>{t('Your financial picture and goals are connected across every screen.')}</p></section>
    <section className="dashboard-hero"><div><span><TrendingUp size={16} />{t('Financial planning')}</span><h2>{t('Build your financial picture.')}</h2><p>{t('Add your income and expenses so MoBudget can calculate your safe saving capacity and guide your goals.')}</p><Link to="/input-data">{t('Get started')} <ArrowRight size={18} /></Link></div></section>
    {error && <div className="load-error"><p>{t(error)}</p><button type="button" className="secondary-button" onClick={load}><RotateCw size={16} /> {t('Try again')}</button></div>}
    <section className="summary-grid">
      <article><CircleDollarSign /><small>{t('Monthly salary')}</small><strong>{value((d) => moneyFromCents(d.salaryCents))}</strong></article>
      <article><CircleDollarSign /><small>{t('Monthly expenses')}</small><strong>{value((d) => moneyFromCents(d.monthlyRoutineCents))}</strong><small className="card-note">{dashboard?.spendingSource === 'declared' ? t('From your expense summary') : t('Estimated from repeat spending')}</small></article>
      <article><Target /><small>{t('Active goals')}</small><strong>{value((d) => d.activeGoals)}</strong></article>
    </section>
    <section className="quick-grid">
      <Link to="/financial-overview"><h3>{t('Review finances')}</h3><p>{t('Edit salary, expenses and view recent transactions.')}</p><span>{t('Open overview')} <ArrowRight size={16} /></span></Link>
      <Link to="/goals"><h3>{t('Review goals')}</h3><p>{t('See saved goals or analyse a new one.')}</p><span>{t('Open goals')} <ArrowRight size={16} /></span></Link>
    </section>
  </main>
}
