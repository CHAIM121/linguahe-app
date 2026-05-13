import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function getMailProvider(email: string): { label: string; url: string } | null {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (domain.includes('gmail'))    return { label: 'פתח Gmail',    url: 'https://mail.google.com' }
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') || domain.includes('msn'))
                                    return { label: 'פתח Outlook',  url: 'https://outlook.live.com' }
  if (domain.includes('yahoo'))    return { label: 'פתח Yahoo',    url: 'https://mail.yahoo.com' }
  if (domain.includes('walla'))    return { label: 'פתח Walla',    url: 'https://mail.walla.co.il' }
  return null
}

function ConfirmationScreen({ email }: { email: string }) {
  const provider = getMailProvider(email)
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="relative inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-full mb-5">
          <span className="text-4xl">📩</span>
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">בדוק את המייל שלך</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-1">
          שלחנו אליך מייל לאישור החשבון.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          יש להיכנס לאימייל ולאשר את ההרשמה לפני ההתחברות.
        </p>
        <div className="bg-indigo-50 rounded-xl px-4 py-2 my-4">
          <p className="text-indigo-700 text-sm font-medium break-all">{email}</p>
        </div>
        <p className="text-gray-400 text-xs mb-6">לא קיבלת? בדוק גם בתיקיית הספאם.</p>
        <div className="space-y-3">
          {provider ? (
            <a
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <span>📧</span>
              <span>{provider.label}</span>
            </a>
          ) : (
            <div className="bg-gray-50 border rounded-xl px-4 py-3 text-gray-500 text-sm">
              פתח את תיבת הדואר שלך ואשר את הכתובת
            </div>
          )}
          <Link
            to="/login"
            className="flex items-center justify-center w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            ← חזור להתחברות
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const { signUp } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    if (!email || !password || !confirm) { setError('אנא מלא את כל השדות'); return }
    if (password !== confirm)            { setError('הסיסמאות אינן תואמות'); return }
    if (password.length < 6)            { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    setLoading(true)
    setError('')
    const { error: err } = await signUp(email, password)
    setLoading(false)
    if (err) {
      if (err.toLowerCase().includes('already registered') || err.toLowerCase().includes('already exists')) {
        setError('כתובת האימייל כבר רשומה במערכת. נסה להתחבר.')
      } else {
        setError('אירעה שגיאה בהרשמה. נסה שוב.')
      }
    } else {
      setSuccess(true)
    }
  }

  if (success) return <ConfirmationScreen email={email} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌍</div>
          <h1 className="text-2xl font-bold text-gray-800">הצטרף ל-LinguaHe</h1>
          <p className="text-gray-500 text-sm mt-1">צור חשבון והתחל ללמוד</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="your@email.com" dir="ltr" autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="לפחות 6 תווים" autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="חזור על הסיסמה" autoComplete="new-password"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm py-3 px-4 rounded-xl">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? 'שולח...' : 'צור חשבון'}
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          יש לך חשבון?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">התחבר כאן</Link>
        </p>
      </div>
    </div>
  )
}
