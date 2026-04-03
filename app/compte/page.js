'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { buildDisplayName, getInitials } from '../../lib/profile-utils'
import { getSiteUrl } from '../../lib/site-url'

export default function ComptePage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (user) refreshProfile?.()
  }, [user, refreshProfile])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMsg({ type: '', text: '' })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg({ type: 'error', text: error.message })
    else setMsg({ type: 'success', text: 'Connexion réussie !' })
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!username.trim()) {
      setMsg({ type: 'error', text: 'Le nom d’utilisateur est requis.' })
      return
    }

    setLoading(true)
    setMsg({ type: '', text: '' })

    const redirectTo = `${getSiteUrl()}/compte`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { username: username.trim() },
      },
    })

    if (error) {
      setMsg({ type: 'error', text: error.message })
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.trim(),
      })
    }

    setMsg({ type: 'success', text: 'Compte créé ! Vérifiez votre email pour confirmer votre inscription.' })
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setMsg({ type: 'success', text: 'Vous êtes déconnecté(e).' })
  }

  const displayName = buildDisplayName(profile, user)
  const initials = getInitials(profile, user)

  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--ink-3)' }}>
      Chargement…
    </div>
  )

  return (
    <>
      <style>{`
        .compte-page { min-height: 80vh; display: flex; flex-direction: column; }
        .compte-hero { background: var(--green-800); color: white; padding: 48px 24px 72px; text-align: center; }
        .compte-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold-400); margin-bottom: 12px; }
        .compte-title { font-family: var(--font-display); font-size: clamp(26px, 4vw, 40px); font-weight: 400; line-height: 1.15; letter-spacing: -0.02em; }
        .compte-title em { font-style: italic; color: var(--gold-400); }
        .compte-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 16px 56px; margin-top: -40px; }
        .compte-card { background: var(--white); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 32px; width: 100%; max-width: 460px; animation: fadeUp .5s ease both; }
        .auth-tabs { display: flex; border-radius: var(--radius-md); overflow: hidden; border: 1.5px solid var(--paper-2); margin-bottom: 24px; }
        .auth-tab { flex: 1; padding: 11px; font-family: var(--font-body); font-size: 14px; font-weight: 600; border: none; background: var(--paper); color: var(--ink-3); cursor: pointer; transition: all .15s; }
        .auth-tab.active { background: var(--green-700); color: white; }
        .f-label { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 6px; }
        .f-field { margin-bottom: 16px; }
        .f-input { width: 100%; padding: 12px 14px; font-family: var(--font-body); font-size: 15px; color: var(--ink); background: var(--paper); border: 1.5px solid var(--paper-2); border-radius: var(--radius-md); outline: none; transition: border-color .2s, box-shadow .2s; }
        .f-input:focus { border-color: var(--green-500); box-shadow: 0 0 0 3px rgba(46,154,92,0.12); background: var(--white); }
        .f-input::placeholder { color: var(--ink-4); }
        .f-btn { width: 100%; padding: 14px; font-family: var(--font-body); font-size: 15px; font-weight: 600; color: white; background: var(--green-700); border: none; border-radius: var(--radius-md); cursor: pointer; transition: background .15s; margin-top: 4px; }
        .f-btn:hover:not(:disabled) { background: var(--green-800); }
        .f-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .f-link { margin-top: 10px; font-size: 13px; color: var(--green-700); text-decoration: none; display: inline-block; }
        .f-hint { font-size: 12px; color: var(--ink-4); margin-top: 6px; line-height: 1.5; }
        .msg { padding: 12px 16px; border-radius: var(--radius-md); font-size: 14px; margin-bottom: 16px; }
        .msg.error { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }
        .msg.success { background: var(--green-50); border: 1px solid var(--green-200); color: var(--green-700); }
        .profile-header { text-align: center; margin-bottom: 24px; }
        .profile-avatar { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; background: var(--green-700); color: white; font-size: 28px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-family: var(--font-display); }
        .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-name { font-family: var(--font-display); font-size: 22px; font-weight: 500; color: var(--ink); }
        .profile-email { font-size: 13px; color: var(--ink-3); margin-top: 4px; }
        .profile-info { font-size: 12px; color: var(--ink-4); margin-top: 6px; }
        .profile-links { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
        .profile-link-btn { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: var(--paper); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); border: 1.5px solid var(--paper-2); transition: border-color .15s, background .15s; font-size: 14px; font-weight: 500; }
        .profile-link-btn:hover { border-color: var(--green-300); background: var(--green-50); }
        .premium-pill { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #F3E8FF; color: #7C3AED; border: 1px solid #D8B4FE; }
        .logout-btn { width: 100%; margin-top: 20px; padding: 12px; font-family: var(--font-body); font-size: 14px; font-weight: 500; background: var(--paper); color: var(--ink-2); border: 1.5px solid var(--paper-2); border-radius: var(--radius-md); cursor: pointer; transition: background .15s; }
        .logout-btn:hover { background: #FEF2F2; border-color: #FECACA; color: #991B1B; }
      `}</style>

      <div className="compte-page">
        <section className="compte-hero">
          <p className="compte-eyebrow">🔑 Espace personnel</p>
          <h1 className="compte-title">Mon <em>compte</em></h1>
        </section>

        <div className="compte-body">
          <div className="compte-card">
            {!user && (
              <>
                <div className="auth-tabs">
                  <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setMsg({ type: '', text: '' }) }}>
                    Connexion
                  </button>
                  <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setMsg({ type: '', text: '' }) }}>
                    Créer un compte
                  </button>
                </div>

                {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}

                {tab === 'login' ? (
                  <form onSubmit={handleLogin}>
                    <div className="f-field">
                      <div className="f-label">Adresse email</div>
                      <input className="f-input" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="f-field">
                      <div className="f-label">Mot de passe</div>
                      <input className="f-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <button className="f-btn" type="submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
                    <Link href="/reset-password" className="f-link">Mot de passe oublié ?</Link>
                  </form>
                ) : (
                  <form onSubmit={handleRegister}>
                    <div className="f-field">
                      <div className="f-label">Nom d'utilisateur</div>
                      <input className="f-input" type="text" placeholder="Ex : amadou_bah" value={username} onChange={e => setUsername(e.target.value)} required />
                      <p className="f-hint">Votre pseudo visible sur le forum</p>
                    </div>
                    <div className="f-field">
                      <div className="f-label">Adresse email</div>
                      <input className="f-input" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="f-field">
                      <div className="f-label">Mot de passe</div>
                      <input className="f-input" type="password" placeholder="Minimum 6 caractères" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <button className="f-btn" type="submit" disabled={loading}>{loading ? 'Création…' : 'Créer mon compte'}</button>
                  </form>
                )}
              </>
            )}

            {user && (
              <>
                {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
                <div className="profile-header">
                  <div className="profile-avatar">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" /> : initials}
                  </div>
                  <div className="profile-name">{displayName}</div>
                  <div className="profile-email">{user.email}</div>
                  <div className="profile-info">Compte créé le {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : '—'}</div>
                </div>

                <div className="profile-links">
                  <Link href="/profil" className="profile-link-btn">
                    <span>👤 Modifier mon profil</span>
                    <span>→</span>
                  </Link>
                  <Link href="/reset-password" className="profile-link-btn">
                    <span>🔐 Changer mon mot de passe</span>
                    <span>→</span>
                  </Link>
                  <Link href="/premium/success" className="profile-link-btn">
                    <span>⭐ Mon abonnement</span>
                    {profile?.is_premium ? <span className="premium-pill">Premium actif</span> : <span>→</span>}
                  </Link>
                </div>

                <button className="logout-btn" onClick={handleLogout}>Se déconnecter</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
