import { Bot, Send } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { useAppData } from '../state/AppDataContext.jsx'

export default function AICoachPage() {
  const { data } = useAppData()
  const { t } = useLanguage()
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState(false)
  const intro = t('You currently have {count} active goals. Your demo safe saving capacity is {amount} per month.', { count: data.goals.length, amount: `Rs ${data.safeSavingCapacity.toLocaleString('en-MU')}` })
  function ask(event) { event.preventDefault(); if (!question.trim()) return; setAsked(true); setQuestion('') }
  return <main className="main-content"><section className="page-heading"><span className="eyebrow">{t('AI COACH')}</span><h1>{t('Ask about your plan')}</h1><p>{t('This standalone assistant uses the same saved demo data as the other screens.')}</p></section><section className="coach-card"><Bot size={28} /><div className="coach-answer">{asked ? t('For this demo, protect essential expenses first, then compare the monthly amount required by each goal with your safe saving capacity.') : intro}</div><form onSubmit={ask}><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('Can I afford another goal?')} /><button type="submit" aria-label={t('Send')}><Send size={19} /></button></form></section></main>
}
