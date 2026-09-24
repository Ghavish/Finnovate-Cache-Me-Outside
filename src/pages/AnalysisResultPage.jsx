import { ArrowRight, CheckCircle2, CircleDollarSign, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { readN8n } from '../firebase/apiClient.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { k } from '../i18n/strings.js'
import { moneyFromCents } from '../utils/money.js'

export default function AnalysisResultPage() {
  const saved = useLocation().state
  const { t } = useLanguage()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    readN8n({ inputType: 'getDashboard' })
      .then(setDashboard)
      .catch((err) => {
        console.error('Dashboard load failed:', err)
        setError(k('Your data was saved, but the latest figures could not be loaded.'))
      })
  }, [])

  const value = (render) => (dashboard ? render(dashboard) : error ? '—' : '…')
  const savedText = saved?.count
    ? (saved.count === 1 ? t('{count} entry saved, {amount} in total.', { count: 1, amount: moneyFromCents(saved.totalCents) }) : t('{count} entries saved, {amount} in total.', { count: saved.count, amount: moneyFromCents(saved.totalCents) }))
    : t('Your entries were saved.')

  return <main className="main-content result-page">
    <section className="page-heading"><span className="eyebrow">{t('ANALYSIS COMPLETE')}</span><h1>{t('Your financial picture is updated')}</h1><p>{t('These figures come straight from your saved data.')}</p></section>
    <section className="result-banner"><CheckCircle2 size={28} /><div><strong>{t('Data added successfully')}</strong><p>{savedText}{saved?.docType === 'payslip' ? ` ${t('Your monthly salary was updated from the payslip.')}` : ''}</p></div></section>
    {error && <p className="form-error">{t(error)}</p>}
    <section className="result-grid"><article><CircleDollarSign /><small>{t('Monthly salary')}</small><strong>{value((d) => moneyFromCents(d.salaryCents))}</strong></article><article><CircleDollarSign /><small>{t('Monthly expenses')}</small><strong>{value((d) => moneyFromCents(d.monthlyRoutineCents))}</strong></article><article className="highlight"><ShieldCheck /><small>{t('Safe saving capacity')}</small><strong>{value((d) => moneyFromCents(d.safeSavingCapacityCents))}</strong></article></section>
    <section className="result-explanation"><h2>{t('What this means')}</h2><p>{t('Safe saving capacity is your monthly salary minus your monthly expenses. Monthly expenses are the total of the expense summary on your Financial Overview. Until you add one, MoBudget estimates them from expenses that repeat across months. This value is used when you analyse a new goal.')}</p></section>
    <div className="result-actions"><Link className="secondary-link" to="/input-data">{t('Add more data')}</Link><Link className="primary-link" to="/goals/new">{t('Continue to goals')} <ArrowRight size={18} /></Link></div>
  </main>
}
