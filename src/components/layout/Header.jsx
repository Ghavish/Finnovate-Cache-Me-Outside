import { Globe2, LogOut, Menu, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { language, setLanguage, languages, t } = useLanguage()
  function signOut() { logout(); navigate('/login', { replace: true }) }
  return (
    <header className="topbar">
      <div className="mobile-brand"><Menu size={23} /><strong>GOALPATH</strong></div>
      <div className="topbar-actions">
        <div className="language-picker"><Globe2 size={19} aria-hidden="true" /><select aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>{languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div>
        <button type="button"><UserCircle size={25} /><span>{user?.name || 'Aisha'}</span></button>
        <button type="button" onClick={signOut} aria-label={t('Logout')}><LogOut size={19} /><span>{t('Logout')}</span></button>
      </div>
    </header>
  )
}
