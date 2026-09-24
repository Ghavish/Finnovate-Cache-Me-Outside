/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGES, formatShortDate, translate } from './strings.js'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'mobudget-language'
const OLD_STORAGE_KEY = 'goalpath-language' // the team's first version used this key

function savedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY)
    return LANGUAGES.some((item) => item.code === saved) ? saved : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(savedLanguage)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, language) } catch { /* private mode: keep it for this visit only */ }
    document.documentElement.lang = language
  }, [language])

  // t('Monthly salary') or t('{count} expenses', { count: 3 }); falls back to English.
  const t = useCallback((text, vars) => translate(language, text, vars), [language])
  const formatDate = useCallback((isoDate) => formatShortDate(language, isoDate), [language])

  const value = useMemo(() => ({ language, setLanguage, languages: LANGUAGES, t, formatDate }), [language, t, formatDate])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider')
  return value
}
