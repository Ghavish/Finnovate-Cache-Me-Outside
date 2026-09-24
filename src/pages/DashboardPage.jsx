import { ArrowRight, CircleDollarSign, RotateCw, Target, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { readN8n } from '../firebase/apiClient.js'
import { moneyFromCents } from '../utils/money.js'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => readN8n({ inputType: 'getDashboard' })
    .then((data) => { setDashboard(data); setError('') })
    .catch((err) => {
      console.error('Dashboard load failed:', err)
      setError('Could not load your data from the server.')
    }), [])

  useEffect(() => { load() }, [load])

  const value = (render) => (dashboard ? render(dashboard) : error ? '—' : '…')
  const name = user?.displayName || user?.email?.split('@')[0]

  return <main className="main-content">
    <section className="page-heading"><span className="eyebrow">DASHBOARD</span><h1>{greeting()}{name ? `, ${name}` : ''}</h1><p>Your financial picture and goals are connected across every screen.</p></section>
    <section className="dashboard-hero"><div><span><TrendingUp size={16} />Financial planning</span><h2>Build your financial picture.</h2><p>Add your income and expenses so GoalPath can calculate your safe saving capacity and guide your goals.</p><Link to="/input-data">Get started <ArrowRight size={18} /></Link></div></section>
    {error && <div className="load-error"><p>{error}</p><button type="button" className="secondary-button" onClick={load}><RotateCw size={16} /> Try again</button></div>}
    <section className="summary-grid">
      <article><CircleDollarSign /><small>Monthly salary</small><strong>{value((d) => moneyFromCents(d.salaryCents))}</strong></article>
      <article><CircleDollarSign /><small>Monthly expenses</small><strong>{value((d) => moneyFromCents(d.monthlyRoutineCents))}</strong><small className="card-note">Usual monthly spending</small></article>
      <article><Target /><small>Active goals</small><strong>{value((d) => d.activeGoals)}</strong></article>
    </section>
    <section className="quick-grid">
      <Link to="/financial-overview"><h3>Review finances</h3><p>Edit salary, expenses and view recent transactions.</p><span>Open overview <ArrowRight size={16} /></span></Link>
      <Link to="/goals"><h3>Review goals</h3><p>See saved goals or analyse a new one.</p><span>Open goals <ArrowRight size={16} /></span></Link>
    </section>
  </main>
}
