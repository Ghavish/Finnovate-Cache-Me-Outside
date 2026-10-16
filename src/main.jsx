import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LazyMotion, MotionConfig } from 'motion/react'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppDataProvider } from './state/AppDataContext.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import { ThemeProvider } from './theme/ThemeContext.jsx'
import '@fontsource-variable/hanken-grotesk'
import './index.css'

const loadMotionFeatures = () => import('./theme/motionFeatures.js').then((module) => module.default)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <MotionConfig reducedMotion="user">
            <LazyMotion features={loadMotionFeatures} strict>
              <AuthProvider>
                <AppDataProvider><App /></AppDataProvider>
              </AuthProvider>
            </LazyMotion>
          </MotionConfig>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
