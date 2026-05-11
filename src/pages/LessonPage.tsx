import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLessonWithWords } from '../hooks/useSupabaseLesson'
import { useLessonFlow } from '../hooks/useLessonFlow'
import { WordCard } from '../components/lesson/WordCard'
import { XPFeedback } from '../components/lesson/XPFeedback'
import { LoadingScreen, ErrorState } from '../components/common/LoadingScreen'
import { PATHS } from '../routes'
import type { Word } from '../types/lesson.types'
import type { LessonWord } from '../types/database.types'

function toWord(w: LessonWord): Word {
  return { id:w.id, english:w.english_word, hebrew:w.hebrew_translation, transliteration:w.transliteration, audioUrl:w.audio_url??undefined, exampleEn:w.example_sentence_en??'', exampleHe:w.example_sentence_he??'', imageEmoji:w.image_emoji??'📖' }
}

const LessonFlow: React.FC<{ words: Word[]; lessonId: string; titleEn: string; titleHe: string; xpReward: number }> = ({ words, lessonId, titleEn, titleHe, xpReward }) => {
  const navigate = useNavigate()
  const { state, currentWord, totalWords, progressRatio, learnedWords, seenIds, startLesson, tapCard, knewIt, practiceAgain, xpFeedbackDone, onCardRevealed, onCardExited } = useLessonFlow(words, lessonId)

  if (state.lessonPhase === 'intro') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'72px 28px 40px', gap:'14px', animation:'slideUp .45s ease both' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#C0A080' }}>שיעור</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'36px', color:'#1A1A2E', letterSpacing:'-1px', textAlign:'center', lineHeight:1.05, direction:'ltr' }}>{titleEn}</div>
        <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'18px', color:'#5A5A7A' }}>{titleHe}</div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center' }}>
          {[`📖 ${words.length} מילים`,`⚡ +${xpReward} XP`,'⏱ ~5 דקות'].map(item=>(
            <div key={item} style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:'20px', padding:'5px 14px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'13px', fontWeight:600, color:'#5A5A7A' }}>{item}</div>
          ))}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center' }}>
          {words.map(w=>(
            <div key={w.id} style={{ display:'flex', alignItems:'center', gap:'6px', background:'#fff', border:'1px solid #EBEBEB', borderRadius:'8px', padding:'6px 12px', fontFamily:"'Syne',sans-serif", fontSize:'13px', color:'#5A5A7A', fontWeight:600, direction:'ltr' }}><span>{w.imageEmoji}</span><span>{w.english}</span></div>
          ))}
        </div>
        <button onClick={startLesson} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', width:'100%', maxWidth:'340px', height:'56px', background:'#1A1A2E', color:'#fff', border:'none', borderRadius:'16px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'17px', cursor:'pointer', boxShadow:'0 6px 24px rgba(26,26,46,.25)', direction:'rtl', marginTop:'8px' }}>
          התחל שיעור <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
    )
  }

  if (state.lessonPhase === 'complete') {
    navigate(PATHS.lessonComplete(lessonId), { state: { xpEarned:state.xpEarned, wordsLearned:learnedWords.length, lessonTitleEn:titleEn, lessonTitleHe:titleHe } })
    return null
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%' }}>
      {state.showXPFeedback && <XPFeedback amount={state.xpFeedbackAmount} onDone={xpFeedbackDone} />}
      <header style={{ padding:'52px 16px 14px', background:'rgba(250,250,248,.92)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', borderBottom:'1px solid rgba(235,235,235,.9)', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={()=>navigate(PATHS.home)} style={{ width:'36px', height:'36px', borderRadius:'50%', border:'none', background:'transparent', color:'#8A8A8A', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div style={{ flex:1, height:'7px', background:'#EBEBEB', borderRadius:'20px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressRatio*100}%`, background:'linear-gradient(90deg,#E8A87C,#F0C080)', borderRadius:'20px', transition:'width .55s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:'12px', fontWeight:600, color:'#8A8A8A', direction:'ltr', flexShrink:0 }}>{learnedWords.length} / {totalWords}</span>
        </div>
      </header>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'13px', fontWeight:600, color:'#8A8A8A', padding:'12px 0 0' }}>
        <span>🍽️</span><span>{titleHe}</span>
      </div>
      <div style={{ flex:1, padding:'14px 20px 8px' }}>
        {currentWord && (
          <WordCard
            key={`${currentWord.id}-${state.currentIndex}`}
            word={currentWord}
            cardPhase={state.cardPhase}
            onTap={tapCard}
            onRevealed={onCardRevealed}
            onExited={onCardExited}
            onKnewIt={knewIt}
            onPracticeAgain={practiceAgain}
            isRequeued={seenIds.has(currentWord.id) && state.attempts.some(a=>a.wordId===currentWord.id)}
          />
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 32px', direction:'rtl' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:'3px', direction:'ltr' }}>
          <span style={{ fontSize:'14px' }}>⚡</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'20px', color:'#E8A87C' }}>{state.xpEarned}</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:'12px', color:'#C0A080' }}>XP</span>
        </div>
        <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'12px', color:'#C0C0C8' }}>{state.cardPhase==='front'?'הקש על הכרטיס לגלות תרגום':state.cardPhase==='back'?'ידעת את המילה?':''}</span>
      </div>
    </div>
  )
}

export const LessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { data: lesson, isLoading, error } = useLessonWithWords(lessonId)

  if (isLoading) return <LoadingScreen message="טוען שיעור..." />
  if (error || !lesson) return <ErrorState titleHe="לא נמצא שיעור" messageHe="לא הצלחנו לטעון את השיעור." onRetry={()=>navigate(PATHS.lessons)} />

  const words = lesson.lesson_words.map(toWord)
  return <LessonFlow words={words} lessonId={lesson.id} titleEn={lesson.title_en} titleHe={lesson.title_he} xpReward={lesson.xp_reward} />
}
