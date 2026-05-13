import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProfile, getUserProgress, getLessons } from '../services/lessons.service'

export default function ProgressPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<{ xp: number; level: number; lessons_completed: number; streak: number; words_learned: number } | null>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalLessons, setTotalLessons] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const [p, prog, ls] = await Promise.all([
          getProfile(user!.id),
          getUserProgress(user!.id),
          getLessons(),
        ])
        if (p) setProfile(p)
        setCompletedCount(prog.filter(x => x.completed).length)
        setTotalLessons(ls.length)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-4xl animate-pulse">📊</div>
      </div>
    )
  }

  const xp = profile?.xp ?? 0
  const level = profile?.level ?? 1
  const xpForNext = level * 100
  const xpProgress = Math.round((xp % xpForNext) / xpForNext * 100)
  const streak = profile?.streak ?? 0
  const wordsLearned = profile?.words_learned ?? completedCount * 8

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800">ההתקדמות שלי</h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {/* Level card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-white/70 text-sm">רמה נוכחית</p>
              <p className="text-4xl font-bold">{level}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">סה"כ XP</p>
              <p className="text-3xl font-bold">{xp}</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-3 mb-1">
            <div
              className="bg-white h-3 rounded-full transition-all"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-white/70 text-xs">{xpProgress}% לרמה {level + 1}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
            <p className="text-3xl font-bold text-indigo-600">{completedCount}</p>
            <p className="text-sm text-gray-500">שיעורים הושלמו</p>
            <p className="text-xs text-gray-400 mt-1">מתוך {totalLessons}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
            <p className="text-3xl font-bold text-green-600">{wordsLearned}</p>
            <p className="text-sm text-gray-500">מילים נלמדו</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
            <p className="text-3xl font-bold text-orange-500">{streak}</p>
            <p className="text-sm text-gray-500">ימי רצף 🔥</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
            <p className="text-3xl font-bold text-purple-600">
              {totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-500">השלמת הקורס</p>
          </div>
        </div>

        {/* Lesson progress bar */}
        {totalLessons > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">התקדמות בשיעורים</span>
              <span className="text-sm text-indigo-600 font-semibold">{completedCount}/{totalLessons}</span>
            </div>
            <div className="bg-gray-100 rounded-full h-4">
              <div
                className="bg-indigo-500 h-4 rounded-full transition-all"
                style={{ width: `${(completedCount / totalLessons) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
