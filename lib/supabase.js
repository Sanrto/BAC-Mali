import { createClient } from '@supabase/supabase-js'
import { getPublicSupabaseConfig, hasPublicSupabaseConfig } from './supabase-config'

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseConfig()

export const supabase = hasPublicSupabaseConfig()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
