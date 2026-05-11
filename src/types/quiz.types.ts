export type QuestionType = 'multiple_choice' | 'fill_blank'
export type StarRating = 1 | 2 | 3
export type QuizPhase = 'intro' | 'question' | 'feedback' | 'result'
export type FeedbackState = 'correct' | 'incorrect' | null

export interface MultipleChoiceQuestion {
  id: string; type: 'multiple_choice'; promptEn: string; promptEmoji: string
  correctAnswer: string; options: string[]; correctIndex: number; wordId: string
}
export interface FillBlankQuestion {
  id: string; type: 'fill_blank'; promptHe: string; promptTranslit: string
  promptEmoji: string; correctAnswer: string; wordId: string
}
export type QuizQuestion = MultipleChoiceQuestion | FillBlankQuestion

export interface QuizAttemptLocal {
  questionId: string; wordId: string; questionType: QuestionType
  userAnswer: string; isCorrect: boolean; answeredAt: number
}
export interface Quiz { id: string; lessonId: string; questions: QuizQuestion[] }
export interface QuizResult {
  totalQuestions: number; correctCount: number; score: number
  xpEarned: number; stars: StarRating; attempts: QuizAttemptLocal[]
}
export interface QuizState {
  quizPhase: QuizPhase; currentIndex: number; attempts: QuizAttemptLocal[]
  lastAnswer: string; lastFeedback: FeedbackState; startedAt: number
}
export type QuizAction =
  | { type: 'START_QUIZ' }
  | { type: 'SUBMIT_ANSWER'; answer: string; question: QuizQuestion }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RETRY_QUIZ' }
