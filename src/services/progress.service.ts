import { supabase, requireUserId } from '../lib/supabase'
import type { Profile, DailySession, XPEvent } from '../types/database.types'
import type { Database } from '../types/database.types'

type XPSourceType = Database['public']['Enums']['xp_source_type']

export async function fetchUserProfile(userId: string): Promise<Profile|null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(`fetchUserProfile: ${error.message}`) }
  return data
}

export interface AwardXPPayload { amount: number; sourceType: XPSourceType; sourceEntityType?: string; sourceEntityId?: string }
export interface AwardXPResult { newTotalXP: number; newLevel: number; leveledUp: boolean }

export async function awardXP(payload: AwardXPPayload): Promise<AwardXPResult> {
  const userId = await requireUserId()
  const { data: before } = await supabase.from('profiles').select('current_level').eq('id', userId).single()
  const levelBefore = before?.current_level ?? 1
  const { data, error } = await supabase.rpc('award_xp', { p_user_id: userId, p_amount: payload.amount, p_source_type: payload.sourceType, p_source_entity_type: payload.sourceEntityType ?? null, p_source_entity_id: payload.sourceEntityId ?? null })
  if (error) throw new Error(`awardXP: ${error.message}`)
  const r = Array.isArray(data) ? data[0] : data
  const newLevel = r?.new_level ?? levelBefore
  return { newTotalXP: r?.new_total_xp ?? 0, newLevel, leveledUp: newLevel > levelBefore }
}

export function getTodayLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export interface RecordSessionPayload { sessionDate: string; xpEarned?: number; lessonsCompleted?: number; wordsReviewed?: number; quizAnswers?: number; activeSeconds?: number }
export interface RecordSessionResult { currentStreak: number; longestStreak: number; isNewDay: boolean }

export async function recordDailySession(payload: RecordSessionPayload): Promise<RecordSessionResult> {
  const userId = await requireUserId()
  const { data, error } = await supabase.rpc('record_daily_session', { p_user_id: userId, p_session_date: payload.sessionDate, p_xp_earned: payload.xpEarned??0, p_lessons_completed: payload.lessonsCompleted??0, p_words_reviewed: payload.wordsReviewed??0, p_quiz_answers: payload.quizAnswers??0, p_active_seconds: payload.activeSeconds??0 })
  if (error) throw new Error(`recordDailySession: ${error.message}`)
  const r = Array.isArray(data) ? data[0] : data
  return { currentStreak: r?.current_streak??0, longestStreak: r?.longest_streak??0, isNewDay: r?.is_new_day??false }
}

export async function fetchRecentDailySessions(userId: string, limitDays=60): Promise<DailySession[]> {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-limitDays)
  const { data, error } = await supabase.from('daily_sessions').select('*').eq('user_id', userId).gte('session_date', cutoff.toISOString().slice(0,10)).order('session_date', { ascending: false })
  if (error) throw new Error(`fetchRecentDailySessions: ${error.message}`)
  return data ?? []
}

export async function fetchXPHistory(userId: string, limit=20): Promise<XPEvent[]> {
  const { data, error } = await supabase.from('xp_events').select('*').eq('user_id', userId).order('occurred_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`fetchXPHistory: ${error.message}`)
  return data ?? []
}

export interface StatIncrement { lessons_completed?: number; words_learned?: number; quizzes_taken?: number; perfect_quizzes?: number }

export async function incrementProfileStats(userId: string, inc: StatIncrement): Promise<void> {
  const { data: cur, error: fe } = await supabase.from('profiles').select('lessons_completed,words_learned,quizzes_taken,perfect_quizzes').eq('id', userId).single()
  if (fe) throw new Error(`incrementProfileStats: ${fe.message}`)
  if (!cur) return
  const u: Partial<Profile> = {}
  if (inc.lessons_completed) u.lessons_completed = (cur.lessons_completed??0)+inc.lessons_completed
  if (inc.words_learned) u.words_learned = (cur.words_learned??0)+inc.words_learned
  if (inc.quizzes_taken) u.quizzes_taken = (cur.quizzes_taken??0)+inc.quizzes_taken
  if (inc.perfect_quizzes) u.perfect_quizzes = (cur.perfect_quizzes??0)+inc.perfect_quizzes
  if (!Object.keys(u).length) return
  const { error } = await supabase.from('profiles').update(u).eq('id', userId)
  if (error) throw new Error(`incrementProfileStats update: ${error.message}`)
}

export function subscribeToProfile(userId: string, onChange: (p: Profile) => void): () => void {
  const ch = supabase.channel(`profile-${userId}`)
    .on('postgres_changes', { event:'UPDATE', schema:'public', table:'profiles', filter:`id=eq.${userId}` }, p => onChange(p.new as Profile))
    .subscribe()
  return () => { supabase.removeChannel(ch) }
}
