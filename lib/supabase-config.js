export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  return {
    url: url?.trim() || '',
    anonKey: anonKey?.trim() || '',
  }
}

export function getPublicSupabaseConfigError() {
  const { url, anonKey } = getPublicSupabaseConfig()

  if (!url && !anonKey) {
    return "Les variables d'environnement Supabase sont absentes."
  }
  if (!url) {
    return 'NEXT_PUBLIC_SUPABASE_URL est manquante.'
  }
  if (!anonKey) {
    return 'NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante.'
  }

  return ''
}

export function hasPublicSupabaseConfig() {
  return !getPublicSupabaseConfigError()
}

export function getServiceSupabaseConfig() {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''

  return {
    ...getPublicSupabaseConfig(),
    serviceRoleKey: serviceRoleKey.trim(),
  }
}
