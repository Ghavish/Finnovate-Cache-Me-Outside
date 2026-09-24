import { LogOut, Menu, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { logOut } from "../../firebase/authService"
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import LanguagePicker from './LanguagePicker.jsx'

export default function Header() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="topbar">
      <div className="mobile-brand"><Menu size={23} /><strong>MoBudget</strong></div>
      <div className="topbar-actions">
        <LanguagePicker compact />
        <button type="button">
          <UserCircle size={25} />
          <span>{user?.displayName || user?.email}</span>
        </button>
        <button type="button" onClick={handleSignOut} aria-label={t('Logout')}>
          <LogOut size={19} />
          <span>{t('Logout')}</span>
        </button>
      </div>
    </header>
  )
}
