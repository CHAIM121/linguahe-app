import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('אנא מלא את כל השדות')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError('שגיאה בהתחברות. בדוק שם משתמש וסיסמה.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌍</div>
          <h1 className="text-2xl font-bold text-gray-800">LinguaHe</h1>
          <p className="text-gray-500 text-sm mt-1">למד אנגלית בדרך שלך</p>
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
              placeholder="••••••••"
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
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          אין לך חשבון?{' '}
          <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
            הרשם כאן
          </Link>
        </p>
      </div>
    </div>
  )
}
