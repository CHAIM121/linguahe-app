import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Word } from '../services/lessons.service'

interface LocationState {
  words: Word[]
  lessonId: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

interface Question {
  word: Word
  options: string[]
  correct: string
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const words = state?.words ?? []
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (words.length === 0) {
      navigate(`/lesson/${id}`)
      return
    }
    const qs: Question[] = shuffle(words).map(word => {
      const wrong = shuffle(words.filter(w => w.id !== word.id))
        .slice(0, 3)
        .map(w => w.hebrew)
      const opts = shuffle([word.hebrew, ...wrong])
      return { word, options: opts, correct: word.hebrew }
    })
    setQuestions(qs)
  }, [words, id, navigate])

  const current = questions[index]
  const total = questions.length

  const handleSelect = (opt: string) => {
    if (selected !== null) return
    setSelected(opt)
    if (opt === current.correct) {
      setScore(s => s + 1)
    }
    setTimeout(() => {
      if (index < total - 1) {
        setIndex(i => i + 1)
        setSelected(null)
      } else {
        setFinished(true)
      }
    }, 1000)
  }

  if (words.length === 0) {
    return null
  }

  if (finished) {
    const pct = Math.round((score / total) * 100)
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="text-6xl mb-4">{pct >= 80 ? '🌟' : pct >= 50 ? '👍' : '📚'}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">המבחן הסתיים!</h2>
          <p className="text-gray-500 text-sm mb-6">הנה תוצאותיך:</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-green-600">{score}/{total}</p>
              <p className="text-xs text-gray-500">תשובות נכונות</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-indigo-600">{pct}%</p>
              <p className="text-xs text-gray-500">ציון</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              חזרה לבית 🏠
            </button>
            <button
              onClick={() => navigate('/lessons')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              שיעורים נוספים 📚
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-8" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-gray-500 text-sm">
          ← יציאה
        </button>
        <span className="font-medium text-gray-700 text-sm">מבחן</span>
        <span className="text-sm font-bold text-indigo-600">{index + 1}/{total}</span>
      </div>

      {/* Progress */}
      <div className="bg-gray-200 h-1.5">
        <div
          className="bg-green-500 h-1.5 transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div className="max-w-md mx-auto px-4 pt-8">
        <p className="text-center text-gray-500 text-sm mb-2">מה המשמעות של?</p>
        <h2 className="text-center text-4xl font-bold text-gray-800 mb-8">{current.word.english}</h2>

        <div className="space-y-3">
          {current.options.map(opt => {
            let cls = 'w-full border-2 rounded-xl py-4 px-4 text-lg font-medium transition-all '
            if (selected === null) {
              cls += 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-gray-800'
            } else if (opt === current.correct) {
              cls += 'border-green-500 bg-green-50 text-green-700'
            } else if (opt === selected) {
              cls += 'border-red-400 bg-red-50 text-red-600'
            } else {
              cls += 'border-gray-200 bg-white text-gray-400'
            }
            return (
              <button key={opt} onClick={() => handleSelect(opt)} className={cls}>
                {opt}
              </button>
            )
          })}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          ניקוד: {score}/{index}
        </p>
      </div>
    </div>
  )
}
