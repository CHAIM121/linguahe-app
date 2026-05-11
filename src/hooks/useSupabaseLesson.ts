import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTopicsWithLessons, fetchLessonWithWords, fetchUserLessonProgress, markLessonStarted, markLessonComplete } from '../services/lessons.service'
import type { LessonCompletePayload } from '../services/lessons.service'
import { recordDailySession, getTodayLocalDate, incrementProfileStats } from '../services/progress.service'
import { checkAndUnlockAchievements } from '../services/achievements.service'
import { useAuth } from '../providers/AuthProvider'

const C = 1000*60*60, P = 1000*30

export function useTopicsWithLessons() {
  return useQuery({ queryKey: ['topics-with-lessons'], queryFn: fetchTopicsWithLessons, staleTime: C, retry: 2 })
}

export function useLessonWithWords(lessonId: string|null|undefined) {
  return useQuery({ queryKey: ['lesson-with-words', lessonId], queryFn: () => fetchLessonWithWords(lessonId!), enabled: !!lessonId, staleTime: C, retry: 2 })
}

export function useUserLessonProgress() {
  const { user } = useAuth()
  return useQuery({ queryKey: ['lesson-progress', user?.id], queryFn: () => fetchUserLessonProgress(user!.id), enabled: !!user?.id, staleTime: P, retry: 2 })
}

export function useMarkLessonStarted() {
  const qc = useQueryClient(); const { user } = useAuth()
  return useMutation({
    mutationFn: markLessonStarted,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lesson-progress', user?.id] }) },
  })
}

export function useCompleteLesson() {
  const qc = useQueryClient(); const { user, profile, refreshProfile } = useAuth()
  return useMutation({
    mutationFn: async (payload: LessonCompletePayload) => {
      if (!user) throw new Error('Not authenticated')
      await markLessonComplete(payload)
      await incrementProfileStats(user.id, { lessons_completed: 1, words_learned: payload.wordsLearned })
      const sr = await recordDailySession({ sessionDate: getTodayLocalDate(), xpEarned: payload.xpEarned, lessonsCompleted: 1, wordsReviewed: payload.wordsLearned })
      const ne = await checkAndUnlockAchievements(user.id, {
        lessonsCompleted: (profile?.lessons_completed??0)+1,
        streakDays: sr.currentStreak,
        wordsLearned: (profile?.words_learned??0)+payload.wordsLearned,
        perfectQuizzes: profile?.perfect_quizzes??0,
        currentLevel: profile?.current_level??1,
        totalXP: (profile?.total_xp??0)+payload.xpEarned,
      })
      return { sr, ne }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-progress', user?.id] })
      qc.invalidateQueries({ queryKey: ['user-progress', user?.id] })
      qc.invalidateQueries({ queryKey: ['achievements', user?.id] })
      refreshProfile()
    },
    onError: (e) => { console.error('[useCompleteLesson]', e) },
  })
}
