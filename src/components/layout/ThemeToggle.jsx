import { Moon, Sun } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useTheme } from '../../theme/ThemeContext.jsx'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const label = theme === 'dark' ? t('Switch to light mode') : t('Switch to dark mode')
  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button type="button" className={`theme-toggle ${className}`} onClick={toggleTheme} aria-label={label} title={label}>
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', visualDuration: 0.25, bounce: 0.3 }}
        >
          <Icon size={19} />
        </m.span>
      </AnimatePresence>
    </button>
  )
}
