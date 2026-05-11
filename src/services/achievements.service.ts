import { supabase } from '../lib/supabase'
import type { Achievement, UserAchievement, AchievementWithStatus } from '../types/database.types'
import type { Database } from '../types/database.types'
import { awardXP } from './progress.service'

type AchievementCondition = Database['public']['Enums']['achievement_condition']

export async function fetchAllAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  if (error) throw new Error(`fetchAllAchievements: ${error.message}`)
  return data ?? []
}

export async function fetchUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
  if (error) throw new Error(`fetchUserAchievements: ${error.message}`)
  return data ?? []
}

export async function fetchAchievementsWithStatus(userId: string): Promise<AchievementWithStatus[]> {
  const [all, userAch] = await Promise.all([
    fetchAllAchievements(),
    fetchUserAchievements(userId),
  ])
  const earned = new Map(userAch.map(ua => [ua.achievement_id, ua.earned_at]))
  return all.map(a => ({ ...a, earned_at: earned.get(a.id) ?? null }))
}

async function awardAchievement(userId: string, a: Achievement): Promise<boolean> {
  const { error } = await supabase
    .from('user_achievements')
    .insert({
      user_id:        userId,
      achievement_id: a.id,
      xp_awarded:     a.xp_bonus,
    })

  if (error && error.code !== '23505') {
    console.warn(`awardAchievement (${a.slug}): ${error.message}`)
    return false
  }

  if (!error && a.xp_bonus > 0) {
    await awardXP({
      amount:           a.xp_bonus,
      sourceType:       'achievement_unlock',
      sourceEntityType: 'achievement',
      sourceEntityId:   a.id,
    })
  }

  return !error
}

export interface UserMetrics {
  lessonsCompleted: number
  streakDays:       number
  wordsLearned:     number
  perfectQuizzes:   number
  currentLevel:     number
  totalXP:          number
}

export async function checkAndUnlockAchievements(
  userId:  string,
  metrics: UserMetrics,
): Promise<Achievement[]> {
  const [all, userAch] = await Promise.all([
    fetchAllAchievements(),
    fetchUserAchievements(userId),
  ])
  const alreadyEarned = new Set(userAch.map(ua => ua.achievement_id))

  const meets = (type: AchievementCondition, val: number): boolean => {
    switch (type) {
      case 'lessons_completed': return metrics.lessonsCompleted >= val
      case 'streak_days':       return metrics.streakDays       >= val
      case 'words_learned':     return metrics.wordsLearned     >= val
      case 'perfect_quizzes':   return metrics.perfectQuizzes   >= val
      case 'level_reached':     return metrics.currentLevel     >= val
      case 'xp_total':          return metrics.totalXP          >= val
      default:                  return false
    }
  }

  const newlyEarned: Achievement[] = []
  for (const a of all) {
    if (alreadyEarned.has(a.id)) continue
    if (meets(a.condition_type, a.condition_value)) {
      const awarded = await awardAchievement(userId, a)
      if (awarded) newlyEarned.push(a)
    }
  }
  return newlyEarned
}
