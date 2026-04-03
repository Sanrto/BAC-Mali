'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { buildDisplayName, getInitials, uploadAvatar } from '../../lib/profile-utils'

export default function ProfilPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!authLoading && !user) router.replace('/compte')
  }, [authLoading, user, router])

  useEffect(() => {
    setFirstName(profile?.first_name ?? '')
    setLastName(profile?.last_name ?? '')
    setUsername(profile?.username ?? '')
    setPreview(profile?.avatar_url ?? '')
  }, [profile])

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
  }, [preview])

  const displayName = useMemo(() => buildDisplayName(profile, user), [profile, user])
  const initials = useMemo(() => getInitials(profile, user), [profile, user])

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Choisissez une image valide.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La photo doit faire moins de 2 Mo.' })
      return
    }
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
    setMessage({ type: '', text: '' })
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      let avatarUrl = profile?.avatar_url ?? null
      if (avatarFile) {
        const uploaded = await uploadAvatar(user.id, avatarFile)
        avatarUrl = uploaded.publicUrl
      }

      const payload = {
        id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        username: username.trim() || user.email?.split('@')[0] || 'utilisateur',
        avatar_url: avatarUrl,
      }

      const { error } = await supabase.from('profiles').upsert(payload)
      if (error) throw error

      await refreshProfile?.()
      setAvatarFile(null)
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Impossible de sauvegarder le profil.' })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !user) return null

  return (
    <>
      <style>{`
        .profile-page { min-height: 80vh; background: var(--paper); }
        .profile-hero { background: var(--green-800); color: white; padding: 48px 24px 82px; text-align: center; }
        .profile-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--gold-400); margin-bottom: 10px; }
        .profile-title { font-family: var(--font-display); font-size: clamp(28px, 4vw, 42px); font-weight: 400; }
        .profile-title em { font-style: italic; color: var(--gold-400); }
        .profile-wrap { max-width: 860px; margin: -42px auto 0; padding: 0 16px 72px; }
        .profile-grid { display: grid; grid-template-columns: 320px 1fr; gap: 18px; }
        .card { background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 24px; }
        .hero-card { text-align: center; }
        .avatar-shell { width: 112px; height: 112px; border-radius: 50%; overflow: hidden; background: var(--green-700); color: white; font-size: 38px; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); }
        .avatar-shell img { width: 100%; height: 100%; object-fit: cover; }
        .name { font-family: var(--font-display); font-size: 24px; color: var(--ink); }
        .muted { color: var(--ink-3); font-size: 13px; margin-top: 4px; }
        .premium { margin-top: 12px; display: inline-flex; padding: 6px 12px; border-radius: 999px; background: #F3E8FF; color: #7C3AED; border: 1px solid #D8B4FE; font-size: 12px; font-weight: 700; }
        .field { margin-bottom: 16px; }
        .field label { display:block; font-size: 12px; font-weight: 700; letter-spacing: .08em; color: var(--ink-3); text-transform: uppercase; margin-bottom: 8px; }
        .input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid var(--paper-2); background: var(--paper); font-size: 15px; color: var(--ink); outline: none; }
        .input:focus { border-color: var(--green-500); background: white; }
        .actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { padding: 12px 16px; border-radius: 12px; border: none; cursor: pointer; font-weight: 700; font-size: 14px; }
        .btn.primary { background: var(--green-700); color: white; }
        .btn.secondary { background: white; border: 1.5px solid var(--paper-2); color: var(--ink-2); text-decoration: none; }
        .msg { padding: 12px 14px; border-radius: 12px; font-size: 14px; margin-bottom: 16px; }
        .msg.success { background: var(--green-50); border: 1px solid var(--green-200); color: var(--green-700); }
        .msg.error { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }
        .upload-note { font-size: 12px; color: var(--ink-4); margin-top: 8px; }
        @media (max-width: 820px) { .profile-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="profile-page">
        <section className="profile-hero">
          <p className="profile-eyebrow">👤 Compte utilisateur</p>
          <h1 className="profile-title">Mon <em>profil</em></h1>
        </section>

        <div className="profile-wrap">
          <div className="profile-grid">
            <aside className="card hero-card">
              <div className="avatar-shell">
                {preview ? <img src={preview} alt="Avatar" /> : initials}
              </div>
              <div className="name">{displayName}</div>
              <div className="muted">{user.email}</div>
              {profile?.is_premium && <div className="premium">⭐ Premium actif</div>}
              <div className="upload-note" style={{ marginTop: 18 }}>
                Votre photo sera stockée dans Supabase Storage.
              </div>
            </aside>

            <section className="card">
              {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}
              <form onSubmit={handleSave}>
                <div className="field">
                  <label>Prénom</label>
                  <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ex : Aïcha" />
                </div>
                <div className="field">
                  <label>Nom</label>
                  <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Ex : Traoré" />
                </div>
                <div className="field">
                  <label>Nom d'utilisateur</label>
                  <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Pseudo forum" />
                </div>
                <div className="field">
                  <label>Photo de profil</label>
                  <input className="input" type="file" accept="image/*" onChange={handleAvatarChange} />
                  <div className="upload-note">JPEG/PNG/WebP, max 2 Mo.</div>
                </div>
                <div className="actions">
                  <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Sauvegarde…' : 'Sauvegarder'}</button>
                  <Link href="/compte" className="btn secondary">Retour au compte</Link>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
