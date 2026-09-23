import { Home, ReceiptText, Target } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/financial-overview', label: 'Transactions', icon: ReceiptText },
]

export default function MobileNav() {
  return <nav className="mobile-nav" aria-label="Mobile navigation">
    {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'selected' : ''}><Icon size={20} /><span>{label}</span></NavLink>)}
  </nav>
}
