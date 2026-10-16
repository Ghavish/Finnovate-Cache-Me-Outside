import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/layout/Logo.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function NotFoundPage() {
  const { t } = useLanguage()
  return <main className="not-found">
    <div className="aurora" aria-hidden="true" />
    <span className="not-found-ghost" aria-hidden="true">404</span>
    <div className="not-found-card">
      <LogoMark size={44} />
      <h1>{t('Page not found')}</h1>
      <Link to="/dashboard"><ArrowLeft size={17} />{t('Return to Dashboard')}</Link>
    </div>
  </main>
}
