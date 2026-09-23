import { Bot, Send } from 'lucide-react'
import { useState } from 'react'
import { useAppData } from '../state/AppDataContext.jsx'

export default function AICoachPage() {
  const { data } = useAppData()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(`You currently have ${data.goals.length} active goals. Your demo safe saving capacity is Rs ${data.safeSavingCapacity.toLocaleString('en-MU')} per month.`)
  function ask(event) { event.preventDefault(); if (!question.trim()) return; setAnswer('For this demo, protect essential expenses first, then compare the monthly amount required by each goal with your safe saving capacity.'); setQuestion('') }
  return <main className="main-content"><section className="page-heading"><span className="eyebrow">AI COACH</span><h1>Ask about your plan</h1><p>This standalone assistant uses the same saved demo data as the other screens.</p></section><section className="coach-card"><Bot size={28} /><div className="coach-answer">{answer}</div><form onSubmit={ask}><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Can I afford another goal?" /><button type="submit" aria-label="Send"><Send size={19} /></button></form></section></main>
}
