'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      setProfile(null)
      return null
    }

    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url, badge, is_premium, created_at')
      .eq('id', currentUser.id)
      .maybeSingle()

    setProfile(data ?? null)
    return data ?? null
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      await loadProfile(nextUser)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      await loadProfile(nextUser)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    refreshProfile: () => loadProfile(user),
  }), [user, profile, loading, loadProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
