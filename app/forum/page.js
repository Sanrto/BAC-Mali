'use client'

import { startTransition, useCallback, useDeferredValue, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getSupabaseBrowserConfigError,
  getSupabaseClient,
  isSupabaseConfigured,
} from '../../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { FORUM_CATEGORIES, getForumStats, listForumPosts } from '../../lib/forum-client'

const SORT_OPTIONS = [
  { key: 'recent', label: 'Récents' },
  { key: 'popular', label: 'Populaires' },
  { key: 'unanswered', label: 'Sans réponse' },
]

const CATEGORY_COLORS = {
  Orientation: '#2563EB',
  Cours: '#7C3AED',
  Examen: '#DC2626',
  Université: '#0891B2',
  Bourse: '#D97706',
  Conseils: '#059669',
  Autres: '#6B7280',
}

// ─── Variants ────────────────────────────────────────────────
const heroVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const heroItem = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
}
const slideFromRight = {
  hidden: { opacity: 0, x: 32 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 240, damping: 24, delay: 0.15 } },
}
const postListStagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const postCardVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18 } },
}
const pillVariant = {
  tap: { scale: 0.93 },
}

// ─── Helpers ─────────────────────────────────────────────────
function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diff / 60000))
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days} j`
  return new Date(value).toLocaleDateString('fr-FR')
}

function avatarUrl(username) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username ?? 'U')}&backgroundColor=145a30&textColor=ffffff&fontSize=38`
}

function PostCard({ post }) {
  const categoryColor = CATEGORY_COLORS[post.categorie] ?? CATEGORY_COLORS.Autres
  const excerpt = post.body?.length > 150 ? `${post.body.slice(0, 150)}...` : post.body

  return (
    <motion.div variants={postCardVariant} whileHover={{ y: -3, transition: { duration: 0.18 } }}>
      <Link href={`/forum/${post.id}`} className="post-card">
        <div className="post-top">
          <div className="post-meta-left">
            <span className="post-category" style={{ color: categoryColor, borderColor: `${categoryColor}30`, background: `${categoryColor}12` }}>
              {post.categorie}
            </span>
            {post.is_resolved && <span className="post-resolved">Résolu</span>}
          </div>
          <span className="post-time">{timeAgo(post.created_at)}</span>
        </div>

        <h3 className="post-title">{post.titre}</h3>
        {excerpt ? <p className="post-excerpt">{excerpt}</p> : null}

        <div className="post-footer">
          <div className="post-author">
            <img src={post.avatar_url ?? avatarUrl(post.username)} alt="" className="post-avatar" />
            <div>
              <strong>{post.username}</strong>
              <span>{post.reputation || 0} pts</span>
            </div>
          </div>
          <div className="post-stats">
            <span>{post.comments_count} messages</span>
            <span>{post.votes_score} score</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ForumPage() {
  const supabase = getSupabaseClient()
  const forumReady = isSupabaseConfigured()
  const { user, loading: authLoading } = useAuth()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ posts: 0, members: 0 })
  const [category, setCategory] = useState('Toutes')
  const [sort, setSort] = useState('recent')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [forumMode, setForumMode] = useState('')

  const deferredSearch = useDeferredValue(search)

  const loadPosts = useCallback(async (reset = true, startFrom = 0) => {
    if (!supabase) { setLoading(false); return }
    setLoading(true); setError('')
    try {
      const result = await listForumPosts(supabase, { category, sort, search: deferredSearch, offset: startFrom, limit: 12 })
      startTransition(() => {
        setForumMode(result.mode)
        setPosts((current) => (reset ? result.posts : [...current, ...result.posts]))
        setHasMore(result.hasMore)
        setOffset(result.nextOffset)
      })
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger le forum.')
    } finally {
      setLoading(false)
    }
  }, [category, deferredSearch, sort, supabase])

  useEffect(() => { loadPosts(true, 0) }, [loadPosts])

  useEffect(() => {
    if (!supabase) return
    let active = true
    getForumStats(supabase)
      .then((data) => { if (active) { setStats({ posts: data.posts, members: data.members }); setForumMode((c) => c || data.mode) } })
      .catch(() => {})
    return () => { active = false }
  }, [supabase])

  return (
    <>
      <style>{`
        .forum-page {
          min-height: calc(100vh - 56px);
          background:
            radial-gradient(circle at top left, rgba(46,154,92,0.14), transparent 30%),
            linear-gradient(180deg, #11331F 0%, #11331F 26%, #F5F7F3 26%, #F7F8F5 100%);
        }
        .forum-shell { max-width: 1120px; margin: 0 auto; padding: 36px 16px 72px; }
        .hero { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 20px; margin-bottom: 22px; }
        .hero-card, .panel { border-radius: 28px; box-shadow: var(--shadow-lg); }
        .hero-card {
          padding: 30px; color: white;
          background:
            radial-gradient(circle at top right, rgba(201,151,43,0.25), transparent 34%),
            linear-gradient(135deg, rgba(15,47,27,0.96), rgba(24,91,52,0.92));
        }
        .hero-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold-400); margin-bottom: 12px; }
        .hero-title { font-family: var(--font-display); font-size: clamp(34px, 6vw, 54px); line-height: 1.02; letter-spacing: -0.03em; margin-bottom: 12px; }
        .hero-subtitle { max-width: 620px; color: rgba(255,255,255,0.76); line-height: 1.8; font-size: 15px; margin-bottom: 24px; }
        .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .hero-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 11px 16px; border-radius: 999px; text-decoration: none;
          font-size: 13px; font-weight: 700;
        }
        .hero-btn.primary { background: var(--gold-400); color: var(--green-900); }
        .hero-btn.secondary { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.14); }
        .hero-side { padding: 22px; background: white; }
        .hero-side-grid { display: grid; gap: 12px; }
        .hero-stat { padding: 16px; border-radius: 20px; background: var(--paper); border: 1px solid var(--paper-2); }
        .hero-stat strong { display: block; font-family: var(--font-display); font-size: 26px; color: var(--green-700); margin-bottom: 4px; }
        .hero-stat span { font-size: 12px; color: var(--ink-3); line-height: 1.6; }
        .forum-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 20px; align-items: start; }
        .panel { background: white; padding: 22px; }
        .toolbar { display: grid; gap: 14px; margin-bottom: 18px; }
        .toolbar-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .search {
          flex: 1; min-width: 220px; padding: 13px 14px;
          border-radius: 16px; border: 1.5px solid var(--paper-2);
          background: var(--paper); font-family: var(--font-body); font-size: 15px; color: var(--ink); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search:focus { border-color: var(--green-500); background: white; box-shadow: 0 0 0 3px rgba(46,154,92,0.12); }
        .toolbar-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 12px 16px; border-radius: 16px; text-decoration: none;
          font-size: 14px; font-weight: 700; border: 1.5px solid var(--paper-2); background: white; color: var(--ink);
        }
        .toolbar-btn.primary { background: linear-gradient(135deg, var(--green-700), #1E8A4A); color: white; border: none; }
        .categories, .sorts { display: flex; gap: 8px; flex-wrap: wrap; }
        .pill {
          padding: 9px 13px; border-radius: 999px; border: 1.5px solid var(--paper-2);
          background: white; color: var(--ink-3); font-size: 13px; font-weight: 700; cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .pill:hover, .pill.active { background: var(--green-50); border-color: var(--green-300); color: var(--green-700); }
        .mode-pill { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
        .post-list { display: grid; gap: 12px; }
        .post-card {
          display: block; padding: 18px; border-radius: 22px; text-decoration: none; color: inherit;
          border: 1.5px solid var(--paper-2); background: linear-gradient(180deg, #FFFFFF 0%, #FBFDFB 100%);
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .post-card:hover { border-color: var(--green-300); box-shadow: var(--shadow-sm); }
        .post-top, .post-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .post-meta-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .post-category, .post-resolved { display: inline-flex; align-items: center; justify-content: center; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; border: 1px solid transparent; }
        .post-resolved { color: #166534; background: #DCFCE7; border-color: #BBF7D0; }
        .post-time { font-size: 12px; color: var(--ink-4); }
        .post-title { font-size: 19px; line-height: 1.35; color: var(--ink); margin: 12px 0 8px; }
        .post-excerpt { color: var(--ink-3); font-size: 14px; line-height: 1.7; margin-bottom: 16px; }
        .post-author { display: flex; align-items: center; gap: 10px; }
        .post-author strong { display: block; color: var(--ink); font-size: 14px; }
        .post-author span { font-size: 12px; color: var(--ink-4); }
        .post-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid var(--paper-2); }
        .post-stats { display: flex; gap: 12px; flex-wrap: wrap; color: var(--ink-4); font-size: 12px; }
        .empty, .warning { padding: 18px; border-radius: 20px; font-size: 14px; line-height: 1.7; }
        .empty { background: var(--paper); color: var(--ink-3); border: 1px solid var(--paper-2); text-align: center; }
        .warning { background: #FFF7ED; color: #9A3412; border: 1px solid #FED7AA; }
        .load-more { margin-top: 14px; width: 100%; padding: 13px; border-radius: 16px; border: 1.5px solid var(--paper-2); background: white; color: var(--ink-2); font-size: 14px; font-weight: 700; cursor: pointer; }
        .sidebar-card { padding: 18px; border-radius: 22px; background: white; border: 1px solid var(--paper-2); box-shadow: var(--shadow-sm); }
        .sidebar-card + .sidebar-card { margin-top: 14px; }
        .sidebar-title { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 14px; }
        .sidebar-list { display: grid; gap: 10px; font-size: 13px; color: var(--ink-2); line-height: 1.6; }
        .skeleton { height: 132px; border-radius: 22px; background: linear-gradient(90deg, var(--paper) 25%, var(--paper-2) 50%, var(--paper) 75%); background-size: 200% 100%; animation: shimmer 1.3s linear infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (max-width: 920px) { .hero, .forum-layout { grid-template-columns: 1fr; } }
      `}</style>

      <div className="forum-page">
        <div className="forum-shell">

          {/* ─── Hero ─── */}
          <section className="hero">
            <motion.div
              className="hero-card"
              variants={heroVariants}
              initial="hidden"
              animate="show"
            >
              <motion.p className="hero-eyebrow" variants={heroItem}>Communauté BAC Mali</motion.p>
              <motion.h1 className="hero-title" variants={heroItem}>Forum entraide et messages étudiants</motion.h1>
              <motion.p className="hero-subtitle" variants={heroItem}>
                Trouve les bonnes réponses sur l'orientation, les examens, la bourse et la vie universitaire.
                Le forum s'adapte maintenant automatiquement au schéma de données disponible en production.
              </motion.p>
              <motion.div className="hero-actions" variants={heroItem}>
                {user ? (
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Link href="/forum/nouveau" className="hero-btn primary">Nouvelle discussion</Link>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Link href="/login" className="hero-btn primary">Se connecter</Link>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link href="/guide" className="hero-btn secondary">Lire le guide étudiant</Link>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.aside
              className="hero-side panel"
              variants={slideFromRight}
              initial="hidden"
              animate="show"
            >
              <div className="hero-side-grid">
                {[
                  { value: stats.posts.toLocaleString('fr-FR'), label: 'discussions et salons actifs' },
                  { value: stats.members.toLocaleString('fr-FR'), label: 'profils étudiants visibles' },
                  { value: forumMode || '...', label: 'mode forum détecté côté frontend' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="hero-stat"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
                  >
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.aside>
          </section>

          <div className="forum-layout">
            <main className="panel">
              {!forumReady && <div className="warning">Le forum nécessite une configuration Supabase valide. {getSupabaseBrowserConfigError()}</div>}
              {error && <div className="warning">{error}</div>}

              <div className="toolbar">
                <div className="toolbar-row">
                  <input
                    className="search"
                    type="text"
                    placeholder="Rechercher une discussion..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {!authLoading && (
                    user ? (
                      <Link href="/forum/nouveau" className="toolbar-btn primary">Poster</Link>
                    ) : (
                      <Link href="/login" className="toolbar-btn">Connexion</Link>
                    )
                  )}
                </div>

                <div className="toolbar-row">
                  <div className="categories">
                    {FORUM_CATEGORIES.map((item) => (
                      <motion.button
                        key={item}
                        className={`pill${category === item ? ' active' : ''}`}
                        onClick={() => setCategory(item)}
                        type="button"
                        variants={pillVariant}
                        whileTap="tap"
                      >
                        {item}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="toolbar-row">
                  <div className="sorts">
                    {SORT_OPTIONS.map((item) => (
                      <motion.button
                        key={item.key}
                        className={`pill${sort === item.key ? ' active' : ''}`}
                        onClick={() => setSort(item.key)}
                        type="button"
                        variants={pillVariant}
                        whileTap="tap"
                      >
                        {item.label}
                      </motion.button>
                    ))}
                  </div>
                  {forumMode ? <span className="mode-pill">Mode {forumMode}</span> : null}
                </div>
              </div>

              {/* Post list */}
              <AnimatePresence mode="wait">
                {loading && posts.length === 0 ? (
                  <motion.div
                    key="skeletons"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="skeleton" style={{ marginBottom: 12 }} />
                    <div className="skeleton" style={{ marginBottom: 12 }} />
                    <div className="skeleton" />
                  </motion.div>
                ) : posts.length === 0 ? (
                  <motion.div
                    key="empty"
                    className="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {search
                      ? `Aucun résultat pour "${search}".`
                      : 'Aucune discussion trouvée pour le moment. Lance la première conversation.'}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`posts-${category}-${sort}`}
                    className="post-list"
                    variants={postListStagger}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                  >
                    {posts.map((post) => <PostCard key={post.id} post={post} />)}
                  </motion.div>
                )}
              </AnimatePresence>

              {hasMore && (
                <motion.button
                  className="load-more"
                  onClick={() => loadPosts(false, offset)}
                  type="button"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {loading ? 'Chargement...' : 'Charger plus de discussions'}
                </motion.button>
              )}
            </main>

            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="sidebar-card">
                <div className="sidebar-title">Bonnes pratiques</div>
                <div className="sidebar-list">
                  <span>Sois précis dans le titre pour aider les autres à te répondre vite.</span>
                  <span>Ajoute le contexte utile: série, niveau, établissement, démarche déjà tentée.</span>
                  <span>Marque la discussion comme résolue quand tu as obtenu une réponse utile.</span>
                </div>
              </div>
              <div className="sidebar-card">
                <div className="sidebar-title">Accès rapide</div>
                <div className="sidebar-list">
                  <Link href="/orientation">Voir les filières post-bac</Link>
                  <Link href="/cenou">Simuler ton éligibilité CENOU</Link>
                  <Link href="/guide">Lire les procédures étudiantes</Link>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </div>
    </>
  )
}
