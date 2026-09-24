import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppDataProvider } from './state/AppDataContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider><App /></AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
