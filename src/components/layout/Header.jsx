import { Globe2, LogOut, Menu, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { logOut } from "../../firebase/authService"

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Your simplified async logout logic
  const handleSignOut = async () => {
    await logOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="topbar">
      <div className="mobile-brand"><Menu size={23} /><strong>MoBudget</strong></div>
      <div className="topbar-actions">
        <button type="button"><Globe2 size={18} />EN / KR</button>
        <button type="button">
          <UserCircle size={25} />
          <span>{user?.displayName || user?.email}</span>
        </button>
        <button type="button" onClick={handleSignOut} aria-label="Log out">
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}