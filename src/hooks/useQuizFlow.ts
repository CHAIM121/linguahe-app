import { useReducer, useCallback, useMemo } from 'react'
import type { Quiz, QuizState, QuizAction, QuizAttemptLocal, QuizResult, StarRating } from '../types/quiz.types'

function checkFill(user: string, correct: string): boolean {
  const n = (s: string) => s.trim().toLowerCase()
  return n(user) === n(correct)
}

function computeResult(attempts: QuizAttemptLocal[], total: number): QuizResult {
  const correct = attempts.filter(a => a.isCorrect).length
  const score = total > 0 ? Math.round((correct/total)*100) : 0
  const stars: StarRating = score >= 90 ? 3 : score >= 70 ? 2 : 1
  return { totalQuestions: total, correctCount: correct, score, xpEarned: correct*10, stars, attempts }
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START_QUIZ': return { ...state, quizPhase: 'question' }
    case 'SUBMIT_ANSWER': {
      if (state.quizPhase !== 'question') return state
      const { answer, question } = action
      const isCorrect = question.type === 'multiple_choice' ? answer === question.correctAnswer : checkFill(answer, question.correctAnswer)
      const attempt: QuizAttemptLocal = { questionId: question.id, wordId: question.wordId, questionType: question.type, userAnswer: answer, isCorrect, answeredAt: Date.now() }
      return { ...state, quizPhase: 'feedback', lastAnswer: answer, lastFeedback: isCorrect ? 'correct' : 'incorrect', attempts: [...state.attempts, attempt] }
    }
    case 'NEXT_QUESTION': {
      if (state.quizPhase !== 'feedback') return state
      const isLast = state.currentIndex >= state.attempts.length
      return { ...state, quizPhase: isLast ? 'result' : 'question', currentIndex: state.currentIndex+1, lastAnswer: '', lastFeedback: null }
    }
    case 'RETRY_QUIZ': return { quizPhase: 'intro', currentIndex: 0, attempts: [], lastAnswer: '', lastFeedback: null, startedAt: Date.now() }
    default: return state
  }
}

export function useQuizFlow(quiz: Quiz) {
  const [state, dispatch] = useReducer(quizReducer, { quizPhase: 'intro', currentIndex: 0, attempts: [], lastAnswer: '', lastFeedback: null, startedAt: Date.now() })
  const currentQuestion = useMemo(() => quiz.questions[state.currentIndex] ?? null, [quiz.questions, state.currentIndex])
  const result = useMemo(() => computeResult(state.attempts, quiz.questions.length), [state.attempts, quiz.questions.length])
  return {
    state, currentQuestion, totalQuestions: quiz.questions.length, answeredCount: state.attempts.length,
    progressRatio: state.attempts.length / Math.max(quiz.questions.length, 1),
    result, isLastQuestion: state.currentIndex === quiz.questions.length - 1,
    startQuiz: useCallback(() => dispatch({ type: 'START_QUIZ' }), []),
    submitAnswer: useCallback((answer: string) => { if (!quiz.questions[state.currentIndex]) return; dispatch({ type: 'SUBMIT_ANSWER', answer, question: quiz.questions[state.currentIndex] }) }, [quiz.questions, state.currentIndex]),
    nextQuestion: useCallback(() => dispatch({ type: 'NEXT_QUESTION' }), []),
    retryQuiz: useCallback(() => dispatch({ type: 'RETRY_QUIZ' }), []),
  }
}
