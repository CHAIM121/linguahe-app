import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useCompleteLesson } from '../hooks/useSupabaseLesson'
import { PATHS } from '../routes'

export const LessonCompletePage: React.FC = () => {
  const navigate = useNavigate()
  const { lessonId } = useParams<{ lessonId: string }>()
  const location = useLocation()
  const { xpEarned=15, wordsLearned=8, lessonTitleEn='At the Restaurant', lessonTitleHe='במסעדה' } = (location.state as Record<string,unknown>??{}) as { xpEarned?:number; wordsLearned?:number; lessonTitleEn?:string; lessonTitleHe?:string }
  const completeLesson = useCompleteLesson()
  const [xpCount, setXpCount] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!lessonId || saved) return
    setSaved(true)
    completeLesson.mutate({ lessonId, wordsLearned, xpEarned })
  }, [lessonId, saved])

  useEffect(() => {
    const dur=900; let start:number|null=null
    const tick=(ts:number)=>{ if(!start)start=ts; const p=Math.min((ts-start)/dur,1); const e=1-Math.pow(1-p,3); setXpCount(Math.round(e*xpEarned)); if(p<1)requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  }, [xpEarned])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 20px 48px', gap:'18px', animation:'slideInUp .5s cubic-bezier(.22,1,.36,1) both', overflowY:'auto', minHeight:'100%' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', paddingTop:'60px' }}>
        <div style={{ width:'82px', height:'82px', borderRadius:'50%', background:'#FDF4EC', border:'2px solid rgba(232,168,124,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', marginBottom:'8px', boxShadow:'0 0 0 10px rgba(232,168,124,.08)', animation:'popIn .6s .15s ease both' }}>🏆</div>
        <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'24px', color:'#1A1A2E' }}>כל הכבוד!</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'20px', color:'#1A1A2E', direction:'ltr' }}>{lessonTitleEn}</div>
        <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'14px', color:'#8A8A8A' }}>{lessonTitleHe} — הושלם</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', background:'#fff', border:'1px solid #EBEBEB', borderRadius:'16px', padding:'16px 0', width:'100%', boxShadow:'0 2px 12px rgba(26,26,46,.06)' }}>
        {[{val:`+${xpCount}`,label:'XP הרוויח',color:'#E8A87C'},{val:`${wordsLearned}/8`,label:'מילים'},{val:'100%',label:'דיוק',color:'#4CAF78'}].map(({val,label,color},i)=>(
          <React.Fragment key={label}>
            {i>0&&<div style={{ width:'1px', height:'36px', background:'#EBEBEB', flexShrink:0 }} />}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'26px', color:color??'#1A1A2E', lineHeight:1, direction:'ltr' }}>{val}</div>
              <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'11px', color:'#8A8A8A', fontWeight:500 }}>{label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div style={{ display:'flex', gap:'12px', width:'100%', direction:'rtl' }}>
        <button onClick={()=>navigate(PATHS.home)} style={{ height:'52px', padding:'0 22px', borderRadius:'14px', border:'1px solid rgba(232,168,124,.35)', background:'#FDF4EC', color:'#7A4520', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'15px', cursor:'pointer', flexShrink:0 }}>חזרה</button>
        <button onClick={()=>navigate(PATHS.quiz(lessonId!))} style={{ flex:1, height:'52px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', borderRadius:'14px', border:'none', background:'#1A1A2E', color:'#fff', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'16px', cursor:'pointer', boxShadow:'0 4px 16px rgba(26,26,46,.2)', direction:'rtl' }}>
          המשך לחידון <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8L8 18M8 8h10v10"/></svg>
        </button>
      </div>
    </div>
  )
}
