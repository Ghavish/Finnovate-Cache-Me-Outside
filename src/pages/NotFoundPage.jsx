import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function NotFoundPage() {
  const { t } = useLanguage()
  return <main className="not-found"><h1>{t('Page not found')}</h1><Link to="/dashboard">{t('Return to Dashboard')}</Link></main>
}
