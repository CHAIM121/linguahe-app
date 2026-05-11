import { supabase, requireUserId } from '../lib/supabase'
import type { Topic, Lesson, LessonWord, LessonWithWords, TopicWithLessons, UserLessonProgress } from '../types/database.types'

export async function fetchTopics(): Promise<Topic[]> {
  const { data, error } = await supabase.from('topics').select('*').eq('is_active', true).order('order_index', { ascending: true })
  if (error) throw new Error(`fetchTopics: ${error.message}`)
  return data ?? []
}

export async function fetchTopicsWithLessons(): Promise<TopicWithLessons[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*, lessons(id,slug,title_en,title_he,description_he,difficulty,estimated_minutes,xp_reward,order_index,is_active)')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .order('order_index', { ascending: true, referencedTable: 'lessons' })
  if (error) throw new Error(`fetchTopicsWithLessons: ${error.message}`)
  return (data ?? []) as TopicWithLessons[]
}

export async function fetchLesson(lessonId: string): Promise<Lesson|null> {
  const { data, error } = await supabase.from('lessons').select('*').eq('id', lessonId).eq('is_active', true).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(`fetchLesson: ${error.message}`) }
  return data
}

export async function fetchLessonWithWords(lessonId: string): Promise<LessonWithWords|null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*, lesson_words(id,english_word,hebrew_translation,transliteration,example_sentence_en,example_sentence_he,audio_url,image_emoji,order_index)')
    .eq('id', lessonId)
    .eq('is_active', true)
    .order('order_index', { ascending: true, referencedTable: 'lesson_words' })
    .single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(`fetchLessonWithWords: ${error.message}`) }
  return data as LessonWithWords
}

export async function fetchLessonWords(lessonId: string): Promise<LessonWord[]> {
  const { data, error } = await supabase.from('lesson_words').select('*').eq('lesson_id', lessonId).order('order_index', { ascending: true })
  if (error) throw new Error(`fetchLessonWords: ${error.message}`)
  return data ?? []
}

export async function markLessonStarted(lessonId: string): Promise<void> {
  const userId = await requireUserId()
  const { error } = await supabase.from('user_lesson_progress').upsert(
    { user_id: userId, lesson_id: lessonId, status: 'in_progress', first_started_at: new Date().toISOString() },
    { onConflict: 'user_id,lesson_id', ignoreDuplicates: false }
  )
  if (error) throw new Error(`markLessonStarted: ${error.message}`)
}

export interface LessonCompletePayload { lessonId: string; wordsLearned: number; xpEarned: number }

export async function markLessonComplete(payload: LessonCompletePayload): Promise<void> {
  const userId = await requireUserId()
  const { error } = await supabase.from('user_lesson_progress').upsert(
    { user_id: userId, lesson_id: payload.lessonId, status: 'completed', completion_count: 1, total_xp_earned: payload.xpEarned, completed_at: new Date().toISOString() },
    { onConflict: 'user_id,lesson_id' }
  )
  if (error) throw new Error(`markLessonComplete: ${error.message}`)
  const { error: xpError } = await supabase.rpc('award_xp', { p_user_id: userId, p_amount: payload.xpEarned, p_source_type: 'lesson_complete', p_source_entity_type: 'lesson', p_source_entity_id: payload.lessonId })
  if (xpError) throw new Error(`markLessonComplete XP: ${xpError.message}`)
}

export async function fetchUserLessonProgress(userId: string): Promise<UserLessonProgress[]> {
  const { data, error } = await supabase.from('user_lesson_progress').select('*').eq('user_id', userId)
  if (error) throw new Error(`fetchUserLessonProgress: ${error.message}`)
  return data ?? []
}

export async function fetchSingleLessonProgress(userId: string, lessonId: string): Promise<UserLessonProgress|null> {
  const { data, error } = await supabase.from('user_lesson_progress').select('*').eq('user_id', userId).eq('lesson_id', lessonId).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(`fetchSingleLessonProgress: ${error.message}`) }
  return data
}
