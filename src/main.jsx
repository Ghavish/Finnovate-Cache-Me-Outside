import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import { AppDataProvider } from './state/AppDataContext.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider><AppDataProvider><App /></AppDataProvider></LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
