import { useState } from 'react'
import { Eye, EyeOff, Target } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { logIn, authMessage } from '../firebase/authService.js' // 1. Added Firebase imports
import { useLanguage } from '../i18n/LanguageContext.jsx'
import LanguagePicker from '../components/layout/LanguagePicker.jsx'

export default function LoginPage() {
  const { user } = useAuth() // 2. Removed 'login' from context extraction
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  // 3. Made the submit function async
  async function submit(event) {
    event.preventDefault()
    setError('') // Clear any old errors before trying again
    
    try {
      // 4. Added 'await' and used the Firebase 'logIn' function
      await logIn(email.trim(), password) 
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) { 
      // 5. Use your dictionary to translate the ugly Firebase error code
      setError(authMessage(err.code)) 
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel login-brand-panel">
        <div className="login-logo">Mo<span>Budget</span></div>
        <div>
          <div className="login-icon"><Target size={30} /></div>
          <h1>{t('Plan your goals.')}<br />{t('Understand your money.')}</h1>
          <p>{t('Build a clearer path toward the financial goals that matter to you.')}</p>
        </div>
        <small>{t('Your financial journey starts here.')}</small>
      </section>
      
      <section className="login-panel login-form-panel">
        <LanguagePicker className="auth-language" />
        <form onSubmit={submit}>
          <span className="eyebrow">{t('WELCOME BACK')}</span>
          <h2>{t('Log in to MoBudget')}</h2>
          <p>{t('Enter your email and password to continue.')}</p>
          
          <label>{t('Email address')}
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          
          <label>{t('Password')}
            <div className="password-input">
              <input type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={t('Show or hide password')}>
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>
          
          {error && <p className="form-error">{t(error)}</p>}
          
          <button className="primary-button" type="submit">{t('Log in')}</button>
          
          <p className="auth-switch">{t('New to MoBudget?')} <Link to="/signup">{t('Create an account')}</Link></p>
        </form>
      </section>
    </main>
  )
}