import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfile, getUserProgress } from '../services/lessons.service'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<{ xp: number; level: number; lessons_completed: number; streak: number } | null>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const [p, prog] = await Promise.all([
          getProfile(user!.id),
          getUserProgress(user!.id),
        ])
        if (p) setProfile(p)
        setCompletedCount(prog.filter(x => x.completed).length)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-4xl animate-pulse">👤</div>
      </div>
    )
  }

  const xp = profile?.xp ?? 0
  const level = profile?.level ?? 1
  const streak = profile?.streak ?? 0

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800">הפרופיל שלי</h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {/* User card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">{user?.email?.split('@')[0] ?? 'לומד'}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <p className="text-indigo-600 text-sm font-medium mt-0.5">רמה {level} • {xp} XP</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border text-center">
            <p className="text-2xl font-bold text-indigo-600">{xp}</p>
            <p className="text-xs text-gray-500">XP</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border text-center">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-500">שיעורים</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border text-center">
            <p className="text-2xl font-bold text-orange-500">{streak}</p>
            <p className="text-xs text-gray-500">ימי רצף 🔥</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <button
            onClick={() => navigate('/')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b"
          >
            <span className="text-gray-500">→</span>
            <span className="font-medium text-gray-700">חזרה לבית</span>
            <span className="text-xl">🏠</span>
          </button>
          <button
            onClick={() => navigate('/lessons')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b"
          >
            <span className="text-gray-500">→</span>
            <span className="font-medium text-gray-700">כל השיעורים</span>
            <span className="text-xl">📚</span>
          </button>
          <button
            onClick={() => navigate('/progress')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-500">→</span>
            <span className="font-medium text-gray-700">ההתקדמות שלי</span>
            <span className="text-xl">📊</span>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full bg-red-50 border border-red-200 text-red-600 py-3 rounded-2xl font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {loggingOut ? 'מתנתק...' : '🚪 התנתקות'}
        </button>
      </div>
    </div>
  )
}
