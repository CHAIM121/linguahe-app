import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLessons, getUserProgress } from '../services/lessons.service'
import { useAuth } from '../context/AuthContext'
import type { Lesson } from '../services/lessons.service'

export default function LessonsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
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
        <div className="text-4xl animate-pulse">📚</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800">שיעורים</h1>
        <p className="text-sm text-gray-500 mt-0.5">{completedIds.length}/{lessons.length} הושלמו</p>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {lessons.map((lesson, idx) => {
          const done = completedIds.includes(lesson.id)
          const locked = idx > 0 && !completedIds.includes(lessons[idx - 1].id)
          return (
            <button
              key={lesson.id}
              onClick={() => !locked && navigate(`/lesson/${lesson.id}`)}
              disabled={locked}
              className={`w-full bg-white border rounded-2xl p-4 flex items-center gap-4 text-right transition-all ${
                locked ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-300 hover:shadow-sm'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${
                done ? 'bg-green-100' : locked ? 'bg-gray-100' : 'bg-indigo-100'
              }`}>
                {done ? '✅' : locked ? '🔒' : '📖'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{lesson.title}</p>
                {lesson.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{lesson.description}</p>
                )}
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>⭐ {lesson.xp_reward} XP</span>
                  <span>📝 8 מילים</span>
                </div>
              </div>
              {!locked && <span className="text-gray-400 text-lg">←</span>}
            </button>
          )
        })}

        {lessons.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>אין שיעורים זמינים כרגע</p>
          </div>
        )}
      </div>
    </div>
  )
}
