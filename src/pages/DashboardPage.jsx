import { ArrowRight, CircleDollarSign, RotateCcw, Target, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../state/AppDataContext.jsx'

const money = (value) => `Rs ${Math.round(value || 0).toLocaleString('en-MU')}`

export default function DashboardPage() {
  const { data, resetDemo } = useAppData()
  return <main className="main-content">
    <section className="page-heading"><span className="eyebrow">DASHBOARD</span><h1>Good afternoon, Aisha</h1><p>Your financial picture and goals are connected across every screen.</p></section>
    <section className="dashboard-hero"><div><span><TrendingUp size={16} />Financial planning</span><h2>Build your financial picture.</h2><p>Add your income and expenses so GoalPath can calculate your safe saving capacity and guide your goals.</p><Link to="/input-data">Get started <ArrowRight size={18} /></Link></div></section>
    <section className="summary-grid">
      <article><CircleDollarSign /><small>Monthly salary</small><strong>{money(data.salary)}</strong></article>
      <article><CircleDollarSign /><small>Monthly expenses</small><strong>{money(data.expenses)}</strong></article>
      <article><Target /><small>Active goals</small><strong>{data.goals.length}</strong></article>
    </section>
    <section className="quick-grid">
      <Link to="/financial-overview"><h3>Review finances</h3><p>Edit salary, expenses and view recent transactions.</p><span>Open overview <ArrowRight size={16} /></span></Link>
      <Link to="/goals"><h3>Review goals</h3><p>See saved goals or analyse a new one.</p><span>Open goals <ArrowRight size={16} /></span></Link>
    </section>
    <button className="reset-button" type="button" onClick={resetDemo}><RotateCcw size={16} /> Reset demo data</button>
  </main>
}
