import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password || !confirm) {
      setError('אנא מלא את כל השדות')
      return
    }
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות')
      return
    }
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await signUp(email, password)
    setLoading(false)
    if (err) {
      setError(err)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">נרשמת בהצלחה!</h2>
          <p className="text-gray-500 text-sm">מעבר לאפליקציה...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌍</div>
          <h1 className="text-2xl font-bold text-gray-800">הצטרף ל-LinguaHe</h1>
          <p className="text-gray-500 text-sm mt-1">צור חשבון והתחל ללמוד</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="your@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="לפחות 6 תווים"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">אימות סיסמה</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="חזור על הסיסמה"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'נרשם...' : 'צור חשבון'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          יש לך חשבון?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            התחבר כאן
          </Link>
        </p>
      </div>
    </div>
  )
}
