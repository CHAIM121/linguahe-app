import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLessonWithWords } from '../hooks/useSupabaseLesson'
import { useQuizFlow } from '../hooks/useQuizFlow'
import { LoadingScreen, ErrorState } from '../components/common/LoadingScreen'
import { PATHS } from '../routes'
import type { Quiz, QuizQuestion, MultipleChoiceQuestion, FillBlankQuestion } from '../types/quiz.types'
import type { LessonWord } from '../types/database.types'

function shuffle<T>(a: T[]): T[] { const r=[...a]; for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]};return r }

function makeQuiz(lessonId: string, words: LessonWord[]): Quiz {
  const s = shuffle(words)
  const qs: QuizQuestion[] = [
    ...s.slice(0,3).map((w,i): MultipleChoiceQuestion => {
      const d = shuffle(words.filter(x=>x.id!==w.id)).slice(0,3).map(x=>x.hebrew_translation)
      const opts = shuffle([w.hebrew_translation,...d])
      return { id:`mcq-${i}-${w.id}`, type:'multiple_choice', promptEn:w.english_word, promptEmoji:w.image_emoji??'📖', correctAnswer:w.hebrew_translation, options:opts, correctIndex:opts.indexOf(w.hebrew_translation), wordId:w.id }
    }),
    ...s.slice(3,5).map((w,i): FillBlankQuestion => ({ id:`fill-${i}-${w.id}`, type:'fill_blank', promptHe:w.hebrew_translation, promptTranslit:w.transliteration, promptEmoji:w.image_emoji??'📖', correctAnswer:w.english_word, wordId:w.id })),
  ]
  return { id:`quiz-${lessonId}`, lessonId, questions:qs }
}

const CORRECT = ['מצוין! 🎯','כל הכבוד! ✨','נכון מאוד! 👏','אחלה! 🚀']
const WRONG = ['לא נורא, תזכור לפעם הבאה','כמעט! עוד קצת ותדע','זה בסדר, כך לומדים']

const QuizFlow: React.FC<{ quiz: Quiz; titleEn: string; titleHe: string }> = ({ quiz, titleEn, titleHe }) => {
  const navigate = useNavigate()
  const { state, currentQuestion, totalQuestions, answeredCount, progressRatio, result, isLastQuestion, startQuiz, submitAnswer, nextQuestion, retryQuiz } = useQuizFlow(quiz)
  const [input, setInput] = useState('')
  const [correctMsg] = useState(()=>CORRECT[Math.floor(Math.random()*CORRECT.length)])
  const [wrongMsg] = useState(()=>WRONG[Math.floor(Math.random()*WRONG.length)])
  useEffect(()=>{ setInput('') },[state.currentIndex])

  if (state.quizPhase==='intro') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'72px 28px 40px', gap:'14px', animation:'slideUp .45s ease both' }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#C0A080' }}>חידון</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'34px', color:'#1A1A2E', direction:'ltr', textAlign:'center' }}>{titleEn}</div>
      <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'18px', color:'#5A5A7A' }}>{titleHe}</div>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center' }}>
        {[`❓ ${totalQuestions} שאלות`,`⚡ ${totalQuestions*10} XP אפשרי`,'⭐ עד 3 כוכבים'].map(item=>(
          <div key={item} style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:'20px', padding:'5px 14px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'13px', fontWeight:600, color:'#5A5A7A' }}>{item}</div>
        ))}
      </div>
      <button onClick={startQuiz} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', width:'100%', maxWidth:'340px', height:'56px', background:'#1A1A2E', color:'#fff', border:'none', borderRadius:'16px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'17px', cursor:'pointer', direction:'rtl', marginTop:'8px' }}>
        התחל חידון <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </div>
  )

  if (state.quizPhase==='result') {
    const { score, correctCount, xpEarned, stars } = result
    const sc = score>=90?'#4CAF78':score>=70?'#E8A87C':'#E05252'
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 20px 48px', gap:'18px', overflowY:'auto', animation:'slideInUp .5s ease both' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', paddingTop:'40px' }}>
          <div style={{ fontSize:'34px', marginBottom:'8px' }}>{Array.from({length:3},(_,i)=>i<stars?'⭐':'☆').join('')}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'48px', color:sc, lineHeight:1 }}>{score}%</div>
          <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'20px', color:'#1A1A2E' }}>{score>=90?'מושלם! 🏆':score>=70?'עבודה טובה! 👏':'התחלה טובה! 💪'}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', background:'#fff', border:'1px solid #EBEBEB', borderRadius:'16px', padding:'16px 0', width:'100%' }}>
          {[{v:`+${xpEarned}`,l:'XP',c:'#E8A87C'},{v:`${correctCount}/${totalQuestions}`,l:'נכון'},{v:'⭐'.repeat(stars),l:'דירוג'}].map(({v,l,c},i)=>(
            <React.Fragment key={l}>
              {i>0&&<div style={{ width:'1px', height:'36px', background:'#EBEBEB' }} />}
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:i===2?'20px':'26px', color:c??'#1A1A2E', lineHeight:1, direction:'ltr' }}>{v}</div>
                <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'11px', color:'#8A8A8A' }}>{l}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ display:'flex', gap:'12px', width:'100%', direction:'rtl' }}>
          <button onClick={retryQuiz} style={{ height:'52px', padding:'0 22px', borderRadius:'14px', border:'1px solid rgba(232,168,124,.35)', background:'#FDF4EC', color:'#7A4520', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'15px', cursor:'pointer', flexShrink:0 }}>שוב</button>
          <button onClick={()=>navigate(PATHS.home)} style={{ flex:1, height:'52px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', borderRadius:'14px', border:'none', background:'#1A1A2E', color:'#fff', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'16px', cursor:'pointer', direction:'rtl' }}>
            חזרה לבית <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>
          </button>
        </div>
      </div>
    )
  }

  const fb = state.quizPhase==='feedback'
  const ok = state.lastFeedback==='correct'

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%' }}>
      <header style={{ padding:'52px 16px 14px', background:'rgba(250,250,248,.92)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', borderBottom:'1px solid rgba(235,235,235,.9)', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={()=>navigate(PATHS.home)} style={{ width:'36px', height:'36px', borderRadius:'50%', border:'none', background:'transparent', color:'#8A8A8A', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div style={{ flex:1, height:'7px', background:'#EBEBEB', borderRadius:'20px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressRatio*100}%`, background:'linear-gradient(90deg,#1A1A2E,#3A3A6E)', borderRadius:'20px', transition:'width .55s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:'12px', fontWeight:600, color:'#8A8A8A', direction:'ltr', flexShrink:0 }}>{answeredCount} / {totalQuestions}</span>
        </div>
      </header>

      {currentQuestion && (
        <div style={{ flex:1, padding:'14px 20px 0' }}>
          <p style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'13px', fontWeight:600, color:'#9A9AB0', textAlign:'center', marginBottom:'12px' }}>{currentQuestion.type==='multiple_choice'?'בחר את התרגום הנכון':'כתוב את המילה באנגלית'}</p>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', background:'#fff', border:'1px solid #EBEBEB', borderRadius:'20px', padding:'26px 24px', boxShadow:'0 4px 20px rgba(26,26,46,.07)', marginBottom:'16px' }}>
            <span style={{ fontSize:'50px', lineHeight:1 }}>{currentQuestion.promptEmoji}</span>
            {currentQuestion.type==='multiple_choice'
              ? <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'40px', color:'#1A1A2E', letterSpacing:'-1.5px', direction:'ltr' }}>{currentQuestion.promptEn}</span>
              : <><span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'38px', color:'#1A1A2E', direction:'rtl' }}>{currentQuestion.promptHe}</span><span style={{ fontFamily:"'Noto Sans',monospace", fontSize:'14px', color:'#A0A0B0', direction:'ltr' }}>{currentQuestion.promptTranslit}</span></>
            }
          </div>

          {currentQuestion.type==='multiple_choice' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {currentQuestion.options.map((opt,i)=>{
                const sel=fb&&opt===state.lastAnswer, cor=fb&&opt===currentQuestion.correctAnswer, dim=fb&&!sel&&!cor
                return (
                  <button key={i} disabled={fb} onClick={()=>submitAnswer(opt)} style={{ display:'flex', alignItems:'center', gap:'12px', width:'100%', padding:'14px 16px', background:cor?'#F0FDF5':sel&&!cor?'#FFF0F0':'#fff', border:`1.5px solid ${cor?'#4CAF78':sel&&!cor?'#E05252':'#EBEBEB'}`, borderRadius:'14px', cursor:fb?'default':'pointer', direction:'rtl', opacity:dim?.4:1, animation:sel&&!cor?'shake .4s ease':'none', fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'17px', fontWeight:600, color:'#1A1A2E' }}>
                    <span style={{ flexShrink:0, width:'26px', height:'26px', borderRadius:'8px', background:'#F0EEF8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, fontFamily:"'Syne',sans-serif", color:'#6A6A9A', marginRight:'auto' }}>{String.fromCharCode(65+i)}</span>
                    <span style={{ flex:1 }}>{opt}</span>
                    {cor&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                    {sel&&!cor&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>}
                  </button>
                )
              })}
            </div>
          )}

          {currentQuestion.type==='fill_blank' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'12px', fontWeight:600, color:'#9A9AB0', textAlign:'right' }}>כתוב כאן באנגלית</div>
              <input type="text" lang="en" dir="ltr" placeholder="Type the English word..." value={fb?state.lastAnswer:input} onChange={e=>!fb&&setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!fb&&input.trim()&&submitAnswer(input.trim())} disabled={fb}
                style={{ height:'56px', borderRadius:'14px', border:`1.5px solid ${!fb?'#EBEBEB':ok?'#4CAF78':'#E05252'}`, background:!fb?'#fff':ok?'#F0FDF5':'#FFF0F0', padding:'0 16px', fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:'20px', color:'#1A1A2E', outline:'none' }} />
              {fb&&!ok&&<div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#F0FDF5', border:'1px solid rgba(76,175,120,.35)', borderRadius:'10px', direction:'rtl' }}>
                <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'13px', color:'#1A6B3A', flexShrink:0 }}>התשובה הנכונה:</span>
                <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'16px', color:'#1A6B3A', direction:'ltr' }}>{currentQuestion.correctAnswer}</span>
              </div>}
              {!fb&&<button onClick={()=>input.trim()&&submitAnswer(input.trim())} disabled={!input.trim()} style={{ height:'52px', borderRadius:'14px', border:'none', background:'#1A1A2E', color:'#fff', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'16px', cursor:input.trim()?'pointer':'not-allowed', opacity:input.trim()?1:.4 }}>בדוק</button>}
            </div>
          )}
        </div>
      )}

      {fb&&currentQuestion&&(
        <div style={{ margin:'14px 20px 32px', borderRadius:'16px', borderTop:`3px solid ${ok?'#4CAF78':'#E05252'}`, padding:'18px 16px 16px', display:'flex', flexDirection:'column', gap:'14px', background:ok?'#F8FEFB':'#FFF8F8', animation:'slideInUp .3s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', direction:'rtl' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:ok?'#4CAF78':'#E05252', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {ok?<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>}
            </div>
            <p style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'16px', color:ok?'#1A6B3A':'#9B2020' }}>{ok?correctMsg:wrongMsg}</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', direction:'rtl', padding:'10px 12px', background:'rgba(255,255,255,.7)', borderRadius:'10px' }}>
            <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'13px', color:'#6A6A8A', flexShrink:0 }}>התשובה הנכונה:</span>
            <span style={{ fontFamily:currentQuestion.type==='multiple_choice'?"'Noto Sans Hebrew',sans-serif":"'Syne',sans-serif", fontWeight:700, fontSize:'17px', color:'#1A1A2E', flex:1, direction:currentQuestion.type==='multiple_choice'?'rtl':'ltr' }}>{currentQuestion.correctAnswer}</span>
          </div>
          <button onClick={nextQuestion} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', height:'50px', borderRadius:'12px', border:'none', background:ok?'#1A6B3A':'#1A1A2E', color:'#fff', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'16px', cursor:'pointer', direction:'rtl' }}>
            {isLastQuestion?'ראה תוצאות':'שאלה הבאה'} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}

export const QuizPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { data: lesson, isLoading, error } = useLessonWithWords(lessonId)
  const quiz = useMemo(()=>lesson?makeQuiz(lesson.id, lesson.lesson_words):null,[lesson])
  if (isLoading) return <LoadingScreen message="טוען חידון..." />
  if (error||!lesson||!quiz) return <ErrorState titleHe="לא נמצא חידון" onRetry={()=>navigate(PATHS.lessons)} />
  return <QuizFlow quiz={quiz} titleEn={lesson.title_en} titleHe={lesson.title_he} />
}
