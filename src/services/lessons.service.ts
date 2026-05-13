import { supabase } from './supabase'

export interface Word {
  id: string
  lesson_id: string
  english: string
  hebrew: string
  transliteration: string | null
  example_sentence: string | null
  example_translation: string | null
  audio_url: string | null
  order_index: number
}

export interface Lesson {
  id: string
  title: string
  description: string | null
  difficulty: string
  xp_reward: number
  order_index: number
}

export async function getLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('order_index')
  if (error) throw error
  return data ?? []
}

export async function getLessonWords(lessonId: string): Promise<Word[]> {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('order_index')
  if (error) throw error
  return data ?? []
}

export async function saveProgress(userId: string, lessonId: string, score: number) {
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      score,
      completed_at: new Date().toISOString(),
    })
  if (error) throw error
}

export async function getUserProgress(userId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function awardXp(userId: string, xpAmount: number) {
  try {
    await supabase.rpc('award_xp', { user_id: userId, xp_amount: xpAmount })
  } catch {
    // fallback: update directly
    const profile = await getProfile(userId)
    if (profile) {
      await supabase
        .from('profiles')
        .update({
          xp: profile.xp + xpAmount,
          lessons_completed: profile.lessons_completed + 1,
        })
        .eq('id', userId)
    }
  }
}
