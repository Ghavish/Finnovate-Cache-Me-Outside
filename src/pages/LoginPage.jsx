import { useState } from 'react'
import { Eye, EyeOff, Target } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { logIn, authMessage } from '../firebase/authService.js' // 1. Added Firebase imports

export default function LoginPage() {
  const { user } = useAuth() // 2. Removed 'login' from context extraction
  const navigate = useNavigate()
  const location = useLocation()
  
  const [email, setEmail] = useState('aisha@goalpath.mu')
  const [password, setPassword] = useState('demo1234')
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
        <div className="login-logo">GOALPATH <span>AI</span></div>
        <div>
          <div className="login-icon"><Target size={30} /></div>
          <h1>Plan your goals.<br />Understand your money.</h1>
          <p>Build a clearer path toward the financial goals that matter to you.</p>
        </div>
        <small>Your financial journey starts here.</small>
      </section>
      
      <section className="login-panel login-form-panel">
        <form onSubmit={submit}>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Log in to GoalPath</h2>
          <p>Demo details are already filled in. Click Log in to continue.</p>
          
          <label>Email address
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          
          <label>Password
            <div className="password-input">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label="Show or hide password">
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>
          
          {error && <p className="form-error">{error}</p>}
          
          <button className="primary-button" type="submit">Log in</button>
          
          <div className="demo-box">
            <strong>Standalone demo:</strong> login is stored in this browser. Firebase can replace the AuthContext later.
          </div>
        </form>
      </section>
    </main>
  )
}