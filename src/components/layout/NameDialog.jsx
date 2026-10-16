import { LoaderCircle, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { updateName } from '../../firebase/authService.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { k } from '../../i18n/strings.js'

const MAX_NAME_LENGTH = 40

// Lets a signed-in user set or change the name used in the greeting and the header.
export default function NameDialog({ onClose }) {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()
  const [name, setName] = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(event) {
    event.preventDefault()
    if (!name.trim()) return setError(k('Enter your name.'))
    setSaving(true); setError('')
    try {
      await updateName(name)
      refreshUser()
      onClose()
    } catch (err) {
      console.error('Name save failed:', err)
      setError(k('Could not save your name. Try again.'))
      setSaving(false)
    }
  }

  return <div className="modal-backdrop"><form className="risk-modal name-modal" role="dialog" aria-modal="true" aria-labelledby="name-title" onSubmit={save}>
    <button type="button" className="modal-close" onClick={onClose} aria-label={t('Close')}><X size={20} /></button>
    <div className="modal-kicker"><UserRound size={16} />{t('Profile')}</div>
    <h2 id="name-title">{t('Your name')}</h2>
    <p>{t('MoBudget uses it to greet you.')}</p>
    <label className="name-field"><span>{t('Your name')}</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX_NAME_LENGTH} autoComplete="given-name" autoFocus /></label>
    {error && <p className="form-error">{t(error)}</p>}
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('Cancel')}</button><button className="primary-button" disabled={saving}>{saving && <LoaderCircle className="spinner" size={18} />}{saving ? t('Saving…') : t('Save')}</button></div>
  </form></div>
}
