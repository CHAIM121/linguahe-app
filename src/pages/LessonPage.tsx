import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLessonWords, getLessons } from '../services/lessons.service'
import type { Word, Lesson } from '../services/lessons.service'

type CardState = 'show' | 'known' | 'practice'

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [words, setWords] = useState<Word[]>([])
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [index, setIndex] = useState(0)
  const [cardStates, setCardStates] = useState<CardState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const [ws, ls] = await Promise.all([getLessonWords(id!), getLessons()])
        if (ws.length === 0) {
          // Use fallback words if DB has none
          setWords(getFallbackWords(id!))
        } else {
          setWords(ws)
        }
        const found = ls.find(l => l.id === id)
        setLesson(found ?? null)
        setCardStates(new Array(ws.length || 8).fill('show'))
      } catch (e) {
        setError('שגיאה בטעינת השיעור')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const word = words[index]
  const total = words.length

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1)
    } else {
      // Done with all words — go to lesson complete
      const knownCount = cardStates.filter(s => s === 'known').length
      navigate(`/lesson/${id}/complete`, {
        state: { xpEarned: lesson?.xp_reward ?? 50, knownCount, total, lessonId: id, words }
      })
    }
  }

  const handleKnown = () => {
    const updated = [...cardStates]
    updated[index] = 'known'
    setCardStates(updated)
    handleNext()
  }

  const handlePractice = () => {
    const updated = [...cardStates]
    updated[index] = 'practice'
    setCardStates(updated)
    handleNext()
  }

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = 'en-US'
      window.speechSynthesis.speak(utt)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-4">📖</div>
          <p className="text-gray-500">טוען שיעור...</p>
        </div>
      </div>
    )
  }

  if (error || words.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'לא נמצאו מילים'}</p>
          <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">
            חזרה לבית
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 text-sm">
          ← יציאה
        </button>
        <span className="font-medium text-gray-700 text-sm">{lesson?.title ?? 'שיעור'}</span>
        <span className="text-sm font-bold text-indigo-600">{index + 1}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-200 h-1.5">
        <div
          className="bg-indigo-500 h-1.5 transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Word card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          {/* English word */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-1">
              <h2 className="text-4xl font-bold text-gray-800">{word.english}</h2>
              <button
                onClick={() => speakWord(word.english)}
                className="text-2xl bg-indigo-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                title="השמע"
              >
                🔊
              </button>
            </div>

            {/* Hebrew */}
            <p className="text-2xl text-indigo-600 font-bold mt-3">{word.hebrew}</p>

            {/* Transliteration */}
            {word.transliteration && (
              <p className="text-gray-500 text-sm mt-1 italic">{word.transliteration}</p>
            )}
          </div>

          {/* Divider */}
          <hr className="my-4" />

          {/* Example sentence */}
          {word.example_sentence && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1 text-right">משפט לדוגמה:</p>
              <p className="text-gray-700 text-sm" dir="ltr">{word.example_sentence}</p>
              {word.example_translation && (
                <p className="text-gray-500 text-xs mt-1 text-right">{word.example_translation}</p>
              )}
            </div>
          )}
        </div>

        {/* Word state indicators */}
        <div className="flex gap-1 justify-center mb-6">
          {words.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < index
                  ? cardStates[i] === 'known'
                    ? 'bg-green-400 w-4'
                    : 'bg-orange-300 w-4'
                  : i === index
                    ? 'bg-indigo-500 w-6'
                    : 'bg-gray-200 w-4'
              }`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleKnown}
            className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition-colors"
          >
            ✅ ידעתי
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePractice}
              className="bg-orange-100 text-orange-700 py-3 rounded-xl font-medium hover:bg-orange-200 transition-colors"
            >
              🔄 לתרגל שוב
            </button>

            <button
              onClick={handleNext}
              className="bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              {index === total - 1 ? 'סיים ←' : 'הבא ←'}
            </button>
          </div>
        </div>

        {/* Progress text */}
        <p className="text-center text-gray-400 text-sm mt-4">
          {total - index - 1 > 0 ? `עוד ${total - index - 1} מילים` : 'מילה אחרונה!'}
        </p>
      </div>
    </div>
  )
}

// Fallback words for when DB has no content yet
function getFallbackWords(lessonId: string): Word[] {
  return [
    { id: '1', lesson_id: lessonId, english: 'Menu', hebrew: 'תפריט', transliteration: 'Tafreet', example_sentence: 'Can I see the menu, please?', example_translation: 'האם אוכל לראות את התפריט, בבקשה?', audio_url: null, order_index: 1 },
    { id: '2', lesson_id: lessonId, english: 'Table', hebrew: 'שולחן', transliteration: "Shulkhan", example_sentence: 'We need a table for two.', example_translation: 'אנחנו צריכים שולחן לשניים.', audio_url: null, order_index: 2 },
    { id: '3', lesson_id: lessonId, english: 'Waiter', hebrew: 'מלצר', transliteration: 'Meltsar', example_sentence: 'The waiter brought our food.', example_translation: 'המלצר הביא את האוכל שלנו.', audio_url: null, order_index: 3 },
    { id: '4', lesson_id: lessonId, english: 'Order', hebrew: 'הזמנה', transliteration: 'Hazmanah', example_sentence: 'I would like to order a salad.', example_translation: 'אני רוצה להזמין סלט.', audio_url: null, order_index: 4 },
    { id: '5', lesson_id: lessonId, english: 'Reservation', hebrew: 'הזמנה מקדימה', transliteration: 'Hazmanah mukdemet', example_sentence: 'Do you have a reservation?', example_translation: 'יש לך הזמנה מקדימה?', audio_url: null, order_index: 5 },
    { id: '6', lesson_id: lessonId, english: 'Bill', hebrew: 'חשבון', transliteration: 'Kheshbon', example_sentence: 'Can we have the bill, please?', example_translation: 'אפשר לקבל את החשבון?', audio_url: null, order_index: 6 },
    { id: '7', lesson_id: lessonId, english: 'Tip', hebrew: 'טיפ', transliteration: 'Tip', example_sentence: 'We left a big tip for the waiter.', example_translation: 'השארנו טיפ גדול למלצר.', audio_url: null, order_index: 7 },
    { id: '8', lesson_id: lessonId, english: 'Delicious', hebrew: 'טעים', transliteration: "Ta'im", example_sentence: 'The food was delicious!', example_translation: 'האוכל היה טעים!', audio_url: null, order_index: 8 },
  ]
}
