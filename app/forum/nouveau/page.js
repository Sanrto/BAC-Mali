'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getSupabaseBrowserConfigError,
  getSupabaseClient,
  isSupabaseConfigured,
} from '../../../lib/supabaseClient'
import { createForumPost, FORUM_CATEGORIES } from '../../../lib/forum-client'
import { useAuth } from '../../contexts/AuthContext'

const FORM_CATEGORIES = FORUM_CATEGORIES.filter((item) => item !== 'Toutes')

export default function NouveauPostPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const forumReady = isSupabaseConfigured()
  const { user, loading: authLoading } = useAuth()

  const [titre, setTitre] = useState('')
  const [body, setBody] = useState('')
  const [categorie, setCategorie] = useState('Orientation')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, router, user])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!supabase) {
      setError(getSupabaseBrowserConfigError())
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createForumPost(supabase, {
        userId: user.id,
        titre,
        body,
        categorie,
      })

      router.push(`/forum/${result.id}`)
    } catch (submitError) {
      setError(submitError.message || 'Impossible de publier la discussion.')
      setLoading(false)
    }
  }

  if (authLoading || !user) return null

  return (
    <>
      <style>{`
        .new-page {
          min-height: calc(100vh - 56px);
          background:
            radial-gradient(circle at top right, rgba(201,151,43,0.18), transparent 28%),
            linear-gradient(180deg, #133421 0%, #133421 22%, #F6F7F4 22%, #F7F8F5 100%);
        }
        .new-shell {
          max-width: 920px;
          margin: 0 auto;
          padding: 36px 16px 72px;
        }
        .hero {
          padding: 30px;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(15,47,27,0.96), rgba(24,91,52,0.92));
          color: white;
          box-shadow: var(--shadow-lg);
          margin-bottom: 18px;
        }
        .hero-eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--gold-400);
          margin-bottom: 10px;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(30px, 5vw, 46px);
          line-height: 1.04;
          letter-spacing: -0.03em;
          margin-bottom: 10px;
        }
        .hero-subtitle {
          color: rgba(255,255,255,0.78);
          line-height: 1.8;
          max-width: 620px;
        }
        .form-card {
          background: white;
          border-radius: 28px;
          box-shadow: var(--shadow-lg);
          padding: 26px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: var(--green-700);
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 18px;
        }
        .warning {
          padding: 14px 16px;
          border-radius: 18px;
          background: #FFF7ED;
          border: 1px solid #FED7AA;
          color: #9A3412;
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .field {
          margin-bottom: 18px;
        }
        .label {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .input,
        .textarea {
          width: 100%;
          padding: 14px 15px;
          border-radius: 16px;
          border: 1.5px solid var(--paper-2);
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-body);
          font-size: 15px;
          outline: none;
        }
        .input:focus,
        .textarea:focus {
          border-color: var(--green-500);
          background: white;
          box-shadow: 0 0 0 3px rgba(46,154,92,0.12);
        }
        .textarea {
          min-height: 180px;
          resize: vertical;
          line-height: 1.7;
        }
        .categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
        }
        .category-btn {
          padding: 14px 12px;
          border-radius: 18px;
          border: 1.5px solid var(--paper-2);
          background: white;
          color: var(--ink-3);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all .15s ease;
        }
        .category-btn.active {
          background: var(--green-50);
          border-color: var(--green-300);
          color: var(--green-700);
        }
        .tips {
          padding: 16px 18px;
          border-radius: 20px;
          background: var(--paper);
          border: 1px solid var(--paper-2);
          color: var(--ink-2);
          line-height: 1.7;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 160px;
          padding: 14px 18px;
          border-radius: 16px;
          border: 1.5px solid var(--paper-2);
          background: white;
          color: var(--ink);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }
        .btn.primary {
          background: linear-gradient(135deg, var(--green-700), #1E8A4A);
          border: none;
          color: white;
        }
      `}</style>

      <div className="new-page">
        <div className="new-shell">
          <div className="hero">
            <p className="hero-eyebrow">Forum BAC Mali</p>
            <h1 className="hero-title">Nouvelle discussion</h1>
            <p className="hero-subtitle">
              Décris clairement ton besoin pour aider la communauté à te répondre vite, même quand le forum tourne sur une ancienne structure de base de données.
            </p>
          </div>

          <Link href="/forum" className="back-link">← Retour au forum</Link>

          <div className="form-card">
            {!forumReady && (
              <div className="warning">
                La publication nécessite une configuration Supabase valide. {getSupabaseBrowserConfigError()}
              </div>
            )}

            {error && <div className="warning">{error}</div>}

            <div className="tips">
              Un bon message contient un titre précis, le contexte utile et ce que tu as déjà essayé. Cela améliore fortement la qualité des réponses.
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <div className="label">
                  <span>Catégorie</span>
                  <span>{categorie}</span>
                </div>
                <div className="categories">
                  {FORM_CATEGORIES.map((item) => (
                    <button
                      key={item}
                      className={`category-btn${categorie === item ? ' active' : ''}`}
                      onClick={() => setCategorie(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="label">
                  <span>Titre</span>
                  <span>{titre.length}/200</span>
                </div>
                <input
                  className="input"
                  type="text"
                  value={titre}
                  onChange={(event) => setTitre(event.target.value)}
                  placeholder="Ex : Comment faire une demande de bourse CENOU ?"
                  minLength={10}
                  maxLength={200}
                  required
                />
              </div>

              <div className="field">
                <div className="label">
                  <span>Description</span>
                  <span>{body.length}/5000</span>
                </div>
                <textarea
                  className="textarea"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Explique ton besoin, ton niveau, ta série et ce que tu as déjà essayé."
                  minLength={20}
                  maxLength={5000}
                  required
                />
              </div>

              <div className="actions">
                <button className="btn primary" type="submit" disabled={loading || !forumReady}>
                  {loading ? 'Publication...' : 'Publier la discussion'}
                </button>
                <Link href="/forum" className="btn">Annuler</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
