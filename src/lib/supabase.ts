import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || supabaseUrl.trim() === '') {
  throw new Error('[LinguaHe] VITE_SUPABASE_URL is missing. Copy .env.example to .env and fill in your Supabase project URL.')
}
if (!supabaseKey || supabaseKey.trim() === '') {
  throw new Error('[LinguaHe] VITE_SUPABASE_ANON_KEY is missing. Copy .env.example to .env and fill in your Supabase anon key.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'linguahe-auth',
  },
  global: { headers: { 'x-client-info': 'linguahe-web/1.0' } },
})

export async function requireUserId(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw new Error(`Auth error: ${error.message}`)
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

export type { Database }
