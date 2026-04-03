'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/* ─────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────── */
const CATEGORIES = ['Toutes', 'Orientation', 'Cours', 'Examen', 'Université', 'Bourse', 'Conseils', 'Autres']
const PAGE_SIZE  = 15

const CAT_COLORS = {
  Orientation: '#2563EB', Cours: '#7C3AED', Examen: '#DC2626',
  Université: '#0891B2', Bourse: '#D97706', Conseils: '#059669', Autres: '#6B7280'
}

const BADGE_CFG = {
  nouveau:    { label: 'Nouveau',    icon: '🌱', color: '#6B7280' },
  actif:      { label: 'Actif',      icon: '⚡', color: '#2563EB' },
  tres_actif: { label: 'Très Actif', icon: '🔥', color: '#D97706' },
  expert:     { label: 'Expert',     icon: '🏆', color: '#059669' },
  premium:    { label: 'Premium',    icon: '⭐', color: '#7C3AED' },
}

/* ─────────────────────────────────────────
   UTILITAIRES
───────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'à l\'instant'
  if (m < 60)  return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return d < 30 ? `il y a ${d}j` : new Date(dateStr).toLocaleDateString('fr-FR')
}

function avatarUrl(username) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username ?? 'U')}&backgroundColor=145a30&textColor=ffffff&fontSize=38`
}

/* ─────────────────────────────────────────
   COMPOSANTS UI
───────────────────────────────────────── */
function BadgeChip({ badge }) {
  const cfg = BADGE_CFG[badge] ?? BADGE_CFG.nouveau
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 7px', borderRadius: 100, fontSize: 10, fontWeight: 700,
      background: cfg.color + '18', color: cfg.color,
      border: `1px solid ${cfg.color}40`
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function CatBadge({ cat }) {
  const c = CAT_COLORS[cat] ?? '#6B7280'
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: c + '14', color: c, border: `1px solid ${c}28`
    }}>{cat}</span>
  )
}

/* ─────────────────────────────────────────
   CARTE POST
───────────────────────────────────────── */
function PostCard({ post }) {
  const { id, titre, body, categorie, votes_score, comments_count, created_at, is_resolved, username, avatar_url, badge } = post
  const excerpt = body?.length > 130 ? body.slice(0, 130) + '…' : body
  const scoreColor = votes_score > 0 ? 'var(--green-700)' : votes_score < 0 ? '#DC2626' : 'var(--ink-4)'

  return (
    <Link href={`/forum/${id}`} className="post-card-link">
      <article className="post-card">
        {/* Score */}
        <div className="post-score-col">
          <span className="score-num" style={{ color: scoreColor }}>{votes_score}</span>
          <span className="score-label">votes</span>
          <span className="comments-col">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {comments_count ?? 0}
          </span>
        </div>

        {/* Content */}
        <div className="post-main">
          <div className="post-tags">
            <CatBadge cat={categorie} />
            {is_resolved && (
              <span className="resolved-tag">✅ Résolu</span>
            )}
          </div>
          <h3 className="post-titre">{titre}</h3>
          {excerpt && <p className="post-excerpt">{excerpt}</p>}
          <div className="post-meta-row">
            <span className="meta-author">
              <img
                src={avatar_url ?? avatarUrl(username)}
                alt="" className="mini-avatar"
              />
              <strong>{username ?? 'Anonyme'}</strong>
              {badge && <BadgeChip badge={badge} />}
            </span>
            <span className="meta-time">🕐 {timeAgo(created_at)}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

/* ─────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────── */
export default function ForumPage() {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset]   = useState(0)
  const [cat, setCat]         = useState('Toutes')
  const [sort, setSort]       = useState('recent')   // 'recent' | 'popular' | 'unanswered'
  const [search, setSearch]   = useState('')
  const [stats, setStats]     = useState({ posts: 0, members: 0 })
  const { user, loading: authLoading } = useAuth()
  const supabase = getSupabaseClient()

  /* ── Chargement des posts ── */
  const loadPosts = useCallback(async (reset = true) => {
    setLoading(true)
    const start = reset ? 0 : offset

    let q = supabase
      .from('forum_posts_view')
      .select('id, titre, body, categorie, votes_score, comments_count, is_resolved, created_at, username, avatar_url, badge')
      .range(start, start + PAGE_SIZE - 1)

    if (cat !== 'Toutes') q = q.eq('categorie', cat)
    if (sort === 'unanswered') q = q.eq('comments_count', 0)
    if (search.trim()) q = q.ilike('titre', `%${search.trim()}%`)

    if (sort === 'popular') {
      q = q.order('votes_score', { ascending: false }).order('created_at', { ascending: false })
    } else {
      q = q.order('created_at', { ascending: false })
    }

    const { data, error } = await q
    if (!error) {
      const rows = data ?? []
      setPosts(prev => reset ? rows : [...prev, ...rows])
      setHasMore(rows.length === PAGE_SIZE)
      setOffset(reset ? PAGE_SIZE : start + PAGE_SIZE)
    }
    setLoading(false)
  }, [cat, sort, search, offset])

  /* ── Effets ── */
  useEffect(() => { loadPosts(true) }, [cat, sort])

  useEffect(() => {
    const t = setTimeout(() => loadPosts(true), 380)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    Promise.all([
      supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([{ count: p }, { count: m }]) => {
      setStats({ posts: p ?? 0, members: m ?? 0 })
    })
  }, [])

  /* ─────────────────────────────────────── */
  return (
    <>
      <style>{`
        /* ══ FORUM PAGE ══ */
        .forum-wrap { min-height: 80vh; background: var(--paper); }

        /* Hero */
        .forum-hero {
          background: linear-gradient(140deg, var(--green-900) 0%, var(--green-700) 55%, #1E8A4A 100%);
          color: white; padding: 56px 24px 88px; text-align: center; position: relative; overflow: hidden;
        }
        .forum-hero::after {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
        }
        .hero-eyebrow { position: relative; font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--gold-400); margin-bottom: 10px; }
        .hero-title { position: relative; font-family: var(--font-display); font-size: clamp(28px, 5vw, 48px); font-weight: 400; letter-spacing: -.02em; line-height: 1.1; margin-bottom: 10px; }
        .hero-title em { font-style: italic; color: var(--gold-400); }
        .hero-sub { position: relative; font-size: 15px; color: rgba(255,255,255,.65); max-width: 440px; margin: 0 auto 24px; line-height: 1.6; }
        .hero-stats { position: relative; display: flex; gap: 32px; justify-content: center; }
        .hstat { text-align: center; }
        .hstat-n { font-family: var(--font-display); font-size: 26px; font-weight: 500; color: var(--gold-400); }
        .hstat-l { font-size: 11px; color: rgba(255,255,255,.55); margin-top: 1px; }

        /* Layout */
        .forum-body {
          max-width: 960px; margin: -44px auto 0; padding: 0 16px 72px;
          display: grid; grid-template-columns: 1fr 256px; gap: 20px; align-items: start;
        }
        @media (max-width: 760px) {
          .forum-body { grid-template-columns: 1fr; }
          .f-sidebar { display: none; }
        }

        /* Controls */
        .f-controls {
          background: var(--white); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);
          padding: 16px 18px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 12px;
          position: sticky; top: 12px; z-index: 10;
        }
        .ctrl-top { display: flex; gap: 10px; align-items: center; }
        .f-search {
          flex: 1; padding: 10px 14px 10px 38px; border-radius: var(--radius-md);
          border: 1.5px solid var(--paper-2); background: var(--paper);
          font-family: var(--font-body); font-size: 14px; color: var(--ink); outline: none;
          transition: all .2s;
        }
        .f-search:focus { border-color: var(--green-500); background: var(--white); box-shadow: 0 0 0 3px rgba(46,154,92,.1); }
        .f-search::placeholder { color: var(--ink-4); }
        .search-wrap { position: relative; flex: 1; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--ink-4); font-size: 14px; pointer-events: none; }

        .btn-new {
          display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
          padding: 10px 18px; background: var(--green-700); color: white; border: none;
          border-radius: var(--radius-md); font-family: var(--font-body); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background .15s; text-decoration: none;
        }
        .btn-new:hover { background: var(--green-800); }
        .btn-new.outline {
          background: var(--paper); color: var(--ink-2); border: 1.5px solid var(--paper-2);
        }
        .btn-new.outline:hover { background: var(--paper-2); }

        .cats-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .cat-pill {
          padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600;
          border: 1.5px solid var(--paper-2); background: var(--white); color: var(--ink-3);
          cursor: pointer; transition: all .15s; font-family: var(--font-body);
        }
        .cat-pill:hover  { border-color: var(--green-300); color: var(--green-700); }
        .cat-pill.active { background: var(--green-700); border-color: var(--green-700); color: white; }

        .sort-tabs { display: flex; gap: 2px; border-top: 1.5px solid var(--paper-2); padding-top: 10px; }
        .sort-tab {
          padding: 5px 12px; font-size: 12px; font-weight: 600; background: none; border: none;
          color: var(--ink-4); cursor: pointer; font-family: var(--font-body);
          border-radius: var(--radius-sm); transition: all .15s;
        }
        .sort-tab:hover  { color: var(--green-700); background: var(--green-50); }
        .sort-tab.active { color: var(--green-700); background: var(--green-50); }

        /* Post card */
        .post-card-link { text-decoration: none; color: inherit; display: block; }
        .post-card {
          background: var(--white); border-radius: var(--radius-lg); border: 1.5px solid var(--paper-2);
          padding: 14px 18px; display: flex; gap: 16px; transition: all .15s;
          margin-bottom: 8px; cursor: pointer;
        }
        .post-card:hover { border-color: var(--green-300); box-shadow: var(--shadow-sm); transform: translateY(-1px); }

        .post-score-col {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          min-width: 40px; padding-top: 2px;
        }
        .score-num { font-family: var(--font-display); font-size: 20px; font-weight: 500; line-height: 1; }
        .score-label { font-size: 9px; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-4); }
        .comments-col { display: flex; align-items: center; gap: 3px; font-size: 12px; color: var(--ink-4); margin-top: 6px; }

        .post-main { flex: 1; min-width: 0; }
        .post-tags { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 7px; }
        .resolved-tag {
          padding: 1px 8px; border-radius: 100px; font-size: 11px; font-weight: 600;
          background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0;
        }
        .post-titre { font-size: 15px; font-weight: 600; color: var(--ink); line-height: 1.35; margin-bottom: 5px; }
        .post-excerpt { font-size: 13px; color: var(--ink-3); line-height: 1.55; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        .post-meta-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .meta-author { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink-3); }
        .meta-author strong { color: var(--ink-2); font-weight: 600; }
        .mini-avatar { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; border: 1px solid var(--paper-2); }
        .meta-time { font-size: 12px; color: var(--ink-4); }

        /* Skeleton */
        .skel-list { display: flex; flex-direction: column; gap: 8px; }
        .skel-card { height: 96px; border-radius: var(--radius-lg); background: linear-gradient(90deg, var(--paper) 25%, var(--paper-2) 50%, var(--paper) 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }

        /* Load more */
        .btn-load-more {
          width: 100%; padding: 13px; background: var(--white); border: 1.5px solid var(--paper-2);
          border-radius: var(--radius-lg); font-family: var(--font-body); font-size: 14px;
          color: var(--ink-3); cursor: pointer; transition: all .15s; margin-top: 4px;
        }
        .btn-load-more:hover { border-color: var(--green-300); color: var(--green-700); }

        /* Empty */
        .f-empty { text-align: center; padding: 52px 20px; }
        .f-empty h3 { font-family: var(--font-display); font-size: 20px; color: var(--ink); margin-bottom: 8px; }
        .f-empty p { font-size: 14px; color: var(--ink-3); }

        /* Sidebar */
        .f-sidebar { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 12px; }
        .sb-card {
          background: var(--white); border-radius: var(--radius-lg); border: 1.5px solid var(--paper-2);
          padding: 18px 20px;
        }
        .sb-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--ink-3); margin-bottom: 14px; }
        .sb-rule { font-size: 13px; color: var(--ink-2); padding: 7px 0; border-bottom: 1px solid var(--paper-2); display: flex; gap: 8px; }
        .sb-rule:last-child { border-bottom: none; padding-bottom: 0; }
        .sb-badge-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-size: 13px; color: var(--ink-2); }
        .sb-badge-row:not(:last-child) { border-bottom: 1px solid var(--paper-2); }
      `}</style>

      <div className="forum-wrap">
        {/* ── Hero ── */}
        <section className="forum-hero">
          <p className="hero-eyebrow">🎓 Communauté Étudiante</p>
          <h1 className="hero-title">Forum <em>Entraide</em></h1>
          <p className="hero-sub">Pose tes questions, partage ton expérience avec d'autres étudiants maliens.</p>
          <div className="hero-stats">
            <div className="hstat">
              <div className="hstat-n">{stats.posts.toLocaleString('fr-FR')}</div>
              <div className="hstat-l">discussions</div>
            </div>
            <div className="hstat">
              <div className="hstat-n">{stats.members.toLocaleString('fr-FR')}</div>
              <div className="hstat-l">membres</div>
            </div>
          </div>
        </section>

        {/* ── Body ── */}
        <div className="forum-body">
          {/* ── Colonne principale ── */}
          <div>
            {/* Controls */}
            <div className="f-controls">
              <div className="ctrl-top">
                <div className="search-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    className="f-search"
                    type="text"
                    placeholder="Rechercher une question…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {!authLoading && (
                  user
                    ? <Link href="/forum/nouveau" className="btn-new">+ Poster</Link>
                    : <Link href="/compte" className="btn-new outline">Se connecter</Link>
                )}
              </div>

              <div className="cats-row">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    className={`cat-pill${cat === c ? ' active' : ''}`}
                    onClick={() => setCat(c)}
                  >{c}</button>
                ))}
              </div>

              <div className="sort-tabs">
                {[
                  { key: 'recent',     label: '🕐 Récents' },
                  { key: 'popular',    label: '🔥 Populaires' },
                  { key: 'unanswered', label: '❓ Sans réponse' },
                ].map(s => (
                  <button
                    key={s.key}
                    className={`sort-tab${sort === s.key ? ' active' : ''}`}
                    onClick={() => setSort(s.key)}
                  >{s.label}</button>
                ))}
              </div>
            </div>

            {/* Posts */}
            {loading && posts.length === 0 ? (
              <div className="skel-list">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skel-card" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="f-empty">
                <h3>Aucune discussion trouvée</h3>
                <p>
                  {search
                    ? `Aucun résultat pour « ${search} »`
                    : 'Sois le premier à lancer une discussion !'}
                </p>
              </div>
            ) : (
              <>
                {posts.map(p => <PostCard key={p.id} post={p} />)}
                {hasMore && (
                  <button
                    className="btn-load-more"
                    onClick={() => loadPosts(false)}
                    disabled={loading}
                  >
                    {loading ? 'Chargement…' : '↓ Charger plus de discussions'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="f-sidebar">
            {/* CTA */}
            <div className="sb-card" style={{ background: 'linear-gradient(135deg, var(--green-800), var(--green-700))', borderColor: 'var(--green-600)' }}>
              <div className="sb-title" style={{ color: 'rgba(255,255,255,.55)' }}>🚀 Rejoins la communauté</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginBottom: 14, lineHeight: 1.65 }}>
                Aide les autres, gagne de l'expérience et monte en grade d'Expert.
              </p>
              {user
                ? <div style={{ fontSize: 13, color: 'var(--gold-400)', fontWeight: 700 }}>✅ Tu es connecté(e)</div>
                : <Link href="/compte" style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'var(--gold-400)', color: 'var(--green-900)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Créer un compte →</Link>
              }
            </div>

            {/* Règles */}
            <div className="sb-card">
              <div className="sb-title">📋 Règles du forum</div>
              {[
                ['🤝', 'Soyez respectueux'],
                ['🚫', 'Pas de spam'],
                ['🗂️', 'Bonne catégorie'],
                ['✅', 'Marquer résolu'],
                ['🔍', 'Chercher avant de poster'],
              ].map(([icon, text]) => (
                <div key={text} className="sb-rule"><span>{icon}</span><span>{text}</span></div>
              ))}
            </div>

            {/* Grades */}
            <div className="sb-card">
              <div className="sb-title">🏅 Grades & Réputation</div>
              {Object.entries(BADGE_CFG).map(([key, cfg]) => (
                <div key={key} className="sb-badge-row">
                  <span>{cfg.icon} <span style={{ fontWeight: 600, color: cfg.color }}>{cfg.label}</span></span>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                    {key === 'nouveau' ? '0 pts'
                     : key === 'actif' ? '50 pts'
                     : key === 'tres_actif' ? '200 pts'
                     : key === 'expert' ? '500 pts'
                     : '✨'}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
