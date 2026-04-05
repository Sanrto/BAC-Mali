'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  getSupabaseBrowserConfigError,
  getSupabaseClient,
  isSupabaseConfigured,
} from '../../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { buildDisplayName, getInitials } from '../../lib/profile-utils'
import { getSiteUrl } from '../../lib/site-url'

function getTabFromPath(pathname) {
  if (pathname === '/signup') return 'register'
  return 'login'
}

export default function ComptePage() {
  const pathname = usePathname()
  const router = useRouter()
  const authReady = isSupabaseConfigured()
  const supabase = getSupabaseClient()

  const [tab, setTab] = useState(getTabFromPath(pathname))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const {
    user,
    profile,
    loading: authLoading,
    error: authError,
    refreshProfile,
  } = useAuth()

  useEffect(() => {
    setTab(getTabFromPath(pathname))
    const params = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()

    if (params.get('registered') === '1') {
      setMsg({
        type: 'success',
        text: 'Inscription terminée. Connectez-vous avec votre email et votre mot de passe.',
      })
      return
    }
    setMsg({ type: '', text: '' })
  }, [pathname])

  useEffect(() => {
    if (user) refreshProfile?.()
  }, [user, refreshProfile])

  useEffect(() => {
    if (!authLoading && user && (pathname === '/login' || pathname === '/signup')) {
      router.replace('/profile')
    }
  }, [authLoading, pathname, router, user])

  const uiCopy = useMemo(() => {
    if (pathname === '/signup') {
      return {
        eyebrow: 'Inscription',
        title: 'Créer un compte',
        subtitle: "Rejoins la communauté BAC Mali pour suivre ton profil et participer au forum.",
      }
    }

    if (pathname === '/login') {
      return {
        eyebrow: 'Connexion',
        title: 'Se connecter',
        subtitle: 'Retrouve ton espace personnel, ton profil et tes discussions en quelques secondes.',
      }
    }

    return {
      eyebrow: 'Espace personnel',
      title: 'Mon compte',
      subtitle: 'Connecte-toi, gère ton profil et accède rapidement au forum étudiant.',
    }
  }, [pathname])

  async function handleLogin(event) {
    event.preventDefault()

    if (!supabase) {
      setMsg({ type: 'error', text: getSupabaseBrowserConfigError() })
      return
    }

    setLoading(true)
    setMsg({ type: '', text: '' })

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMsg({ type: 'error', text: error.message })
      setLoading(false)
      return
    }

    await refreshProfile?.()
    setLoading(false)
    router.push('/profile')
  }

  async function handleRegister(event) {
    event.preventDefault()

    if (!supabase) {
      setMsg({ type: 'error', text: getSupabaseBrowserConfigError() })
      return
    }

    if (!username.trim()) {
      setMsg({ type: 'error', text: "Le nom d'utilisateur est requis." })
      return
    }

    setLoading(true)
    setMsg({ type: '', text: '' })

    const redirectTo = `${getSiteUrl()}/login`
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

    if (data.session) {
      await refreshProfile?.()
      setLoading(false)
      router.push('/profile')
      return
    }

    setMsg({
      type: 'success',
      text: 'Compte créé. Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.',
    })
    setLoading(false)
    router.push('/login?registered=1')
  }

  async function handleLogout() {
    if (!supabase) {
      setMsg({ type: 'error', text: getSupabaseBrowserConfigError() })
      return
    }

    await supabase.auth.signOut()
    setMsg({ type: 'success', text: 'Vous êtes déconnecté(e).' })
    router.push('/login')
  }

  const displayName = buildDisplayName(profile, user)
  const initials = getInitials(profile, user)

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--ink-3)' }}>
        Chargement...
      </div>
    )
  }

  const configMessage = authError || (!authReady ? getSupabaseBrowserConfigError() : '')

  return (
    <>
      <style>{`
        .compte-page {
          min-height: calc(100vh - 56px);
          background:
            radial-gradient(circle at top left, rgba(46,154,92,0.18), transparent 32%),
            linear-gradient(180deg, #0F2F1B 0%, #183D24 34%, #F4F7F2 34%, #F7F8F5 100%);
        }
        .compte-shell {
          max-width: 1080px;
          margin: 0 auto;
          padding: 42px 16px 72px;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(320px, 420px);
          gap: 24px;
          align-items: start;
        }
        .hero-card,
        .compte-card {
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(255,255,255,0.55);
          box-shadow: var(--shadow-lg);
          border-radius: 28px;
          backdrop-filter: blur(18px);
        }
        .hero-card {
          color: white;
          padding: 34px;
          background:
            linear-gradient(135deg, rgba(15,47,27,0.96), rgba(24,91,52,0.94)),
            radial-gradient(circle at top right, rgba(201,151,43,0.22), transparent 34%);
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--gold-400);
          margin-bottom: 14px;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 5vw, 50px);
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 14px;
        }
        .hero-subtitle {
          max-width: 520px;
          color: rgba(255,255,255,0.78);
          line-height: 1.8;
          font-size: 15px;
          margin-bottom: 24px;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .hero-stat {
          padding: 16px;
          border-radius: 18px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .hero-stat strong {
          display: block;
          font-family: var(--font-display);
          font-size: 22px;
          color: white;
          margin-bottom: 4px;
        }
        .hero-stat span {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          line-height: 1.5;
        }
        .hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 24px;
        }
        .hero-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 16px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          transition: transform .15s ease, background .15s ease, color .15s ease;
        }
        .hero-link.primary {
          background: var(--gold-400);
          color: var(--green-900);
        }
        .hero-link.secondary {
          background: rgba(255,255,255,0.08);
          color: white;
          border: 1px solid rgba(255,255,255,0.14);
        }
        .hero-link:hover { transform: translateY(-1px); }
        .compte-card {
          padding: 28px;
        }
        .auth-tabs {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 22px;
          background: var(--paper);
          padding: 6px;
          border-radius: 18px;
        }
        .auth-tab {
          padding: 12px;
          border: none;
          border-radius: 14px;
          background: transparent;
          color: var(--ink-4);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all .15s ease;
        }
        .auth-tab.active {
          background: white;
          color: var(--green-700);
          box-shadow: var(--shadow-sm);
        }
        .panel-title {
          font-family: var(--font-display);
          font-size: 26px;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .panel-subtitle {
          font-size: 14px;
          line-height: 1.7;
          color: var(--ink-3);
          margin-bottom: 20px;
        }
        .f-field { margin-bottom: 16px; }
        .f-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 7px;
        }
        .f-input {
          width: 100%;
          padding: 13px 14px;
          border-radius: 14px;
          border: 1.5px solid var(--paper-2);
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-body);
          font-size: 15px;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
        }
        .f-input:focus {
          border-color: var(--green-500);
          background: white;
          box-shadow: 0 0 0 3px rgba(46,154,92,0.12);
        }
        .f-hint {
          margin-top: 7px;
          font-size: 12px;
          color: var(--ink-4);
          line-height: 1.6;
        }
        .f-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--green-700), #1E8A4A);
          color: white;
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform .15s ease, opacity .15s ease;
        }
        .f-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .f-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .f-link,
        .inline-link {
          color: var(--green-700);
          text-decoration: none;
          font-weight: 600;
        }
        .f-link {
          display: inline-block;
          margin-top: 12px;
          font-size: 13px;
        }
        .msg {
          padding: 13px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .msg.error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #991B1B;
        }
        .msg.success {
          background: var(--green-50);
          border: 1px solid var(--green-200);
          color: var(--green-700);
        }
        .msg.warn {
          background: #FFF7ED;
          border: 1px solid #FED7AA;
          color: #9A3412;
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }
        .profile-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 28px;
          background: linear-gradient(135deg, var(--green-700), #1E8A4A);
          color: white;
          flex-shrink: 0;
        }
        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-name {
          font-family: var(--font-display);
          font-size: 22px;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .profile-email {
          color: var(--ink-3);
          font-size: 14px;
          margin-bottom: 6px;
        }
        .profile-meta {
          font-size: 12px;
          color: var(--ink-4);
        }
        .profile-links {
          display: grid;
          gap: 10px;
        }
        .profile-link-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 16px;
          border-radius: 18px;
          text-decoration: none;
          color: var(--ink);
          background: var(--paper);
          border: 1.5px solid var(--paper-2);
          transition: border-color .15s ease, transform .15s ease, background .15s ease;
        }
        .profile-link-btn:hover {
          border-color: var(--green-300);
          background: white;
          transform: translateY(-1px);
        }
        .profile-link-copy {
          display: grid;
          gap: 3px;
        }
        .profile-link-copy strong {
          font-size: 14px;
          color: var(--ink);
        }
        .profile-link-copy span {
          font-size: 12px;
          color: var(--ink-4);
        }
        .profile-pill {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          background: #F3E8FF;
          color: #7C3AED;
          border: 1px solid #D8B4FE;
        }
        .logout-btn {
          width: 100%;
          margin-top: 18px;
          padding: 12px 14px;
          border-radius: 16px;
          border: 1.5px solid #FECACA;
          background: #FEF2F2;
          color: #991B1B;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }
        @media (max-width: 900px) {
          .compte-shell {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 560px) {
          .hero-card,
          .compte-card {
            padding: 22px 18px;
            border-radius: 24px;
          }
          .hero-grid {
            grid-template-columns: 1fr;
          }
          .profile-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="compte-page">
        <div className="compte-shell">
          <section className="hero-card">
            <p className="hero-eyebrow">{uiCopy.eyebrow}</p>
            <h1 className="hero-title">{uiCopy.title}</h1>
            <p className="hero-subtitle">{uiCopy.subtitle}</p>

            <div className="hero-grid">
              <div className="hero-stat">
                <strong>Forum</strong>
                <span>Pose tes questions, aide les autres et suis les réponses en direct.</span>
              </div>
              <div className="hero-stat">
                <strong>Profil</strong>
                <span>Centralise ton pseudo, ton avatar et ton espace personnel.</span>
              </div>
              <div className="hero-stat">
                <strong>Premium</strong>
                <span>Débloque les options avancées et les messages vocaux.</span>
              </div>
            </div>

            <div className="hero-actions">
              <Link href="/forum" className="hero-link primary">Voir le forum</Link>
              <Link href="/orientation" className="hero-link secondary">Explorer l'orientation</Link>
            </div>
          </section>

          <section className="compte-card">
            {configMessage && (
              <div className="msg warn">
                L'authentification Supabase n'est pas disponible pour le moment. {configMessage}
              </div>
            )}

            {!user && (
              <>
                <div className="auth-tabs">
                  <button
                    className={`auth-tab${tab === 'login' ? ' active' : ''}`}
                    onClick={() => router.push('/login')}
                    type="button"
                  >
                    Connexion
                  </button>
                  <button
                    className={`auth-tab${tab === 'register' ? ' active' : ''}`}
                    onClick={() => router.push('/signup')}
                    type="button"
                  >
                    Inscription
                  </button>
                </div>

                <h2 className="panel-title">{tab === 'login' ? 'Connexion rapide' : 'Créer ton espace'}</h2>
                <p className="panel-subtitle">
                  {tab === 'login'
                    ? 'Connecte-toi pour retrouver ton profil et accéder aux discussions.'
                    : "Crée un compte pour participer au forum et sauvegarder ton identité étudiante."}
                </p>

                {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}

                {tab === 'login' ? (
                  <form onSubmit={handleLogin}>
                    <div className="f-field">
                      <label className="f-label">Adresse email</label>
                      <input
                        className="f-input"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                    <div className="f-field">
                      <label className="f-label">Mot de passe</label>
                      <input
                        className="f-input"
                        type="password"
                        placeholder="Minimum 6 caractères"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <button className="f-btn" type="submit" disabled={loading || !authReady}>
                      {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                    <Link href="/reset-password" className="f-link">Mot de passe oublié ?</Link>
                  </form>
                ) : (
                  <form onSubmit={handleRegister}>
                    <div className="f-field">
                      <label className="f-label">Nom d'utilisateur</label>
                      <input
                        className="f-input"
                        type="text"
                        placeholder="Ex : amadou_bah"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        required
                      />
                      <p className="f-hint">Ce pseudo sera visible sur le forum BAC Mali.</p>
                    </div>
                    <div className="f-field">
                      <label className="f-label">Adresse email</label>
                      <input
                        className="f-input"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                    <div className="f-field">
                      <label className="f-label">Mot de passe</label>
                      <input
                        className="f-input"
                        type="password"
                        placeholder="Minimum 6 caractères"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <button className="f-btn" type="submit" disabled={loading || !authReady}>
                      {loading ? 'Création du compte...' : 'Créer mon compte'}
                    </button>
                    <p className="f-hint">
                      Tu as déjà un compte ? <Link href="/login" className="inline-link">Connecte-toi ici</Link>.
                    </p>
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
                  <div>
                    <div className="profile-name">{displayName}</div>
                    <div className="profile-email">{user.email}</div>
                    <div className="profile-meta">
                      Compte créé le {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : '-'}
                    </div>
                  </div>
                </div>

                <div className="profile-links">
                  <Link href="/profile" className="profile-link-btn">
                    <div className="profile-link-copy">
                      <strong>Mon profil</strong>
                      <span>Modifier mon avatar, mon pseudo et mes informations.</span>
                    </div>
                    <span>→</span>
                  </Link>
                  <Link href="/forum" className="profile-link-btn">
                    <div className="profile-link-copy">
                      <strong>Forum étudiant</strong>
                      <span>Retrouver mes échanges et poser une nouvelle question.</span>
                    </div>
                    <span>→</span>
                  </Link>
                  <Link href="/premium/success" className="profile-link-btn">
                    <div className="profile-link-copy">
                      <strong>Abonnement</strong>
                      <span>Gérer l'accès Premium et les fonctionnalités avancées.</span>
                    </div>
                    {profile?.is_premium ? <span className="profile-pill">Premium actif</span> : <span>→</span>}
                  </Link>
                </div>

                <button className="logout-btn" onClick={handleLogout} type="button">
                  Se déconnecter
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
