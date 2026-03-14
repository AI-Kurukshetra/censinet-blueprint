import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface Organization {
  id: string
  name: string
  slug: string
  domain: string | null
  logo_url: string | null
  subscription_tier: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  organization_id: string
  role: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  job_title: string | null
  department: string | null
  avatar_url: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  organizations?: Organization | null
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: string | null
  fetchUser: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  setProfile: (profile: Profile | null) => void
  clearError: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,

  fetchUser: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (!session) {
        set({ user: null, session: null, profile: null, loading: false })
        return
      }

      // Fetch profile with organization
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*, organizations(*)')
        .eq('id', session.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      set({
        user: session.user,
        session,
        profile: profile as Profile | null,
        loading: false,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch user'
      set({ error: message, loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      set({ user: data.user, session: data.session, loading: false })

      // Fetch profile after sign in
      await get().fetchUser()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to sign in'
      set({ error: message, loading: false })
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (error) throw error

      set({ user: data.user, session: data.session, loading: false })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to sign up'
      set({ error: message, loading: false })
    }
  },

  signOut: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      set({ user: null, session: null, profile: null, loading: false })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to sign out'
      set({ error: message, loading: false })
    }
  },

  setProfile: (profile) => set({ profile }),

  clearError: () => set({ error: null }),
}))
