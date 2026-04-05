'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabaseClient'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(Boolean(session))
    })
  }, [supabase])

  async function handleSubmit(event) {
    event.preventDefault()
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' })
      return
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMessage({ type: 'error', text: error.message })
    else {
      setMessage({ type: 'success', text: 'Mot de passe mis à jour. Vous pouvez maintenant vous reconnecter.' })
      setTimeout(() => router.push('/login'), 1200)
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .up-page { min-height: 80vh; background: var(--paper); display:flex; align-items:center; justify-content:center; padding:24px; }
        .up-card { width:100%; max-width:460px; background:white; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding:30px; }
        .up-title { font-family: var(--font-display); font-size: 30px; margin-bottom: 8px; color: var(--ink); }
        .up-sub { color: var(--ink-3); font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
        .field label { display:block; font-size:12px; font-weight:700; letter-spacing:.08em; color:var(--ink-3); text-transform:uppercase; margin-bottom:8px; }
        .input { width:100%; padding:12px 14px; border-radius:12px; border:1.5px solid var(--paper-2); background:var(--paper); margin-bottom:14px; }
        .btn { width:100%; padding:13px; border:none; border-radius:12px; background:var(--green-700); color:white; font-weight:700; cursor:pointer; }
        .msg { margin-bottom: 14px; padding: 12px 14px; border-radius: 12px; font-size: 14px; }
        .msg.success { background: var(--green-50); border:1px solid var(--green-200); color: var(--green-700); }
        .msg.error { background: #FEF2F2; border:1px solid #FECACA; color:#991B1B; }
      `}</style>
      <div className="up-page">
        <div className="up-card">
          <h1 className="up-title">Nouveau mot de passe</h1>
          <p className="up-sub">Choisissez un nouveau mot de passe sécurisé pour votre compte BAC Mali.</p>
          {!ready && <div className="msg error">Ouvrez cette page depuis le lien reçu par email.</div>}
          {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Nouveau mot de passe</label>
              <input className="input" type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="field">
              <label>Confirmer le mot de passe</label>
              <input className="input" type="password" minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button className="btn" type="submit" disabled={!ready || loading}>{loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}</button>
          </form>
        </div>
      </div>
    </>
  )
}
