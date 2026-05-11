import { supabase } from '../lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { Profile } from '../types/database.types'

export interface AuthResult { user: User|null; session: Session|null; error: AuthError|null }
export interface ProfileUpdatePayload {
  display_name?: string; daily_goal_lessons?: number
  daily_reminder_time?: string|null; onboarding_completed?: boolean
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: displayName } } })
  return { user: data.user, session: data.session, error }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data.user, session: data.session, error }
}

export async function signInWithGoogle(): Promise<{ error: AuthError|null }> {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  return { error }
}

export async function signOut(): Promise<{ error: AuthError|null }> {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession(): Promise<Session|null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function fetchProfile(userId: string): Promise<Profile|null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(`fetchProfile: ${error.message}`) }
  return data
}

export async function updateProfile(userId: string, payload: ProfileUpdatePayload): Promise<void> {
  const { error } = await supabase.from('profiles').update(payload).eq('id', userId)
  if (error) throw new Error(`updateProfile: ${error.message}`)
}

export async function sendPasswordResetEmail(email: string): Promise<{ error: AuthError|null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` })
  return { error }
}

export function onAuthStateChange(callback: (event: string, session: Session|null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}
