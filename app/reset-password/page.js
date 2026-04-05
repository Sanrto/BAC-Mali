'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { getSiteUrl } from '../../lib/site-url'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const supabase = getSupabaseClient()

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/update-password`,
    })

    if (error) setMessage({ type: 'error', text: error.message })
    else setMessage({ type: 'success', text: 'Email envoyé. Vérifiez votre boîte mail pour continuer.' })

    setLoading(false)
  }

  return (
    <>
      <style>{`
        .rp-page { min-height: 80vh; background: var(--paper); display:flex; align-items:center; justify-content:center; padding: 24px; }
        .rp-card { width:100%; max-width:460px; background:white; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 30px; }
        .rp-title { font-family: var(--font-display); font-size: 30px; margin-bottom: 8px; color: var(--ink); }
        .rp-sub { color: var(--ink-3); font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
        .field label { display:block; font-size:12px; font-weight:700; letter-spacing:.08em; color:var(--ink-3); text-transform:uppercase; margin-bottom:8px; }
        .input { width:100%; padding:12px 14px; border-radius:12px; border:1.5px solid var(--paper-2); background:var(--paper); }
        .btn { width:100%; padding:13px; border:none; border-radius:12px; background:var(--green-700); color:white; font-weight:700; cursor:pointer; margin-top:14px; }
        .msg { margin-bottom: 14px; padding: 12px 14px; border-radius: 12px; font-size: 14px; }
        .msg.success { background: var(--green-50); border:1px solid var(--green-200); color: var(--green-700); }
        .msg.error { background: #FEF2F2; border:1px solid #FECACA; color:#991B1B; }
        .rp-link { display:inline-block; margin-top:14px; color: var(--green-700); text-decoration:none; }
      `}</style>
      <div className="rp-page">
        <div className="rp-card">
          <h1 className="rp-title">Mot de passe oublié</h1>
          <p className="rp-sub">Entrez votre email. Supabase vous enverra un lien sécurisé pour créer un nouveau mot de passe.</p>
          {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" />
            </div>
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Envoi…' : 'Envoyer le lien'}</button>
          </form>
          <Link href="/login" className="rp-link">← Retour à la connexion</Link>
        </div>
      </div>
    </>
  )
}
