import { createClient } from '@supabase/supabase-js'
import { getServiceSupabaseConfig } from './supabase-config'

let adminClient = null

export function getSupabaseAdmin() {
  if (!adminClient) {
    const { url, serviceRoleKey } = getServiceSupabaseConfig()
    if (!url || !serviceRoleKey) {
      throw new Error('Supabase admin config is missing.')
    }

    adminClient = createClient(
      url,
      serviceRoleKey,
      {
        auth: { persistSession: false, autoRefreshToken: false }
      }
    )
  }
  return adminClient
}
