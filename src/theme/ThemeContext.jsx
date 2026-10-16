/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'mobudget-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

// A saved choice wins; otherwise follow the device. index.html runs the same check before React loads.
function savedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage blocked: fall back to the device setting */ }
  return null
}

const deviceTheme = () => (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')

export function ThemeProvider({ children }) {
  const [chosen, setChosen] = useState(savedTheme)
  const [device, setDevice] = useState(deviceTheme)
  const theme = chosen || device

  // Keep following the device while the user has not picked a theme.
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const update = () => setDevice(query.matches ? 'dark' : 'light')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#070B10' : '#F4F7F8')
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setChosen(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* private mode: keep it for this visit only */ }
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
