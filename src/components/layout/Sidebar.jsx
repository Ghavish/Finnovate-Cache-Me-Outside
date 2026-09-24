import { Bot, LayoutDashboard, Plus, ReceiptText, Target } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { k } from '../../i18n/strings.js'

const links = [
  { to: '/dashboard', label: k('Dashboard'), icon: LayoutDashboard },
  { to: '/goals', label: k('My Goals'), icon: Target },
  { to: '/coach', label: k('AI Coach'), icon: Bot },
  { to: '/financial-overview', label: k('Transactions'), icon: ReceiptText },
]

export default function Sidebar() {
  const { t } = useLanguage()
  return (
    <aside className="sidebar" aria-label={t('Main navigation')}>
      <div className="brand">
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
        <span><strong>MoBudget</strong><small>{t('Smart money planning')}</small></span>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={19} /><span>{t(label)}</span>
          </NavLink>
        ))}
      </nav>
      <NavLink className="create-button" to="/goals/new"><Plus size={19} />{t('Create Goal')}</NavLink>
    </aside>
  )
}
