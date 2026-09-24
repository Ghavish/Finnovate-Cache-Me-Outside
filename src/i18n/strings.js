// --- MoBudget translations ---
// Keys are the English text used in the code: t('Monthly salary').
// Add every new key to both fr.js and mfe.js; `npm run i18n:check` lists anything missing.
// Placeholders like {count} are filled in by t('{count} expenses', { count: 3 }).
import fr from './fr.js'
import mfe from './mfe.js'

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'mfe', label: 'Kreol Morisien', short: 'KM' },
]
export const DEFAULT_LANGUAGE = 'en'
export const TRANSLATIONS = { fr, mfe }

export function translate(language, text, vars) {
  const template = TRANSLATIONS[language]?.[text] ?? text
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

// --- Dates: "25 Sep" / "25 sept." / "25 Sep" in Kreol month names ---
const LOCALES = { en: 'en-GB', fr: 'fr-FR' }
const KREOL_MONTHS = ['Zan', 'Fev', 'Mar', 'Avr', 'Me', 'Zin', 'Zil', 'Out', 'Sep', 'Okt', 'Nov', 'Des']

export function formatShortDate(language, isoDate) {
  const date = new Date(`${isoDate}T00:00:00`)
  if (!isoDate || Number.isNaN(date.getTime())) return isoDate || ''
  if (language === 'mfe') return `${date.getDate()} ${KREOL_MONTHS[date.getMonth()]}`
  return date.toLocaleDateString(LOCALES[language] || LOCALES.en, { day: 'numeric', month: 'short' })
}

// Marks text that is translated later with t(), so `npm run i18n:check` can find it.
export const k = (text) => text
