import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database.types'
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signOut as authSignOut, fetchProfile, updateProfile, sendPasswordResetEmail, onAuthStateChange } from '../services/auth.service'
import type { ProfileUpdatePayload } from '../services/auth.service'

export interface AuthContextValue {
  user: User|null; session: Session|null; profile: Profile|null
  isAuthenticated: boolean; isLoading: boolean; error: string|null
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (payload: ProfileUpdatePayload) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue|null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User|null>(null)
  const [session, setSession] = useState<Session|null>(null)
  const [profile, setProfile] = useState<Profile|null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  const loadProfile = useCallback(async (uid: string) => {
    try { const p = await fetchProfile(uid); if (mounted.current) setProfile(p) }
    catch (e) { console.warn('[Auth] loadProfile:', e) }
  }, [])

  useEffect(() => {
    let unsub: (() => void)|undefined
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (s?.user && mounted.current) { setSession(s); setUser(s.user); await loadProfile(s.user.id) }
      } catch (e) { console.error('[Auth] init:', e) }
      finally { if (mounted.current) setIsLoading(false) }
      unsub = onAuthStateChange(async (event, s) => {
        if (!mounted.current) return
        setSession(s); setUser(s?.user ?? null)
        if (event === 'SIGNED_IN' && s?.user) await loadProfile(s.user.id)
        if (event === 'SIGNED_OUT') { setProfile(null); setError(null) }
      })
    }
    init()
    return () => { unsub?.() }
  }, [loadProfile])

  const signUp = useCallback(async (email: string, pw: string, name: string) => {
    setError(null)
    const { error: e } = await signUpWithEmail(email, pw, name)
    if (e) { setError(e.message); throw e }
  }, [])

  const signIn = useCallback(async (email: string, pw: string) => {
    setError(null)
    const { error: e } = await signInWithEmail(email, pw)
    if (e) { setError(e.message); throw e }
  }, [])

  const handleGoogle = useCallback(async () => {
    setError(null)
    const { error: e } = await signInWithGoogle()
    if (e) { setError(e.message); throw e }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    const { error: e } = await authSignOut()
    if (e) { setError(e.message); throw e }
  }, [])

  const updateUserProfile = useCallback(async (payload: ProfileUpdatePayload) => {
    if (!user) throw new Error('Not authenticated')
    setError(null)
    await updateProfile(user.id, payload)
    await loadProfile(user.id)
  }, [user, loadProfile])

  const sendPasswordReset = useCallback(async (email: string) => {
    setError(null)
    const { error: e } = await sendPasswordResetEmail(email)
    if (e) { setError(e.message); throw e }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user.id)
  }, [user, loadProfile])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(() => ({
    user, session, profile, isAuthenticated: !!user, isLoading, error,
    signUp, signIn, signInWithGoogle: handleGoogle, signOut,
    updateUserProfile, sendPasswordReset, refreshProfile, clearError,
  }), [user, session, profile, isLoading, error, signUp, signIn, handleGoogle, signOut, updateUserProfile, sendPasswordReset, refreshProfile, clearError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>')
  return ctx
}
