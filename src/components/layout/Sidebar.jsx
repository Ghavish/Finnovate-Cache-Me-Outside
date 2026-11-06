import { Bot, LayoutDashboard, LogOut, Plus, ReceiptText, Target } from 'lucide-react'
import { m } from 'motion/react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logOut } from '../../firebase/authService'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { k } from '../../i18n/strings.js'
import Logo from './Logo.jsx'

const links = [
  { to: '/dashboard', label: k('Dashboard'), icon: LayoutDashboard },
  { to: '/goals', label: k('My Goals'), icon: Target },
  { to: '/coach', label: k('AI Coach'), icon: Bot },
  { to: '/financial-overview', label: k('Transactions'), icon: ReceiptText },
]

// Icon rail: narrow by default, widens over the page on hover or keyboard focus to show the labels.
export default function Sidebar() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar" aria-label={t('Main navigation')}>
      <Logo tagline={t('Smart money planning')} />
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => <>
              {isActive && <m.span className="nav-indicator" layoutId="nav-indicator" transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.2 }} />}
              <Icon size={20} /><span className="rail-label">{t(label)}</span>
            </>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <NavLink className="create-button" to="/goals/new"><Plus size={20} /><span className="rail-label">{t('Create Goal')}</span></NavLink>
        <button type="button" className="nav-item rail-logout" onClick={handleSignOut}><LogOut size={20} /><span className="rail-label">{t('Logout')}</span></button>
      </div>
    </aside>
  )
}
