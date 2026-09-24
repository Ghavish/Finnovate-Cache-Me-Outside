import { Home, ReceiptText, Target } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { k } from '../../i18n/strings.js'

const links = [
  { to: '/dashboard', label: k('Home'), icon: Home },
  { to: '/goals', label: k('Goals'), icon: Target },
  { to: '/financial-overview', label: k('Transactions'), icon: ReceiptText },
]

export default function MobileNav() {
  const { t } = useLanguage()
  return <nav className="mobile-nav" aria-label={t('Mobile navigation')}>
    {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'selected' : ''}><Icon size={20} /><span>{t(label)}</span></NavLink>)}
  </nav>
}
