import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { fetchUserProfile, fetchRecentDailySessions, awardXP, recordDailySession, subscribeToProfile, getTodayLocalDate } from '../services/progress.service'
import type { AwardXPPayload, RecordSessionPayload } from '../services/progress.service'
import { fetchAchievementsWithStatus, checkAndUnlockAchievements } from '../services/achievements.service'
import type { UserMetrics } from '../services/achievements.service'
import type { Profile } from '../types/database.types'

const P = 1000*30, A = 1000*60*5

export function useUserProgress() {
  const { user } = useAuth(); const qc = useQueryClient()
  const query = useQuery({ queryKey: ['user-progress', user?.id], queryFn: () => fetchUserProfile(user!.id), enabled: !!user?.id, staleTime: P, retry: 2 })
  useEffect(() => {
    if (!user?.id) return
    return subscribeToProfile(user.id, (p) => { qc.setQueryData(['user-progress', user.id], p) })
  }, [user?.id, qc])
  return query
}

export function useDailySessions(limitDays=60) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['daily-sessions', user?.id, limitDays], queryFn: () => fetchRecentDailySessions(user!.id, limitDays), enabled: !!user?.id, staleTime: P, retry: 2 })
}

export function useAchievements() {
  const { user } = useAuth()
  return useQuery({ queryKey: ['achievements', user?.id], queryFn: () => fetchAchievementsWithStatus(user!.id), enabled: !!user?.id, staleTime: A, retry: 2 })
}

export function useAwardXP() {
  const qc = useQueryClient(); const { user, refreshProfile } = useAuth()
  return useMutation({
    mutationFn: (p: AwardXPPayload) => awardXP(p),
    onSuccess: (r) => {
      qc.setQueryData(['user-progress', user?.id], (old: Profile|null|undefined) => old ? { ...old, total_xp: r.newTotalXP, current_level: r.newLevel } : old)
      refreshProfile()
    },
    onError: (e) => { console.error('[useAwardXP]', e); qc.invalidateQueries({ queryKey: ['user-progress', user?.id] }) },
  })
}

export function useRecordDailySession() {
  const qc = useQueryClient(); const { user, refreshProfile } = useAuth()
  return useMutation({
    mutationFn: (p: RecordSessionPayload) => recordDailySession(p),
    onSuccess: (r) => {
      qc.setQueryData(['user-progress', user?.id], (old: Profile|null|undefined) => old ? { ...old, current_streak: r.currentStreak, longest_streak: r.longestStreak } : old)
      qc.invalidateQueries({ queryKey: ['daily-sessions', user?.id] })
      refreshProfile()
    },
  })
}

export function useCheckAchievements() {
  const qc = useQueryClient(); const { user } = useAuth()
  return useMutation({
    mutationFn: (m: UserMetrics) => { if (!user) throw new Error('Not authenticated'); return checkAndUnlockAchievements(user.id, m) },
    onSuccess: (ne) => {
      if (ne.length > 0) { qc.invalidateQueries({ queryKey: ['achievements', user?.id] }); qc.invalidateQueries({ queryKey: ['user-progress', user?.id] }) }
    },
  })
}

export function useDailyGoalStatus() {
  const { data: sessions, isLoading } = useDailySessions(1)
  const { data: profile } = useUserProgress()
  const today = getTodayLocalDate()
  const todayRow = sessions?.find(s => s.session_date === today)
  const goalLessons = profile?.daily_goal_lessons ?? 3
  const completedToday = todayRow?.lessons_completed ?? 0
  return { goalLessons, completedToday, isComplete: completedToday >= goalLessons, progress: Math.min(completedToday/goalLessons, 1), isLoading }
}

export function useActiveDates(limitDays=60): string[] {
  const { data: sessions } = useDailySessions(limitDays)
  return (sessions ?? []).map(s => s.session_date)
}
