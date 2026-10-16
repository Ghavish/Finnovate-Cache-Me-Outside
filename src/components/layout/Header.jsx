import { LogOut, UserCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { logOut } from "../../firebase/authService"
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import LanguagePicker from './LanguagePicker.jsx'
import Logo from './Logo.jsx'
import NameDialog from './NameDialog.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function Header() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [editingName, setEditingName] = useState(false)

  const handleSignOut = async () => {
    await logOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="topbar">
      <div className="mobile-brand"><Logo size={30} /></div>
      <div className="topbar-actions">
        <LanguagePicker compact />
        <ThemeToggle />
        <button type="button" className="profile-button" onClick={() => setEditingName(true)} aria-label={t('Your name')}>
          <UserCircle size={24} />
          <span>{user?.displayName || user?.email}</span>
        </button>
        <button type="button" onClick={handleSignOut} aria-label={t('Logout')}>
          <LogOut size={19} />
          <span>{t('Logout')}</span>
        </button>
      </div>
      {editingName && <NameDialog onClose={() => setEditingName(false)} />}
    </header>
  )
}
