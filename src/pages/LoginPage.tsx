import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Map Supabase error messages/codes → friendly Hebrew
function mapLoginError(errMsg: string, code: string | null): string {
  const msg = errMsg.toLowerCase()
  const c   = (code ?? '').toLowerCase()

  if (c === 'email_not_confirmed' || msg.includes('email not confirmed') || msg.includes('not confirmed'))
    return 'החשבון עדיין לא אושר במייל. בדוק את תיבת הדואר שלך ואשר את הכתובת.'

  if (c === 'invalid_credentials' || msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password'))
    return 'סיסמה שגויה. נסה שוב.'

  if (msg.includes('user not found') || msg.includes('no user') || msg.includes('does not exist'))
    return 'האימייל לא קיים במערכת. בדוק את הכתובת או הירשם.'

  if (msg.includes('too many') || msg.includes('rate limit'))
    return 'יותר מדי ניסיונות. המתן מספר דקות ונסה שוב.'

  if (msg.includes('network') || msg.includes('fetch'))
    return 'בעיית חיבור לאינטרנט. בדוק את החיבור ונסה שוב.'

  return 'שגיאה בהתחברות. בדוק את הפרטים ונסה שוב.'
}

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  // Track email-not-confirmed to show resend hint
  const [notConfirmed, setNotConfirmed] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('אנא מלא את כל השדות'); return }
    setLoading(true)
    setError('')
    setNotConfirmed(false)
    const { error: err, code } = await signIn(email, password)
    setLoading(false)
    if (err) {
      const friendly = mapLoginError(err, code)
      setError(friendly)
      if ((code ?? '').toLowerCase().includes('not_confirmed') || err.toLowerCase().includes('not confirmed')) {
        setNotConfirmed(true)
      }
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌍</div>
          <h1 className="text-2xl font-bold text-gray-800">LinguaHe</h1>
          <p className="text-gray-500 text-sm mt-1">למד אנגלית בדרך שלך</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="your@email.com"
              dir="ltr"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm py-3 px-4 rounded-xl">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <div>
                <p>{error}</p>
                {notConfirmed && (
                  <Link
                    to="/signup"
                    className="block mt-2 text-indigo-600 font-medium underline text-xs"
                  >
                    לא קיבלת מייל אישור? לחץ כאן להרשמה מחדש
                  </Link>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
