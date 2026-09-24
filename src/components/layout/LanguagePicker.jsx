import { Globe2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

const PHONE = '(max-width: 760px)'

// compact: show EN / FR / KM on phones, where the header has little room.
export default function LanguagePicker({ className = '', compact = false }) {
  const { language, setLanguage, languages, t } = useLanguage()
  const [isPhone, setIsPhone] = useState(() => window.matchMedia(PHONE).matches)

  useEffect(() => {
    const query = window.matchMedia(PHONE)
    const update = () => setIsPhone(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const short = compact && isPhone
  return (
    <label className={`language-picker ${className}`}>
      <Globe2 size={19} aria-hidden="true" />
      <select aria-label={t('Language')} value={language} onChange={(e) => setLanguage(e.target.value)}>
        {languages.map((item) => <option key={item.code} value={item.code}>{short ? item.short : item.label}</option>)}
      </select>
    </label>
  )
}
