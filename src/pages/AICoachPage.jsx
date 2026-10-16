import { Bot, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { askCoach, peekRead, readN8n } from '../firebase/apiClient.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { moneyFromCents } from '../utils/money.js'

const DASHBOARD = { inputType: 'getDashboard' }

export default function AICoachPage() {
  const { t } = useLanguage()
  const [dashboard, setDashboard] = useState(() => peekRead(DASHBOARD) ?? null)
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // --- Intro line from the user's real numbers ---
  useEffect(() => {
    readN8n(DASHBOARD).then(setDashboard).catch((err) => console.error('Coach intro failed:', err))
  }, [])

  // --- Ask the coach ---
  async function ask(event) {
    event.preventDefault()
    const text = question.trim()
    if (!text || loading) return
    setAsked(text)
    setQuestion('')
    setAnswer('')
    setError(false)
    setLoading(true)
    try {
      const reply = await askCoach(text)
      setAnswer(reply.answer || '')
      if (!reply.answer) setError(true)
    } catch (err) {
      console.error('Coach request failed:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const intro = dashboard
    ? t('You have {count} active goals and can safely save about {amount} a month.', { count: dashboard.activeGoals, amount: moneyFromCents(dashboard.safeSavingCapacityCents) })
    : t('Ask me about your money, your goals, or whether you can afford something.')

  // --- Output ---
  let body = intro
  if (loading) body = <span className="coach-thinking"><Loader2 size={18} className="spinner" /> {t('Thinking…')}</span>
  else if (error) body = t('The coach could not answer right now. Try again.')
  else if (answer) body = answer

  return <main className="main-content coach-page">
    <div className={`coach-orb ${loading ? 'thinking' : ''}`} aria-hidden="true" />
    <section className="page-heading"><span className="eyebrow">{t('AI COACH')}</span><h1>{t('Ask about your plan')}</h1><p>{t('The coach answers from your own salary, expenses and goals.')}</p></section>
    <section className="coach-card">
      <div className="coach-thread">
        {asked && <p className="coach-question"><b>{t('You asked')}:</b> {asked}</p>}
        <div className="coach-reply"><span className="coach-avatar"><Bot size={20} /></span><div className="coach-answer" aria-live="polite">{body}</div></div>
      </div>
      <form onSubmit={ask}><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('Can I afford another goal?')} disabled={loading} aria-label={t('Can I afford another goal?')} /><button type="submit" aria-label={t('Send')} disabled={loading}><Send size={19} /></button></form>
    </section>
  </main>
}
