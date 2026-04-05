import { createClient } from '@supabase/supabase-js'
import {
  getPublicSupabaseConfig,
  getPublicSupabaseConfigError,
  hasPublicSupabaseConfig,
} from './supabase-config'

let clientInstance = null

export function getSupabaseClient() {
  if (!hasPublicSupabaseConfig()) {
    return null
  }

  if (!clientInstance) {
    const { url, anonKey } = getPublicSupabaseConfig()
    clientInstance = createClient(
      url,
      anonKey,
      {
        auth: {
          persistSession: true,
          storageKey: 'bac-mali-auth',
          autoRefreshToken: true,
        },
      }
    )
  }
  return clientInstance
}

export function isSupabaseConfigured() {
  return hasPublicSupabaseConfig()
}

export function getSupabaseBrowserConfigError() {
  return getPublicSupabaseConfigError()
}
