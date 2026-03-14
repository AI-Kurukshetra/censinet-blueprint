import { act } from '@testing-library/react'

// Set up mocks before importing useAuth
const mockGetSession = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockSignUp = jest.fn()
const mockSignOut = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
    from: mockFrom,
  }),
}))

import { useAuth } from '@/hooks/use-auth'

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the zustand store state
    const state = useAuth.getState()
    useAuth.setState({
      user: null,
      session: null,
      profile: null,
      loading: true,
      error: null,
    })
  })

  it('has initial state with loading=true', () => {
    const state = useAuth.getState()
    expect(state.loading).toBe(true)
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.error).toBeNull()
  })

  describe('fetchUser', () => {
    it('sets user and profile when session exists', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token-123' }
      const mockProfile = {
        id: 'user-1',
        full_name: 'Test User',
        role: 'admin',
        org_id: 'org-1',
        avatar_url: null,
      }

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      })

      await act(async () => {
        await useAuth.getState().fetchUser()
      })

      const state = useAuth.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.session).toEqual(mockSession)
      expect(state.profile).toEqual(mockProfile)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('clears user when no session exists', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      await act(async () => {
        await useAuth.getState().fetchUser()
      })

      const state = useAuth.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
      expect(state.profile).toBeNull()
      expect(state.loading).toBe(false)
    })

    it('sets error when session fetch fails', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Session expired'),
      })

      await act(async () => {
        await useAuth.getState().fetchUser()
      })

      const state = useAuth.getState()
      expect(state.error).toBe('Session expired')
      expect(state.loading).toBe(false)
    })
  })

  describe('signIn', () => {
    it('calls supabase.auth.signInWithPassword with credentials', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token-123' }

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      // Mock fetchUser called after signIn
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'user-1', full_name: 'Test', role: 'admin', org_id: 'org-1', avatar_url: null },
              error: null,
            }),
          }),
        }),
      })

      await act(async () => {
        await useAuth.getState().signIn('test@example.com', 'password123')
      })

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('sets error on sign in failure', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid credentials'),
      })

      await act(async () => {
        await useAuth.getState().signIn('bad@example.com', 'wrong')
      })

      const state = useAuth.getState()
      expect(state.error).toBe('Invalid credentials')
      expect(state.loading).toBe(false)
    })
  })

  describe('signOut', () => {
    it('clears user state on successful sign out', async () => {
      // First set some user state
      useAuth.setState({
        user: { id: 'user-1' } as any,
        session: { access_token: 'token' } as any,
        profile: { id: 'user-1', full_name: 'Test', role: 'admin', org_id: 'org-1', avatar_url: null },
        loading: false,
      })

      mockSignOut.mockResolvedValue({ error: null })

      await act(async () => {
        await useAuth.getState().signOut()
      })

      const state = useAuth.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
      expect(state.profile).toBeNull()
      expect(state.loading).toBe(false)
    })

    it('sets error on sign out failure', async () => {
      mockSignOut.mockResolvedValue({
        error: new Error('Sign out failed'),
      })

      await act(async () => {
        await useAuth.getState().signOut()
      })

      const state = useAuth.getState()
      expect(state.error).toBe('Sign out failed')
      expect(state.loading).toBe(false)
    })
  })

  describe('utility methods', () => {
    it('setProfile updates profile in state', () => {
      const profile = {
        id: 'user-1',
        full_name: 'Updated Name',
        role: 'viewer',
        org_id: 'org-2',
        avatar_url: 'https://example.com/avatar.png',
      }
      useAuth.getState().setProfile(profile)
      expect(useAuth.getState().profile).toEqual(profile)
    })

    it('clearError clears the error state', () => {
      useAuth.setState({ error: 'Some error' })
      useAuth.getState().clearError()
      expect(useAuth.getState().error).toBeNull()
    })
  })
})
