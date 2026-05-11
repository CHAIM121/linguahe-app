import { supabase, requireUserId } from '../lib/supabase'
import type { Profile, DailySession, XPEvent } from '../types/database.types'
import type { Database } from '../types/database.types'

type XPSourceType = Database['public']['Enums']['xp_source_type']

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`fetchUserProfile: ${error.message}`)
  }
  return data
}

// ── Award XP via DB RPC ───────────────────────────────────────────────────────

export interface AwardXPPayload {
  amount: number
  sourceType: XPSourceType
  sourceEntityType?: string
  sourceEntityId?: string
}

export interface AwardXPResult {
  newTotalXP: number
  newLevel: number
  leveledUp: boolean
}

export async function awardXP(payload: AwardXPPayload): Promise<AwardXPResult> {
  const userId = await requireUserId()

  // Snapshot level before awarding
  const { data: before } = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', userId)
    .single()
  const levelBefore = (before as { current_level: number } | null)?.current_level ?? 1

  const { data, error } = await supabase.rpc('award_xp', {
    p_user_id: userId,
    p_amount: payload.amount,
    p_source_type: payload.sourceType,
    p_source_entity_type: payload.sourceEntityType ?? null,
    p_source_entity_id: payload.sourceEntityId ?? null,
  })

  if (error) throw new Error(`awardXP: ${error.message}`)

  // data is Array<{ new_total_xp: number; new_level: number }> per our DB types
  const rows = data as Array<{ new_total_xp: number; new_level: number }> | null
  const row = rows?.[0]
  const newTotalXP = row?.new_total_xp ?? 0
  const newLevel   = row?.new_level   ?? levelBefore

  return { newTotalXP, newLevel, leveledUp: newLevel > levelBefore }
}

// ── Daily session ─────────────────────────────────────────────────────────────

export function getTodayLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface RecordSessionPayload {
  sessionDate: string
  xpEarned?: number
  lessonsCompleted?: number
  wordsReviewed?: number
  quizAnswers?: number
  activeSeconds?: number
}

export interface RecordSessionResult {
  currentStreak: number
  longestStreak: number
  isNewDay: boolean
}

export async function recordDailySession(
  payload: RecordSessionPayload,
): Promise<RecordSessionResult> {
  const userId = await requireUserId()

  const { data, error } = await supabase.rpc('record_daily_session', {
    p_user_id:           userId,
    p_session_date:      payload.sessionDate,
    p_xp_earned:         payload.xpEarned        ?? 0,
    p_lessons_completed: payload.lessonsCompleted ?? 0,
    p_words_reviewed:    payload.wordsReviewed    ?? 0,
    p_quiz_answers:      payload.quizAnswers      ?? 0,
    p_active_seconds:    payload.activeSeconds    ?? 0,
  })

  if (error) throw new Error(`recordDailySession: ${error.message}`)

  const rows = data as Array<{ current_streak: number; longest_streak: number; is_new_day: boolean }> | null
  const row  = rows?.[0]

  return {
    currentStreak: row?.current_streak ?? 0,
    longestStreak: row?.longest_streak ?? 0,
    isNewDay:      row?.is_new_day     ?? false,
  }
}

// ── History ───────────────────────────────────────────────────────────────────

export async function fetchRecentDailySessions(
  userId: string,
  limitDays = 60,
): Promise<DailySession[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - limitDays)
  const { data, error } = await supabase
    .from('daily_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('session_date', cutoff.toISOString().slice(0, 10))
    .order('session_date', { ascending: false })
  if (error) throw new Error(`fetchRecentDailySessions: ${error.message}`)
  return data ?? []
}

export async function fetchXPHistory(userId: string, limit = 20): Promise<XPEvent[]> {
  const { data, error } = await supabase
    .from('xp_events')
    .select('*')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`fetchXPHistory: ${error.message}`)
  return data ?? []
}

// ── Profile stat increments ───────────────────────────────────────────────────

export interface StatIncrement {
  lessons_completed?: number
  words_learned?: number
  quizzes_taken?: number
  perfect_quizzes?: number
}

export async function incrementProfileStats(
  userId: string,
  inc: StatIncrement,
): Promise<void> {
  // Fetch current values
  const { data: cur, error: fe } = await supabase
    .from('profiles')
    .select('lessons_completed, words_learned, quizzes_taken, perfect_quizzes')
    .eq('id', userId)
    .single()

  if (fe) throw new Error(`incrementProfileStats fetch: ${fe.message}`)
  if (!cur) return

  // Build the update object — typed as the profiles Update shape
  type ProfileCounts = Pick<Profile, 'lessons_completed' | 'words_learned' | 'quizzes_taken' | 'perfect_quizzes'>
  const u: Partial<ProfileCounts> = {}

  const row = cur as ProfileCounts
  if (inc.lessons_completed) u.lessons_completed = (row.lessons_completed ?? 0) + inc.lessons_completed
  if (inc.words_learned)     u.words_learned     = (row.words_learned     ?? 0) + inc.words_learned
  if (inc.quizzes_taken)     u.quizzes_taken     = (row.quizzes_taken     ?? 0) + inc.quizzes_taken
  if (inc.perfect_quizzes)   u.perfect_quizzes   = (row.perfect_quizzes   ?? 0) + inc.perfect_quizzes

  if (Object.keys(u).length === 0) return

  const { error } = await supabase
    .from('profiles')
    .update(u)
    .eq('id', userId)

  if (error) throw new Error(`incrementProfileStats update: ${error.message}`)
}

// ── Realtime ──────────────────────────────────────────────────────────────────

export function subscribeToProfile(
  userId: string,
  onChange: (p: Profile) => void,
): () => void {
  const channel = supabase
    .channel(`profile-${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
      (payload) => { onChange(payload.new as Profile) },
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}
