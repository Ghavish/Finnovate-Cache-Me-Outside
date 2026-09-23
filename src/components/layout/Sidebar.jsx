import { Bot, LayoutDashboard, Plus, ReceiptText, Target } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/goals', label: 'My Goals', icon: Target },
  { to: '/coach', label: 'AI Coach', icon: Bot },
  { to: '/financial-overview', label: 'Transactions', icon: ReceiptText },
]

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
        <span><strong>GOALPATH</strong><small>AI</small></span>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={19} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <NavLink className="create-button" to="/goals/new"><Plus size={19} />Create Goal</NavLink>
    </aside>
  )
}
