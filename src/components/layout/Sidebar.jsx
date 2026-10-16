import { Bot, LayoutDashboard, Plus, ReceiptText, Target } from 'lucide-react'
import { m } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { k } from '../../i18n/strings.js'
import Logo from './Logo.jsx'

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
      <Logo tagline={t('Smart money planning')} />
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => <>
              {isActive && <m.span className="nav-indicator" layoutId="nav-indicator" transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.2 }} />}
              <Icon size={19} /><span>{t(label)}</span>
            </>}
          </NavLink>
        ))}
      </nav>
      <NavLink className="create-button" to="/goals/new"><Plus size={19} />{t('Create Goal')}</NavLink>
    </aside>
  )
}
