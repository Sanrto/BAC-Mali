import { getSignedVoiceUrl } from './profile-utils'

export const FORUM_CATEGORIES = [
  'Toutes',
  'Orientation',
  'Cours',
  'Examen',
  'Université',
  'Bourse',
  'Conseils',
  'Autres',
]

const FORUM_MODE = {
  MODERN: 'modern',
  LEGACY: 'legacy',
}

let detectedForumModePromise = null

function isMissingDbObject(error) {
  const raw = [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    raw.includes('does not exist') ||
    raw.includes('could not find') ||
    raw.includes('relation') ||
    raw.includes('schema cache') ||
    raw.includes('function') ||
    raw.includes('42p01') ||
    raw.includes('42883')
  )
}

function normalizeCategory(value) {
  if (!value) return 'Autres'
  if (value === 'Autre') return 'Autres'
  return value
}

function getForumCapabilities(mode) {
  return {
    mode,
    postVoting: mode === FORUM_MODE.MODERN,
    commentVoting: true,
    commentDownvotes: mode === FORUM_MODE.MODERN,
    nestedComments: mode === FORUM_MODE.MODERN,
    voiceMessages: mode === FORUM_MODE.MODERN,
    realtime: true,
  }
}

async function fetchProfilesMap(supabase, userIds = []) {
  const ids = [...new Set(userIds.filter(Boolean))]

  if (!ids.length) return {}

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, badge, reputation, is_premium')
    .in('id', ids)

  if (error) return {}

  return Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]))
}

function normalizePost(row, profilesMap = {}) {
  const profile = profilesMap[row.user_id] ?? {}

  return {
    id: row.id,
    user_id: row.user_id ?? null,
    titre: row.titre ?? '',
    body: row.body ?? '',
    categorie: normalizeCategory(row.categorie),
    votes_score: Number(row.votes_score ?? 0),
    comments_count: Number(row.comments_count ?? row.answer_count ?? 0),
    is_resolved: Boolean(row.is_resolved),
    created_at: row.created_at ?? new Date().toISOString(),
    username: row.username ?? profile.username ?? 'Anonyme',
    avatar_url: row.avatar_url ?? profile.avatar_url ?? null,
    badge: row.badge ?? profile.badge ?? null,
    reputation: Number(row.reputation ?? profile.reputation ?? 0),
    views_count: Number(row.views_count ?? 0),
  }
}

function normalizeComment(row, profilesMap = {}, fallbackPostId = null) {
  const profile = profilesMap[row.user_id] ?? {}

  return {
    id: row.id,
    post_id: row.post_id ?? row.question_id ?? fallbackPostId,
    parent_id: row.parent_id ?? null,
    user_id: row.user_id ?? null,
    body: row.body ?? '',
    depth: Number(row.depth ?? 0),
    votes_score: Number(row.votes_score ?? row.likes_count ?? 0),
    is_best: Boolean(row.is_best),
    created_at: row.created_at ?? new Date().toISOString(),
    username: row.username ?? profile.username ?? 'Anonyme',
    avatar_url: row.avatar_url ?? profile.avatar_url ?? null,
    badge: row.badge ?? profile.badge ?? null,
    reputation: Number(row.reputation ?? profile.reputation ?? 0),
    audio_path: row.audio_path ?? null,
    audio_duration_sec: row.audio_duration_sec ?? null,
    audio_mime_type: row.audio_mime_type ?? null,
    audio_url: row.audio_url ?? null,
  }
}

async function resolvePremiumAudio(rows, isPremiumUser) {
  if (!isPremiumUser) return rows

  return Promise.all(
    rows.map(async (row) => {
      if (!row.audio_path) return row

      try {
        const audioUrl = await getSignedVoiceUrl(row.audio_path)
        return { ...row, audio_url: audioUrl }
      } catch {
        return row
      }
    })
  )
}

async function detectModernForum(supabase) {
  const { error } = await supabase.from('forum_posts').select('id', { head: true, count: 'exact' })
  return !error
}

async function detectLegacyForum(supabase) {
  const { error } = await supabase.from('forum_questions').select('id', { head: true, count: 'exact' })
  return !error
}

export async function detectForumMode(supabase) {
  if (!detectedForumModePromise) {
    detectedForumModePromise = (async () => {
      if (await detectModernForum(supabase)) return FORUM_MODE.MODERN
      if (await detectLegacyForum(supabase)) return FORUM_MODE.LEGACY
      throw new Error("Aucune table forum compatible n'a été trouvée.")
    })()
  }

  try {
    return await detectedForumModePromise
  } catch (error) {
    detectedForumModePromise = null
    throw error
  }
}

async function loadModernPosts(supabase, { category, sort, search, offset, limit }) {
  let query = supabase
    .from('forum_posts_view')
    .select('id, user_id, titre, body, categorie, votes_score, comments_count, is_resolved, created_at, username, avatar_url, badge, reputation, views_count')
    .range(offset, offset + limit - 1)

  if (category !== 'Toutes') {
    query = query.eq('categorie', category)
  }

  if (sort === 'unanswered') {
    query = query.eq('comments_count', 0)
  }

  if (search.trim()) {
    query = query.ilike('titre', `%${search.trim()}%`)
  }

  if (sort === 'popular') {
    query = query.order('votes_score', { ascending: false }).order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const response = await query

  if (!response.error || !isMissingDbObject(response.error)) {
    return response
  }

  let fallbackQuery = supabase
    .from('forum_posts')
    .select('id, user_id, titre, body, categorie, is_resolved, created_at')
    .range(offset, offset + limit - 1)

  if (category !== 'Toutes') {
    fallbackQuery = fallbackQuery.eq('categorie', category)
  }

  if (search.trim()) {
    fallbackQuery = fallbackQuery.ilike('titre', `%${search.trim()}%`)
  }

  return fallbackQuery.order('created_at', { ascending: false })
}

async function loadLegacyPosts(supabase, { category, sort, search, offset, limit }) {
  let query = supabase
    .from('forum_questions')
    .select('id, user_id, titre, body, categorie, answer_count, is_resolved, created_at')
    .range(offset, offset + limit - 1)

  if (category !== 'Toutes') {
    if (category === 'Autres') {
      query = query.in('categorie', ['Autre', 'Autres'])
    } else {
      query = query.eq('categorie', category)
    }
  }

  if (sort === 'unanswered') {
    query = query.eq('answer_count', 0)
  }

  if (search.trim()) {
    query = query.ilike('titre', `%${search.trim()}%`)
  }

  if (sort === 'popular') {
    query = query.order('answer_count', { ascending: false }).order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  return query
}

export async function listForumPosts(
  supabase,
  { category = 'Toutes', sort = 'recent', search = '', offset = 0, limit = 15 } = {}
) {
  const mode = await detectForumMode(supabase)
  const response =
    mode === FORUM_MODE.MODERN
      ? await loadModernPosts(supabase, { category, sort, search, offset, limit })
      : await loadLegacyPosts(supabase, { category, sort, search, offset, limit })

  if (response.error) throw response.error

  const rows = response.data ?? []
  const profilesMap =
    mode === FORUM_MODE.MODERN && rows.some((row) => row.username)
      ? {}
      : await fetchProfilesMap(supabase, rows.map((row) => row.user_id))

  return {
    mode,
    capabilities: getForumCapabilities(mode),
    posts: rows.map((row) => normalizePost(row, profilesMap)),
    hasMore: rows.length === limit,
    nextOffset: offset + rows.length,
  }
}

export async function getForumStats(supabase) {
  const mode = await detectForumMode(supabase)
  const tableName = mode === FORUM_MODE.MODERN ? 'forum_posts' : 'forum_questions'

  const [{ count: postsCount }, { count: membersCount }] = await Promise.all([
    supabase.from(tableName).select('id', { head: true, count: 'exact' }),
    supabase.from('profiles').select('id', { head: true, count: 'exact' }),
  ])

  return {
    posts: postsCount ?? 0,
    members: membersCount ?? 0,
    mode,
  }
}

async function loadModernPostDetail(supabase, postId) {
  const { data, error } = await supabase
    .from('forum_posts_view')
    .select('id, user_id, titre, body, categorie, votes_score, comments_count, is_resolved, created_at, username, avatar_url, badge, reputation, views_count')
    .eq('id', postId)
    .maybeSingle()

  if (!error || !isMissingDbObject(error)) {
    return { data, error }
  }

  return supabase
    .from('forum_posts')
    .select('id, user_id, titre, body, categorie, is_resolved, created_at')
    .eq('id', postId)
    .maybeSingle()
}

async function loadLegacyPostDetail(supabase, postId) {
  return supabase
    .from('forum_questions')
    .select('id, user_id, titre, body, categorie, answer_count, is_resolved, created_at')
    .eq('id', postId)
    .maybeSingle()
}

async function loadModernComments(supabase, postId) {
  const { data, error } = await supabase
    .from('forum_comments_view')
    .select('id, post_id, parent_id, user_id, body, depth, votes_score, is_best, created_at, username, avatar_url, badge, reputation, audio_path, audio_duration_sec, audio_mime_type')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (!error || !isMissingDbObject(error)) {
    return { data, error }
  }

  return supabase
    .from('forum_comments')
    .select('id, post_id, parent_id, user_id, body, depth, votes_score, is_best, created_at, audio_path, audio_duration_sec, audio_mime_type')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
}

async function loadLegacyComments(supabase, postId) {
  return supabase
    .from('forum_answers')
    .select('id, question_id, user_id, body, likes_count, is_best, created_at')
    .eq('question_id', postId)
    .order('created_at', { ascending: true })
}

export async function getForumThread(supabase, { postId, isPremiumUser = false } = {}) {
  const mode = await detectForumMode(supabase)
  const postResponse =
    mode === FORUM_MODE.MODERN
      ? await loadModernPostDetail(supabase, postId)
      : await loadLegacyPostDetail(supabase, postId)

  if (postResponse.error) throw postResponse.error
  if (!postResponse.data) return { post: null, comments: [], capabilities: getForumCapabilities(mode), mode }

  const commentResponse =
    mode === FORUM_MODE.MODERN
      ? await loadModernComments(supabase, postId)
      : await loadLegacyComments(supabase, postId)

  if (commentResponse.error) throw commentResponse.error

  const postProfilesMap =
    postResponse.data.username
      ? {}
      : await fetchProfilesMap(supabase, [postResponse.data.user_id])

  const commentRows = commentResponse.data ?? []
  const commentProfilesMap =
    commentRows.some((row) => row.username)
      ? {}
      : await fetchProfilesMap(supabase, commentRows.map((row) => row.user_id))

  const post = normalizePost(postResponse.data, postProfilesMap)
  const comments = await resolvePremiumAudio(
    commentRows.map((row) => normalizeComment(row, commentProfilesMap, postId)),
    isPremiumUser
  )

  return {
    mode,
    capabilities: getForumCapabilities(mode),
    post,
    comments,
  }
}

async function callBooleanRpcOrDefault(supabase, rpcName, fallback = true) {
  const { data, error } = await supabase.rpc(rpcName)
  if (!error) return data ?? fallback
  if (isMissingDbObject(error)) return fallback
  throw error
}

export async function createForumPost(supabase, { userId, titre, body, categorie }) {
  const mode = await detectForumMode(supabase)

  if (mode === FORUM_MODE.MODERN) {
    const canPost = await callBooleanRpcOrDefault(supabase, 'can_create_post', true)
    if (!canPost) {
      throw new Error('Vous avez déjà publié récemment. Réessayez dans quelques instants.')
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: userId,
        titre: titre.trim(),
        body: body.trim(),
        categorie: categorie || 'Autres',
      })
      .select('id')
      .single()

    if (error) throw error
    return { id: data.id, mode }
  }

  const { data, error } = await supabase
    .from('forum_questions')
    .insert({
      user_id: userId,
      titre: titre.trim(),
      body: body.trim(),
      categorie: categorie === 'Autres' ? 'Autre' : categorie,
    })
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id, mode }
}

export async function createForumComment(
  supabase,
  { postId, userId, body, parentId = null, audio = null, isPremiumUser = false, replyLabel = '' }
) {
  const mode = await detectForumMode(supabase)

  if (mode === FORUM_MODE.MODERN) {
    const canPost = await callBooleanRpcOrDefault(supabase, 'can_create_comment', true)
    if (!canPost) {
      throw new Error('Attendez quelques secondes avant de publier un nouveau message.')
    }

    const payload = {
      post_id: postId,
      user_id: userId,
      parent_id: parentId,
      body: body.trim(),
      depth: parentId ? 1 : 0,
    }

    if (audio) {
      if (!isPremiumUser) {
        throw new Error('Les messages vocaux sont réservés aux comptes Premium.')
      }

      payload.audio_path = audio.path
      payload.audio_duration_sec = audio.duration ?? null
      payload.audio_mime_type = audio.mimeType ?? null
    }

    const { error } = await supabase.from('forum_comments').insert(payload)
    if (error) throw error

    return { mode }
  }

  if (audio) {
    throw new Error("Les messages vocaux ne sont pas disponibles sur cette version du forum.")
  }

  const content = parentId && replyLabel ? `@${replyLabel}\n${body.trim()}` : body.trim()

  const { error } = await supabase
    .from('forum_answers')
    .insert({
      question_id: postId,
      user_id: userId,
      body: content,
    })

  if (error) throw error

  const countResponse = await supabase.rpc('increment_answer_count', { qid: postId })
  if (countResponse.error && !isMissingDbObject(countResponse.error)) {
    throw countResponse.error
  }

  return { mode }
}

export async function loadForumUserVotes(supabase, { userId }) {
  const mode = await detectForumMode(supabase)

  if (!userId) {
    return {
      mode,
      postVotes: {},
      commentVotes: {},
    }
  }

  if (mode === FORUM_MODE.MODERN) {
    const { data, error } = await supabase
      .from('forum_votes')
      .select('target_id, target_type, value')
      .eq('user_id', userId)

    if (error) throw error

    const postVotes = {}
    const commentVotes = {}

    for (const vote of data ?? []) {
      if (vote.target_type === 'post') {
        postVotes[vote.target_id] = vote.value
      } else if (vote.target_type === 'comment') {
        commentVotes[vote.target_id] = vote.value
      }
    }

    return { mode, postVotes, commentVotes }
  }

  const { data, error } = await supabase
    .from('forum_likes')
    .select('answer_id')
    .eq('user_id', userId)

  if (error && !isMissingDbObject(error)) throw error

  const commentVotes = {}
  for (const vote of data ?? []) {
    commentVotes[vote.answer_id] = 1
  }

  return {
    mode,
    postVotes: {},
    commentVotes,
  }
}

export async function voteOnForumPost(supabase, { postId, value }) {
  const mode = await detectForumMode(supabase)

  if (mode !== FORUM_MODE.MODERN) {
    return { supported: false }
  }

  const { data, error } = await supabase.rpc('vote_on_post', {
    p_post_id: postId,
    p_value: value,
  })

  if (error) {
    if (isMissingDbObject(error)) return { supported: false }
    throw error
  }

  const result = data?.[0] ?? {}

  return {
    supported: true,
    userVote: Number(result.user_vote ?? value),
    newScore: Number(result.new_score ?? 0),
  }
}

export async function voteOnForumComment(supabase, { commentId, userId, nextValue }) {
  const mode = await detectForumMode(supabase)

  if (mode === FORUM_MODE.MODERN) {
    const { data, error } = await supabase.rpc('vote_on_comment', {
      p_comment_id: commentId,
      p_value: nextValue,
    })

    if (error) {
      if (isMissingDbObject(error)) return { supported: false }
      throw error
    }

    const result = data?.[0] ?? {}

    return {
      supported: true,
      userVote: Number(result.user_vote ?? nextValue),
      newScore: Number(result.new_score ?? 0),
    }
  }

  if (nextValue === -1) {
    return { supported: false }
  }

  const { data: existingLike, error: likeLookupError } = await supabase
    .from('forum_likes')
    .select('id')
    .eq('answer_id', commentId)
    .eq('user_id', userId)
    .maybeSingle()

  if (likeLookupError && !isMissingDbObject(likeLookupError)) throw likeLookupError

  if (existingLike?.id) {
    const { error } = await supabase.from('forum_likes').delete().eq('id', existingLike.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('forum_likes')
      .insert({ answer_id: commentId, user_id: userId })

    if (error) throw error
  }

  const { data: answer, error: answerError } = await supabase
    .from('forum_answers')
    .select('likes_count')
    .eq('id', commentId)
    .maybeSingle()

  if (answerError && !isMissingDbObject(answerError)) throw answerError

  return {
    supported: true,
    userVote: existingLike?.id ? 0 : 1,
    newScore: Number(answer?.likes_count ?? 0),
  }
}

export async function markForumThreadResolved(supabase, { postId, isResolved }) {
  const mode = await detectForumMode(supabase)
  const tableName = mode === FORUM_MODE.MODERN ? 'forum_posts' : 'forum_questions'

  const { error } = await supabase
    .from(tableName)
    .update({ is_resolved: isResolved })
    .eq('id', postId)

  if (error) throw error

  return { mode }
}

export async function incrementForumThreadViews(supabase, { postId }) {
  const mode = await detectForumMode(supabase)

  if (mode !== FORUM_MODE.MODERN) {
    return false
  }

  const { error } = await supabase.rpc('increment_post_views', { p_post_id: postId })

  if (error && !isMissingDbObject(error)) {
    throw error
  }

  return !error
}

export async function subscribeToForumThread(supabase, { postId, onChange }) {
  const mode = await detectForumMode(supabase)
  const commentTable = mode === FORUM_MODE.MODERN ? 'forum_comments' : 'forum_answers'
  const commentFilter = mode === FORUM_MODE.MODERN ? `post_id=eq.${postId}` : `question_id=eq.${postId}`
  const postTable = mode === FORUM_MODE.MODERN ? 'forum_posts' : 'forum_questions'

  const channel = supabase
    .channel(`forum-thread-${mode}-${postId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: commentTable, filter: commentFilter }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: postTable, filter: `id=eq.${postId}` }, onChange)

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function buildCommentTree(comments = []) {
  const map = new Map()
  const roots = []

  for (const comment of comments) {
    map.set(comment.id, { ...comment, children: [] })
  }

  for (const comment of comments) {
    const current = map.get(comment.id)

    if (comment.parent_id && map.has(comment.parent_id)) {
      map.get(comment.parent_id).children.push(current)
    } else {
      roots.push(current)
    }
  }

  return roots
}
