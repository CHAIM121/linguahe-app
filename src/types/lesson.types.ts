export interface Word {
  id: string
  english: string
  hebrew: string
  transliteration: string
  audioUrl?: string
  exampleEn: string
  exampleHe: string
  imageEmoji?: string
}

export type CardPhase = 'front' | 'revealing' | 'back' | 'exiting'
export type LessonPhase = 'intro' | 'learning' | 'complete'

export interface WordAttempt { wordId: string; knew: boolean; seenAt: number }

export interface LessonState {
  lessonPhase: LessonPhase
  queue: Word[]
  currentIndex: number
  cardPhase: CardPhase
  attempts: WordAttempt[]
  xpEarned: number
  showXPFeedback: boolean
  xpFeedbackAmount: number
  startedAt: number
}

export type LessonAction =
  | { type: 'START_LESSON' }
  | { type: 'TAP_CARD' }
  | { type: 'KNEW_IT' }
  | { type: 'PRACTICE_AGAIN' }
  | { type: 'XP_FEEDBACK_DONE' }
