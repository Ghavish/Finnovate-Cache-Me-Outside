import { Globe2, LogOut, Menu, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext.jsx'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  function signOut() { logout(); navigate('/login', { replace: true }) }
  return (
    <header className="topbar">
      <div className="mobile-brand"><Menu size={23} /><strong>GOALPATH</strong></div>
      <div className="topbar-actions">
        <button type="button"><Globe2 size={18} />EN / KR</button>
        <button type="button"><UserCircle size={25} /><span>{user?.name || 'Aisha'}</span></button>
        <button type="button" onClick={signOut} aria-label="Log out"><LogOut size={19} /><span>Logout</span></button>
      </div>
    </header>
  )
}
