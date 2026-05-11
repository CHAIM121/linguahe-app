import { supabase, requireUserId } from '../lib/supabase'
import type { QuizAttempt } from '../types/database.types'
import type { Database } from '../types/database.types'
import {
  awardXP,
  recordDailySession,
  getTodayLocalDate,
  incrementProfileStats,
} from './progress.service'

type QuizQuestionType = Database['public']['Enums']['quiz_question_type']

const XP_PER_CORRECT = 10

export interface QuizAnswerPayload {
  lessonId:        string
  wordId?:         string
  questionType:    QuizQuestionType
  userAnswer:      string
  correctAnswer:   string
  isCorrect:       boolean
  responseTimeMs?: number
  quizSessionId:   string
}

export async function submitQuizAnswer(
  payload: QuizAnswerPayload,
): Promise<QuizAttempt> {
  const userId     = await requireUserId()
  const xpAwarded  = payload.isCorrect ? XP_PER_CORRECT : 0

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id:          userId,
      lesson_id:        payload.lessonId,
      word_id:          payload.wordId          ?? null,
      question_type:    payload.questionType,
      user_answer:      payload.userAnswer,
      correct_answer:   payload.correctAnswer,
      is_correct:       payload.isCorrect,
      xp_awarded:       xpAwarded,
      response_time_ms: payload.responseTimeMs  ?? null,
      quiz_session_id:  payload.quizSessionId,
    })
    .select()
    .single()

  if (error) throw new Error(`submitQuizAnswer: ${error.message}`)

  if (payload.isCorrect) {
    await awardXP({
      amount:           xpAwarded,
      sourceType:       'quiz_correct',
      sourceEntityType: 'quiz_attempt',
      sourceEntityId:   (data as QuizAttempt).id,
    })
  }

  return data as QuizAttempt
}

// ── Finalize a full quiz session ──────────────────────────────────────────────

export interface QuizSessionSummary {
  lessonId:     string
  quizSessionId: string
  totalAnswers: number
  correctCount: number
  score:        number
  xpEarned:     number
  isPerfect:    boolean
}

export async function finalizeQuizSession(summary: QuizSessionSummary): Promise<void> {
  const userId = await requireUserId()

  // Fetch existing progress row (may not exist yet)
  const { data: existing } = await supabase
    .from('user_lesson_progress')
    .select('best_score, completion_count, total_xp_earned')
    .eq('user_id', userId)
    .eq('lesson_id', summary.lessonId)
    .maybeSingle()

  const ex = existing as {
    best_score: number
    completion_count: number
    total_xp_earned: number
  } | null

  await supabase
    .from('user_lesson_progress')
    .upsert(
      {
        user_id:          userId,
        lesson_id:        summary.lessonId,
        status:           'completed' as const,
        best_score:       Math.max(ex?.best_score       ?? 0, summary.score),
        completion_count: (ex?.completion_count          ?? 0) + 1,
        total_xp_earned:  (ex?.total_xp_earned           ?? 0) + summary.xpEarned,
        completed_at:     new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' },
    )

  await incrementProfileStats(userId, {
    quizzes_taken:   1,
    perfect_quizzes: summary.isPerfect ? 1 : 0,
  })

  await recordDailySession({
    sessionDate:  getTodayLocalDate(),
    xpEarned:     summary.xpEarned,
    quizAnswers:  summary.totalAnswers,
  })
}

// ── History ───────────────────────────────────────────────────────────────────

export async function fetchQuizHistory(
  userId:   string,
  lessonId: string,
  limit     = 10,
): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id',   userId)
    .eq('lesson_id', lessonId)
    .order('attempted_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`fetchQuizHistory: ${error.message}`)
  return data ?? []
}

export function generateQuizSessionId(): string {
  return crypto.randomUUID()
}
