import { useReducer, useCallback, useMemo } from 'react'
import type { Word, LessonState, LessonAction } from '../types/lesson.types'

const XP_KNOWN = 5, XP_BONUS = 10

function reducer(state: LessonState, action: LessonAction): LessonState {
  switch (action.type) {
    case 'START_LESSON': return { ...state, lessonPhase: 'learning' }
    case 'TAP_CARD': return state.cardPhase !== 'front' ? state : { ...state, cardPhase: 'revealing' }
    case 'KNEW_IT': {
      if (state.cardPhase !== 'back') return state
      const w = state.queue[state.currentIndex]
      const attempts = [...state.attempts, { wordId: w.id, knew: true, seenAt: Date.now() }]
      const newXP = state.xpEarned + XP_KNOWN
      const next = state.currentIndex + 1
      const done = next >= state.queue.length
      return { ...state, cardPhase: done ? 'front' : 'exiting', attempts, xpEarned: done ? newXP + XP_BONUS : newXP, showXPFeedback: true, xpFeedbackAmount: XP_KNOWN, lessonPhase: done ? 'complete' : 'learning', currentIndex: done ? state.currentIndex : next }
    }
    case 'PRACTICE_AGAIN': {
      if (state.cardPhase !== 'back') return state
      const w = state.queue[state.currentIndex]
      const rem = state.queue.slice(state.currentIndex + 1)
      const ins = Math.min(2, rem.length)
      const req = [...rem.slice(0,ins), w, ...rem.slice(ins)]
      return { ...state, cardPhase: 'exiting', queue: [...state.queue.slice(0, state.currentIndex+1), ...req], attempts: [...state.attempts, { wordId: w.id, knew: false, seenAt: Date.now() }], showXPFeedback: false, currentIndex: state.currentIndex + 1 }
    }
    case 'XP_FEEDBACK_DONE': return { ...state, showXPFeedback: false }
    default: return state
  }
}

export function useLessonFlow(words: Word[], _lessonId: string) {
  const initial: LessonState = { lessonPhase: 'intro', queue: [...words], currentIndex: 0, cardPhase: 'front', attempts: [], xpEarned: 0, showXPFeedback: false, xpFeedbackAmount: 0, startedAt: Date.now() }
  const [state, dispatch] = useReducer(reducer, initial)
  const currentWord = useMemo(() => state.queue[state.currentIndex] ?? null, [state.queue, state.currentIndex])
  const knownIds = useMemo(() => { const s = new Set<string>(); state.attempts.forEach(a => { if (a.knew) s.add(a.wordId) }); return s }, [state.attempts])
  const seenIds = useMemo(() => { const s = new Set<string>(); state.attempts.forEach(a => s.add(a.wordId)); return s }, [state.attempts])
  const learnedWords = useMemo(() => words.filter(w => knownIds.has(w.id)), [words, knownIds])
  const progressRatio = knownIds.size / Math.max(words.length, 1)
  return {
    state, currentWord, totalWords: words.length, progressRatio, learnedWords, knownIds, seenIds,
    startLesson: useCallback(() => dispatch({ type: 'START_LESSON' }), []),
    tapCard: useCallback(() => dispatch({ type: 'TAP_CARD' }), []),
    knewIt: useCallback(() => dispatch({ type: 'KNEW_IT' }), []),
    practiceAgain: useCallback(() => dispatch({ type: 'PRACTICE_AGAIN' }), []),
    xpFeedbackDone: useCallback(() => dispatch({ type: 'XP_FEEDBACK_DONE' }), []),
    onCardRevealed: useCallback(() => {}, []),
    onCardExited: useCallback(() => {}, []),
  }
}
