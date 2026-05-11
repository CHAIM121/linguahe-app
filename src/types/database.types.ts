export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      topics: {
        Row: { id: string; slug: string; title_en: string; title_he: string; description_he: string | null; icon_emoji: string; order_index: number; min_level: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['topics']['Row'], 'id'|'created_at'|'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['topics']['Insert']>
      }
      lessons: {
        Row: { id: string; topic_id: string; slug: string; title_en: string; title_he: string; description_he: string | null; difficulty: 1|2|3; estimated_minutes: number; xp_reward: number; order_index: number; is_ai_generated: boolean; is_active: boolean; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['lessons']['Row'], 'id'|'created_at'|'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>
      }
      lesson_words: {
        Row: { id: string; lesson_id: string; english_word: string; hebrew_translation: string; transliteration: string; example_sentence_en: string | null; example_sentence_he: string | null; audio_url: string | null; image_emoji: string | null; order_index: number; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['lesson_words']['Row'], 'id'|'created_at'|'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['lesson_words']['Insert']>
      }
      achievements: {
        Row: { id: string; slug: string; title_he: string; description_he: string; emoji: string; condition_type: Database['public']['Enums']['achievement_condition']; condition_value: number; order_index: number; xp_bonus: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id'|'created_at'|'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }
      profiles: {
        Row: { id: string; display_name: string; avatar_url: string | null; native_language: string; target_language: string; total_xp: number; current_level: number; current_streak: number; longest_streak: number; lessons_completed: number; words_learned: number; quizzes_taken: number; perfect_quizzes: number; daily_goal_lessons: number; daily_reminder_time: string | null; onboarding_completed: boolean; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'|'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Pick<Database['public']['Tables']['profiles']['Row'], 'display_name'|'avatar_url'|'daily_goal_lessons'|'daily_reminder_time'|'onboarding_completed'>>
      }
      user_lesson_progress: {
        Row: { id: string; user_id: string; lesson_id: string; status: Database['public']['Enums']['lesson_status']; best_score: number; completion_count: number; total_xp_earned: number; next_review_at: string | null; first_started_at: string | null; completed_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; lesson_id: string; status?: Database['public']['Enums']['lesson_status']; best_score?: number; completion_count?: number; total_xp_earned?: number; next_review_at?: string | null; first_started_at?: string | null; completed_at?: string | null; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Database['public']['Tables']['user_lesson_progress']['Insert'], 'user_id'|'lesson_id'>>
      }
      quiz_attempts: {
        Row: { id: string; user_id: string; lesson_id: string; word_id: string | null; question_type: Database['public']['Enums']['quiz_question_type']; user_answer: string; correct_answer: string; is_correct: boolean; xp_awarded: number; response_time_ms: number | null; quiz_session_id: string; attempted_at: string }
        Insert: Omit<Database['public']['Tables']['quiz_attempts']['Row'], 'id'|'attempted_at'> & { id?: string; attempted_at?: string }
        Update: never
      }
      daily_sessions: {
        Row: { id: string; user_id: string; session_date: string; xp_earned: number; lessons_completed: number; words_reviewed: number; quiz_answers: number; active_seconds: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; session_date: string; xp_earned?: number; lessons_completed?: number; words_reviewed?: number; quiz_answers?: number; active_seconds?: number; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Database['public']['Tables']['daily_sessions']['Insert'], 'user_id'|'session_date'>>
      }
      user_achievements: {
        Row: { id: string; user_id: string; achievement_id: string; xp_awarded: number; earned_at: string }
        Insert: { id?: string; user_id: string; achievement_id: string; xp_awarded?: number; earned_at?: string }
        Update: never
      }
      xp_events: {
        Row: { id: string; user_id: string; source_type: Database['public']['Enums']['xp_source_type']; amount: number; source_entity_type: string | null; source_entity_id: string | null; balance_after: number; occurred_at: string }
        Insert: Omit<Database['public']['Tables']['xp_events']['Row'], 'id'|'occurred_at'> & { id?: string; occurred_at?: string }
        Update: never
      }
    }
    Functions: {
      calculate_level: { Args: { p_total_xp: number }; Returns: number }
      award_xp: { Args: { p_user_id: string; p_amount: number; p_source_type: Database['public']['Enums']['xp_source_type']; p_source_entity_type?: string; p_source_entity_id?: string }; Returns: Array<{ new_total_xp: number; new_level: number }> }
      record_daily_session: { Args: { p_user_id: string; p_session_date: string; p_xp_earned?: number; p_lessons_completed?: number; p_words_reviewed?: number; p_quiz_answers?: number; p_active_seconds?: number }; Returns: Array<{ current_streak: number; longest_streak: number; is_new_day: boolean }> }
    }
    Enums: {
      achievement_condition: 'lessons_completed'|'streak_days'|'words_learned'|'perfect_quizzes'|'level_reached'|'xp_total'
      lesson_status: 'available'|'in_progress'|'completed'
      quiz_question_type: 'multiple_choice'|'fill_blank'
      xp_source_type: 'lesson_complete'|'quiz_correct'|'achievement_unlock'|'streak_bonus'|'daily_bonus'|'admin_adjustment'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Profile = Tables<'profiles'>
export type Lesson = Tables<'lessons'>
export type Topic = Tables<'topics'>
export type LessonWord = Tables<'lesson_words'>
export type Achievement = Tables<'achievements'>
export type UserLessonProgress = Tables<'user_lesson_progress'>
export type QuizAttempt = Tables<'quiz_attempts'>
export type DailySession = Tables<'daily_sessions'>
export type UserAchievement = Tables<'user_achievements'>
export type XPEvent = Tables<'xp_events'>
export interface LessonWithWords extends Lesson { lesson_words: LessonWord[] }
export interface TopicWithLessons extends Topic { lessons: Lesson[] }
export interface AchievementWithStatus extends Achievement { earned_at: string | null }
