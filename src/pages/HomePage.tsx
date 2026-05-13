import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLessons, getProfile, getUserProgress } from '../services/lessons.service'
import type { Lesson } from '../services/lessons.service'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [profile, setProfile] = useState<{ xp: number; level: number; lessons_completed: number } | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [ls, prog] = await Promise.all([
          getLessons(),
          user ? getUserProgress(user.id) : Promise.resolve([]),
        ])
        setLessons(ls)
        setCompletedIds(prog.filter(p => p.completed).map(p => p.lesson_id))
        if (user) {
          const p = await getProfile(user.id)
          if (p) setProfile({ xp: p.xp, level: p.level, lessons_completed: p.lessons_completed })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const nextLesson = lessons.find(l => !completedIds.includes(l.id)) ?? lessons[0]
  const dailyGoal = 3
  const dailyDone = Math.min(completedIds.length, dailyGoal)

  const xp = profile?.xp ?? 0
  const level = profile?.level ?? 1
  const xpForNextLevel = level * 100
  const xpProgress = Math.min(100, Math.round((xp % xpForNextLevel) / xpForNextLevel * 100))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">🌍</div>
          <p className="text-gray-500">טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <span className="font-bold text-lg text-gray-800">LinguaHe</span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 rounded-full px-3 py-1">
          <span className="text-indigo-600 font-bold text-sm">{xp} XP</span>
          <span className="text-xs text-indigo-400">רמה {level}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-bold text-gray-800">שלום! 👋</h2>
          <p className="text-gray-500 text-sm mt-1">בוא נמשיך ללמוד אנגלית היום</p>
        </div>

        {/* Daily goal */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">יעד יומי</span>
            <span className="text-sm font-semibold text-indigo-600">{dailyDone}/{dailyGoal} שיעורים</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-indigo-500 h-3 rounded-full transition-all"
              style={{ width: `${(dailyDone / dailyGoal) * 100}%` }}
            />
          </div>
          {dailyDone >= dailyGoal && (
            <p className="text-green-600 text-sm font-medium mt-2 text-center">🎉 השגת את היעד היומי!</p>
          )}
        </div>

        {/* XP / Level */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">התקדמות לרמה {level + 1}</span>
            <span className="text-sm font-semibold text-purple-600">{xpProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* Today's lesson card */}
        {nextLesson && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">שיעור הבא</span>
            </div>
            <h3 className="text-lg font-bold mt-2">{nextLesson.title}</h3>
            {nextLesson.description && (
              <p className="text-white/80 text-sm mt-1">{nextLesson.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-sm text-white/80">
              <span>⭐ {nextLesson.xp_reward} XP</span>
              <span>📚 8 מילים</span>
              <span className="capitalize">{nextLesson.difficulty === 'beginner' ? 'מתחיל' : nextLesson.difficulty}</span>
            </div>
          </div>
        )}

        {/* Main CTA */}
        <button
          onClick={() => nextLesson && navigate(`/lesson/${nextLesson.id}`)}
          disabled={!nextLesson}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-lg font-bold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-md"
        >
          התחל ללמוד 📖
        </button>

        {/* All lessons */}
        {lessons.length > 1 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">כל השיעורים</h3>
            <div className="space-y-2">
              {lessons.map(lesson => {
                const done = completedIds.includes(lesson.id)
                return (
                  <button
                    key={lesson.id}
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                    className="w-full bg-white border rounded-xl p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{done ? '✅' : '📖'}</span>
                      <div className="text-right">
                        <p className="font-medium text-gray-800 text-sm">{lesson.title}</p>
                        <p className="text-xs text-gray-500">{lesson.xp_reward} XP</p>
                      </div>
                    </div>
                    <span className="text-gray-400">←</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
