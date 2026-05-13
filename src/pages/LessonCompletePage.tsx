import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { awardXp, saveProgress } from '../services/lessons.service'
import type { Word } from '../services/lessons.service'

interface LocationState {
  xpEarned: number
  knownCount: number
  total: number
  lessonId: string
  words: Word[]
}

export default function LessonCompletePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const state = location.state as LocationState | null

  const xpEarned = state?.xpEarned ?? 50
  const knownCount = state?.knownCount ?? 0
  const total = state?.total ?? 8
  const words = state?.words ?? []

  useEffect(() => {
    if (user && id) {
      const score = Math.round((knownCount / total) * 100)
      saveProgress(user.id, id, score).catch(console.error)
      awardXp(user.id, xpEarned).catch(console.error)
    }
  }, [user, id, knownCount, total, xpEarned])

  const pct = Math.round((knownCount / total) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        {/* Trophy */}
        <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '🎯' : '💪'}</div>

        <h2 className="text-2xl font-bold text-gray-800 mb-1">השיעור הושלם!</h2>
        <p className="text-gray-500 text-sm mb-6">כל הכבוד על הלמידה!</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-indigo-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-indigo-600">+{xpEarned}</p>
            <p className="text-xs text-gray-500">XP נצבר</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-green-600">{knownCount}</p>
            <p className="text-xs text-gray-500">מילים ידועות</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-purple-600">{pct}%</p>
            <p className="text-xs text-gray-500">ציון</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/lesson/${id}/quiz`, { state: { words, lessonId: id } })}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            המשך למבחן 🧠
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            חזרה לבית 🏠
          </button>
        </div>
      </div>
    </div>
  )
}
