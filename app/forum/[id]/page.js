'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  getSupabaseBrowserConfigError,
  getSupabaseClient,
  isSupabaseConfigured,
} from '../../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import VoiceRecorder from '../../components/VoiceRecorder'
import { uploadVoiceMessage } from '../../../lib/profile-utils'
import {
  buildCommentTree,
  createForumComment,
  getForumThread,
  incrementForumThreadViews,
  loadForumUserVotes,
  markForumThreadResolved,
  subscribeToForumThread,
  voteOnForumComment,
  voteOnForumPost,
} from '../../../lib/forum-client'

const SORT_OPTIONS = [
  { key: 'recent', label: 'Récents' },
  { key: 'best', label: 'Meilleurs' },
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

function sortComments(comments, sortKey) {
  const copy = [...comments]

  if (sortKey === 'best') {
    return copy.sort((a, b) => {
      if (a.is_best && !b.is_best) return -1
      if (!a.is_best && b.is_best) return 1
      if (b.votes_score !== a.votes_score) return b.votes_score - a.votes_score
      return new Date(a.created_at) - new Date(b.created_at)
    })
  }

  return copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

function VoteButtons({ score, userVote, onVote, disabled, allowDownvote = true }) {
  return (
    <div className="vote-row">
      <button className={`vote-btn${userVote === 1 ? ' active up' : ''}`} onClick={() => onVote(1)} disabled={disabled} type="button">▲</button>
      <span className="vote-score">{score}</span>
      {allowDownvote ? (
        <button className={`vote-btn${userVote === -1 ? ' active down' : ''}`} onClick={() => onVote(-1)} disabled={disabled} type="button">▼</button>
      ) : null}
    </div>
  )
}

function MessageNode({
  message,
  currentUserId,
  commentVotes,
  onReply,
  onVote,
  canReply,
  canVote,
  allowDownvote,
  nestedComments,
  depth = 0,
}) {
  const isOwn = Boolean(currentUserId && message.user_id === currentUserId)
  const offset = nestedComments ? Math.min(depth * 22, 66) : 0

  return (
    <div style={{ marginLeft: offset }}>
      <div className={`message-row${isOwn ? ' own' : ''}`}>
        {!isOwn && <img src={message.avatar_url ?? avatarUrl(message.username)} alt="" className="message-avatar" />}

        <div className={`message-bubble${isOwn ? ' own' : ''}${message.is_best ? ' best' : ''}`}>
          <div className="message-head">
            <div className="message-author">
              <strong>{message.username}</strong>
              {message.is_best && <span className="message-pill best">Meilleure réponse</span>}
            </div>
            <span className="message-time">{timeAgo(message.created_at)}</span>
          </div>

          {message.body ? <p className="message-text">{message.body}</p> : null}
          {message.audio_url ? <audio controls src={message.audio_url} style={{ width: '100%', marginTop: 8 }} /> : null}
          {!message.audio_url && message.audio_path ? (
            <div className="message-audio-lock">Audio premium disponible pour les membres Premium.</div>
          ) : null}

          <div className="message-actions">
            {canVote ? (
              <VoteButtons
                score={message.votes_score}
                userVote={commentVotes[message.id] ?? 0}
                onVote={(value) => onVote(message.id, value)}
                disabled={!currentUserId}
                allowDownvote={allowDownvote}
              />
            ) : (
              <span className="message-score">{message.votes_score} réactions</span>
            )}

            {canReply && (
              <button className="message-link" onClick={() => onReply(message)} type="button">Répondre</button>
            )}
          </div>
        </div>
      </div>

      {message.children?.length
        ? message.children.map((child) => (
            <MessageNode
              key={child.id}
              message={child}
              currentUserId={currentUserId}
              commentVotes={commentVotes}
              onReply={onReply}
              onVote={onVote}
              canReply={canReply}
              canVote={canVote}
              allowDownvote={allowDownvote}
              nestedComments={nestedComments}
              depth={depth + 1}
            />
          ))
        : null}
    </div>
  )
}

export default function ForumThreadPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const forumReady = isSupabaseConfigured()
  const { user, profile } = useAuth()

  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [capabilities, setCapabilities] = useState({
    postVoting: false,
    commentVoting: false,
    commentDownvotes: false,
    nestedComments: false,
    voiceMessages: false,
  })
  const [postVote, setPostVote] = useState(0)
  const [commentVotes, setCommentVotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [draftAudio, setDraftAudio] = useState(null)
  const [sending, setSending] = useState(false)
  const [replyTarget, setReplyTarget] = useState(null)
  const [sort, setSort] = useState('recent')

  const endRef = useRef(null)

  const refreshThread = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    setError('')

    const threadResponse = await getForumThread(supabase, {
      postId: id,
      isPremiumUser: Boolean(profile?.is_premium),
    })

    if (!threadResponse.post) {
      setThread(null)
      setMessages([])
      setLoading(false)
      return
    }

    setThread(threadResponse.post)
    setMessages(threadResponse.comments)
    setCapabilities(threadResponse.capabilities)

    if (user) {
      const votes = await loadForumUserVotes(supabase, { userId: user.id })
      setPostVote(votes.postVotes[id] ?? 0)
      setCommentVotes(votes.commentVotes)
    } else {
      setPostVote(0)
      setCommentVotes({})
    }

    setLoading(false)
  }, [id, profile?.is_premium, supabase, user])

  useEffect(() => {
    setLoading(true)

    refreshThread().catch((threadError) => {
      setError(threadError.message || 'Impossible de charger cette discussion.')
      setLoading(false)
    })
  }, [refreshThread])

  useEffect(() => {
    if (!supabase || !id) return

    incrementForumThreadViews(supabase, { postId: id }).catch(() => {})
  }, [id, supabase])

  useEffect(() => {
    if (!supabase || !id) return undefined

    let unsubscribe = null
    let active = true

    subscribeToForumThread(supabase, {
      postId: id,
      onChange: () => {
        if (!active) return
        refreshThread().catch(() => {})
      },
    })
      .then((cleanup) => {
        unsubscribe = cleanup
      })
      .catch(() => {})

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [id, refreshThread, supabase])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  const commentTree = useMemo(() => buildCommentTree(sortComments(messages, sort)), [messages, sort])

  async function handleSend(event) {
    event.preventDefault()

    if (!user || !thread || (!draft.trim() && !draftAudio?.file)) return
    if (!supabase) {
      setError(getSupabaseBrowserConfigError())
      return
    }

    setSending(true)
    setError('')

    try {
      let audio = null

      if (draftAudio?.file && capabilities.voiceMessages) {
        const audioPath = await uploadVoiceMessage(user.id, draftAudio.file)
        audio = {
          path: audioPath,
          duration: draftAudio.duration ?? null,
          mimeType: draftAudio.mimeType ?? null,
        }
      }

      await createForumComment(supabase, {
        postId: id,
        userId: user.id,
        body: draft,
        parentId: capabilities.nestedComments ? replyTarget?.id ?? null : null,
        audio,
        isPremiumUser: Boolean(profile?.is_premium),
        replyLabel: replyTarget?.username ?? '',
      })

      setDraft('')
      setDraftAudio(null)
      setReplyTarget(null)
      await refreshThread()
    } catch (sendError) {
      setError(sendError.message || 'Impossible d’envoyer le message.')
    } finally {
      setSending(false)
    }
  }

  async function handlePostVote(value) {
    if (!supabase || !thread || !capabilities.postVoting || !user) return

    const nextValue = postVote === value ? 0 : value

    try {
      const result = await voteOnForumPost(supabase, { postId: thread.id, value: nextValue })
      if (!result.supported) return

      setPostVote(result.userVote)
      setThread((current) => current ? { ...current, votes_score: result.newScore } : current)
    } catch (voteError) {
      setError(voteError.message || 'Impossible de voter sur cette discussion.')
    }
  }

  async function handleCommentVote(commentId, value) {
    if (!supabase || !capabilities.commentVoting || !user) return

    const previous = commentVotes[commentId] ?? 0
    const nextValue = previous === value ? 0 : value

    try {
      const result = await voteOnForumComment(supabase, {
        commentId,
        userId: user.id,
        nextValue,
      })

      if (!result.supported) return

      setCommentVotes((current) => ({ ...current, [commentId]: result.userVote }))
      setMessages((current) =>
        current.map((message) =>
          message.id === commentId ? { ...message, votes_score: result.newScore } : message
        )
      )
    } catch (voteError) {
      setError(voteError.message || 'Impossible de voter sur ce message.')
    }
  }

  async function handleResolveToggle() {
    if (!supabase || !thread || thread.user_id !== user?.id) return

    try {
      await markForumThreadResolved(supabase, {
        postId: thread.id,
        isResolved: !thread.is_resolved,
      })

      setThread((current) => current ? { ...current, is_resolved: !current.is_resolved } : current)
    } catch (resolveError) {
      setError(resolveError.message || 'Impossible de mettre à jour le statut.')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
        Chargement...
      </div>
    )
  }

  if (!thread) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 16px' }}>
        <div style={{ padding: 24, borderRadius: 24, background: 'white', boxShadow: 'var(--shadow-lg)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 12 }}>Discussion introuvable</h1>
          <p style={{ color: 'var(--ink-3)', marginBottom: 18 }}>
            Cette discussion n'existe pas ou n'est plus disponible.
          </p>
          <Link href="/forum" style={{ color: 'var(--green-700)', textDecoration: 'none', fontWeight: 700 }}>
            Retour au forum
          </Link>
        </div>
      </div>
    )
  }

  const categoryColor = CATEGORY_COLORS[thread.categorie] ?? CATEGORY_COLORS.Autres

  return (
    <>
      <style>{`
        .thread-page {
          min-height: calc(100vh - 56px);
          background:
            radial-gradient(circle at top left, rgba(46,154,92,0.14), transparent 30%),
            linear-gradient(180deg, #143723 0%, #143723 22%, #F5F7F3 22%, #F7F8F5 100%);
        }
        .thread-shell {
          max-width: 980px;
          margin: 0 auto;
          padding: 34px 16px 72px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          color: var(--green-700);
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
        }
        .thread-card,
        .messages-card {
          background: white;
          border-radius: 28px;
          box-shadow: var(--shadow-lg);
        }
        .thread-card {
          padding: 28px;
          margin-bottom: 18px;
        }
        .thread-top {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .thread-main {
          flex: 1;
          min-width: 0;
        }
        .thread-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .thread-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          border: 1px solid transparent;
        }
        .thread-pill.resolved {
          background: #DCFCE7;
          color: #166534;
          border-color: #BBF7D0;
        }
        .thread-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: var(--ink);
          margin-bottom: 14px;
        }
        .thread-body {
          color: var(--ink-2);
          line-height: 1.85;
          font-size: 15px;
          white-space: pre-wrap;
          margin-bottom: 18px;
        }
        .thread-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          border-top: 1px solid var(--paper-2);
          padding-top: 16px;
        }
        .thread-author {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .thread-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--paper-2);
        }
        .thread-author strong {
          display: block;
          color: var(--ink);
        }
        .thread-author span {
          font-size: 12px;
          color: var(--ink-4);
        }
        .thread-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .thread-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 14px;
          border-radius: 14px;
          border: 1.5px solid var(--paper-2);
          background: white;
          color: var(--ink);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .thread-btn.resolve {
          background: var(--green-50);
          color: var(--green-700);
          border-color: var(--green-200);
        }
        .messages-card {
          padding: 22px;
        }
        .messages-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 18px;
        }
        .messages-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--ink);
        }
        .sorts {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sort-pill {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1.5px solid var(--paper-2);
          background: white;
          color: var(--ink-3);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .sort-pill.active {
          background: var(--green-50);
          color: var(--green-700);
          border-color: var(--green-300);
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
        .composer {
          padding: 18px;
          border-radius: 22px;
          background: var(--paper);
          border: 1px solid var(--paper-2);
          margin-bottom: 18px;
        }
        .composer-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 10px;
          font-size: 13px;
          color: var(--ink-3);
        }
        .composer-reply {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: white;
          border: 1px solid var(--paper-2);
        }
        .composer-reply button {
          border: none;
          background: none;
          color: var(--ink-4);
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }
        .composer-textarea {
          width: 100%;
          min-height: 110px;
          padding: 14px 15px;
          border-radius: 18px;
          border: 1.5px solid var(--paper-2);
          background: white;
          color: var(--ink);
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.7;
          resize: vertical;
          outline: none;
        }
        .composer-textarea:focus {
          border-color: var(--green-500);
          box-shadow: 0 0 0 3px rgba(46,154,92,0.12);
        }
        .composer-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 10px;
        }
        .composer-count {
          font-size: 12px;
          color: var(--ink-4);
        }
        .composer-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(135deg, var(--green-700), #1E8A4A);
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }
        .login-hint {
          padding: 18px;
          border-radius: 22px;
          background: var(--paper);
          border: 1px solid var(--paper-2);
          color: var(--ink-2);
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 18px;
        }
        .login-hint a {
          color: var(--green-700);
          text-decoration: none;
          font-weight: 800;
        }
        .message-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
        }
        .message-row.own {
          justify-content: flex-end;
        }
        .message-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--paper-2);
          flex-shrink: 0;
        }
        .message-bubble {
          max-width: min(100%, 680px);
          padding: 14px 16px;
          border-radius: 22px;
          background: white;
          border: 1px solid var(--paper-2);
          box-shadow: var(--shadow-sm);
        }
        .message-bubble.own {
          background: linear-gradient(135deg, var(--green-700), #1E8A4A);
          color: white;
          border-color: transparent;
        }
        .message-bubble.best {
          border-color: #BBF7D0;
          background: linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%);
        }
        .message-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .message-author {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .message-author strong {
          font-size: 14px;
        }
        .message-time {
          font-size: 12px;
          color: var(--ink-4);
        }
        .message-bubble.own .message-time {
          color: rgba(255,255,255,0.7);
        }
        .message-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
        }
        .message-pill.best {
          background: #DCFCE7;
          color: #166534;
        }
        .message-text {
          white-space: pre-wrap;
          line-height: 1.75;
          font-size: 14px;
        }
        .message-audio-lock {
          margin-top: 8px;
          padding: 9px 10px;
          border-radius: 14px;
          background: #F3E8FF;
          color: #6B21A8;
          font-size: 12px;
        }
        .message-actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .message-link,
        .message-score {
          font-size: 12px;
          font-weight: 800;
          color: var(--green-700);
        }
        .message-bubble.own .message-link,
        .message-bubble.own .message-score {
          color: white;
        }
        .message-link {
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
        }
        .vote-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .vote-btn {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid var(--paper-2);
          background: white;
          color: var(--ink-4);
          cursor: pointer;
        }
        .vote-btn.active.up {
          color: var(--green-700);
          border-color: var(--green-300);
          background: var(--green-50);
        }
        .vote-btn.active.down {
          color: #B91C1C;
          border-color: #FCA5A5;
          background: #FEF2F2;
        }
        .vote-score {
          min-width: 24px;
          text-align: center;
          font-size: 13px;
          font-weight: 800;
          color: var(--ink-3);
        }
        .empty-thread {
          padding: 24px;
          border-radius: 22px;
          background: var(--paper);
          border: 1px solid var(--paper-2);
          text-align: center;
          color: var(--ink-3);
          font-size: 14px;
          line-height: 1.7;
        }
        @media (max-width: 640px) {
          .thread-card,
          .messages-card { padding: 18px; }
          .thread-top { flex-direction: column; }
        }
      `}</style>

      <div className="thread-page">
        <div className="thread-shell">
          <Link href="/forum" className="back-link">← Retour au forum</Link>

          <section className="thread-card">
            <div className="thread-top">
              {capabilities.postVoting ? (
                <VoteButtons
                  score={thread.votes_score}
                  userVote={postVote}
                  onVote={handlePostVote}
                  disabled={!user}
                  allowDownvote
                />
              ) : null}

              <div className="thread-main">
                <div className="thread-meta">
                  <span
                    className="thread-pill"
                    style={{
                      color: categoryColor,
                      borderColor: `${categoryColor}30`,
                      background: `${categoryColor}12`,
                    }}
                  >
                    {thread.categorie}
                  </span>
                  {thread.is_resolved ? <span className="thread-pill resolved">Résolu</span> : null}
                </div>

                <h1 className="thread-title">{thread.titre}</h1>
                <p className="thread-body">{thread.body}</p>

                <div className="thread-footer">
                  <div className="thread-author">
                    <img src={thread.avatar_url ?? avatarUrl(thread.username)} alt="" className="thread-avatar" />
                    <div>
                      <strong>{thread.username}</strong>
                      <span>{timeAgo(thread.created_at)} · {thread.comments_count} messages · {thread.reputation || 0} pts</span>
                    </div>
                  </div>

                  <div className="thread-actions">
                    <span className="thread-pill" style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                      {capabilities.mode || 'forum'}
                    </span>
                    {thread.user_id === user?.id ? (
                      <button className={`thread-btn${thread.is_resolved ? '' : ' resolve'}`} onClick={handleResolveToggle} type="button">
                        {thread.is_resolved ? 'Marquer comme ouverte' : 'Marquer comme résolue'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="messages-card">
            <div className="messages-header">
              <div className="messages-title">Messages du fil</div>
              <div className="sorts">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    className={`sort-pill${sort === option.key ? ' active' : ''}`}
                    onClick={() => setSort(option.key)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {!forumReady && (
              <div className="warning">
                La lecture du forum nécessite une configuration Supabase valide. {getSupabaseBrowserConfigError()}
              </div>
            )}

            {error && <div className="warning">{error}</div>}

            {user ? (
              <form className="composer" onSubmit={handleSend}>
                <div className="composer-top">
                  <span>{capabilities.nestedComments ? 'Réponds directement dans le fil.' : 'Partage ta réponse à la discussion.'}</span>
                  {replyTarget ? (
                    <span className="composer-reply">
                      Réponse à {replyTarget.username}
                      <button onClick={() => setReplyTarget(null)} type="button">Annuler</button>
                    </span>
                  ) : null}
                </div>

                {capabilities.voiceMessages ? (
                  <VoiceRecorder
                    premium={Boolean(profile?.is_premium)}
                    disabled={sending}
                    existingDuration={draftAudio?.duration ?? 0}
                    onAudioReady={setDraftAudio}
                    onClear={() => setDraftAudio(null)}
                  />
                ) : null}

                <textarea
                  className="composer-textarea"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Écris ton message ici..."
                  maxLength={2000}
                />

                <div className="composer-footer">
                  <span className="composer-count">{draft.length}/2000</span>
                  <button className="composer-btn" type="submit" disabled={sending || (!draft.trim() && !draftAudio?.file)}>
                    {sending ? 'Envoi...' : 'Envoyer le message'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="login-hint">
                Connecte-toi pour répondre à cette discussion. <Link href="/login">Ouvrir la connexion</Link>
              </div>
            )}

            {commentTree.length ? (
              <>
                {commentTree.map((message) => (
                  <MessageNode
                    key={message.id}
                    message={message}
                    currentUserId={user?.id ?? ''}
                    commentVotes={commentVotes}
                    onReply={setReplyTarget}
                    onVote={handleCommentVote}
                    canReply={Boolean(user)}
                    canVote={capabilities.commentVoting}
                    allowDownvote={capabilities.commentDownvotes}
                    nestedComments={capabilities.nestedComments}
                  />
                ))}
                <div ref={endRef} />
              </>
            ) : (
              <div className="empty-thread">
                Aucun message pour le moment. Lance la conversation pour aider les autres étudiants.
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
