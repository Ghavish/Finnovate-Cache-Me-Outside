import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGES, translateText } from './strings.js'

const LanguageContext = createContext(null)

function translateElement(element, language) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)

  nodes.forEach((node) => {
    const parent = node.parentElement
    if (!parent || ['SCRIPT', 'STYLE'].includes(parent.tagName)) return
    if (!node.__goalPathEnglish) node.__goalPathEnglish = node.nodeValue
    const source = node.__goalPathEnglish
    const translated = translateText(language, source)
    if (node.nodeValue !== translated) node.nodeValue = translated
  })

  element.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((input) => {
    if (!input.dataset.englishPlaceholder) input.dataset.englishPlaceholder = input.placeholder
    input.placeholder = translateText(language, input.dataset.englishPlaceholder)
  })
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('goalpath-language') || 'en')

  useEffect(() => {
    localStorage.setItem('goalpath-language', language)
    document.documentElement.lang = language

    const apply = () => translateElement(document.body, language)
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, languages: LANGUAGES, t: (text) => translateText(language, text) }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider')
  return value
}
