import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useUserProgress, useActiveDates, useDailyGoalStatus } from '../hooks/useSupabaseProgress'
import { XPBar } from '../components/progress/XPBar'
import { StreakCard } from '../components/progress/StreakCard'
import { LoadingScreen } from '../components/common/LoadingScreen'
import { getLevelForXP, getNextLevel } from '../lib/levels'
import { PATHS, LESSON_ID_RESTAURANT } from '../routes'

const RECENT_ACHIEVEMENTS = [
  { emoji:'🔥', titleHe:'שבוע ברציפות', time:'אתמול' },
  { emoji:'⭐', titleHe:'חידון מושלם', time:'לפני 2 ימים' },
  { emoji:'🎓', titleHe:'שיעור ראשון', time:'לפני 5 ימים' },
]

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { profile: authProfile, isLoading: authLoading } = useAuth()
  const { data: progressData, isLoading: progressLoading } = useUserProgress()
  const activeDates = useActiveDates()
  const { goalLessons, completedToday, isComplete, progress: gProg } = useDailyGoalStatus()

  if (authLoading || progressLoading) return <LoadingScreen />

  const p = progressData ?? authProfile
  const totalXP = p?.total_xp ?? 0
  const cur = getLevelForXP(totalXP)
  const next = getNextLevel(cur.level)
  const name = p?.display_name ?? 'Learner'
  const goalPct = Math.min(gProg * 100, 100)

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%', background:'#FAFAF8' }}>
      <header style={{ padding:'52px 20px 16px', background:'#fff', borderBottom:'1px solid #EBEBEB', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', direction:'rtl' }}>
          <button onClick={()=>navigate(PATHS.profile)} style={{ width:'38px', height:'38px', borderRadius:'50%', background:'#1A1A2E', color:'#E8A87C', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'14px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>{name.charAt(0).toUpperCase()}</button>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'22px', color:'#1A1A2E', letterSpacing:'-0.5px', direction:'ltr' }}>Lingua<span style={{ color:'#E8A87C' }}>He</span></div>
        </div>
        <XPBar totalXP={totalXP} currentLevelConfig={cur} nextLevelConfig={next} />
      </header>

      <main style={{ flex:1, padding:'16px 20px 0', display:'flex', flexDirection:'column', gap:'12px', paddingBottom:'24px' }}>
        <StreakCard currentStreak={p?.current_streak??0} longestStreak={p?.longest_streak??0} activeDates={activeDates} />

        <div style={{ border:`1px solid ${isComplete?'rgba(76,175,120,.4)':'#EBEBEB'}`, background:isComplete?'#F0FDF5':'#FAFAF8', borderRadius:'12px', padding:'12px 14px', display:'flex', flexDirection:'column', gap:'8px', direction:'rtl', transition:'all .3s' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'18px' }}>{isComplete?'✅':'🎯'}</span>
              <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'13px', color:isComplete?'#1A6B3A':'#5A5A7A' }}>{isComplete?'יעד יומי הושג! 🎉':`יעד יומי — ${goalLessons} שיעורים`}</span>
            </div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'18px', color:isComplete?'#1A6B3A':'#E8A87C', direction:'ltr' }}>{completedToday}<span style={{ fontWeight:400, fontSize:'14px', color:'#8A8A8A' }}>/{goalLessons}</span></span>
          </div>
          <div style={{ height:'4px', background:'#EBEBEB', borderRadius:'20px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${goalPct}%`, background:isComplete?'#4CAF78':'linear-gradient(90deg,#E8A87C,#F0C080)', borderRadius:'20px', transition:'width .6s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>

        <div onClick={()=>navigate(PATHS.lesson(LESSON_ID_RESTAURANT))} style={{ background:'#1A1A2E', borderRadius:'20px', padding:'22px 20px', cursor:'pointer', position:'relative', overflow:'hidden', boxShadow:'0 6px 24px rgba(26,26,46,.2)', direction:'rtl' }}>
          <div style={{ position:'absolute', top:'-30px', left:'-30px', width:'160px', height:'160px', background:'rgba(232,168,124,.07)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'11px', color:'rgba(232,168,124,.8)', letterSpacing:'.1em', marginBottom:'6px', position:'relative' }}>📖 המשך לימוד</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'28px', color:'#fff', letterSpacing:'-0.8px', lineHeight:1.05, direction:'ltr', position:'relative' }}>At the Restaurant</div>
          <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:500, fontSize:'13px', color:'rgba(255,255,255,.5)', marginTop:'2px', marginBottom:'14px', position:'relative' }}>במסעדה</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', direction:'ltr' }}>
              {['8 מילים','+15 XP','5 דקות'].map((item,i)=>(
                <React.Fragment key={item}>
                  {i>0&&<div style={{ width:'3px', height:'3px', borderRadius:'50%', background:'rgba(255,255,255,.25)' }} />}
                  <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'12px', color:'rgba(255,255,255,.5)' }}>{item}</span>
                </React.Fragment>
              ))}
            </div>
            <button onClick={e=>{e.stopPropagation();navigate(PATHS.lesson(LESSON_ID_RESTAURANT))}} style={{ display:'flex', alignItems:'center', gap:'6px', background:'#E8A87C', color:'#1A1A2E', border:'none', borderRadius:'50px', padding:'8px 18px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'14px', cursor:'pointer', direction:'rtl' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              התחל
            </button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
          {[{val:p?.words_learned??0,label:'מילים',color:'#1A1A2E'},{val:totalXP,label:'XP',color:'#E8A87C',dir:'ltr' as const},{val:p?.current_streak??0,label:'רצף',color:'#4CAF78'}].map(({val,label,color,dir})=>(
            <div key={label} style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:'12px', padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', boxShadow:'0 2px 8px rgba(26,26,46,.05)' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'22px', lineHeight:1, color, direction:dir }}>{val}</div>
              <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'11px', color:'#8A8A8A', fontWeight:500 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'16px', color:'#1A1A2E', direction:'rtl' }}>הישגים אחרונים</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {RECENT_ACHIEVEMENTS.map((a,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', background:'#fff', border:'1px solid #EBEBEB', borderRadius:'12px', padding:'12px 14px', direction:'rtl', animation:'chipIn .3s ease both', animationDelay:`${i*60}ms` }}>
              <span style={{ fontSize:'20px', flexShrink:0 }}>{a.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'14px', color:'#1A1A2E' }}>{a.titleHe}</div>
                <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'11px', color:'#8A8A8A' }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={()=>navigate(PATHS.lessons)} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'14px', background:'#fff', border:'1px solid #EBEBEB', borderRadius:'14px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'15px', color:'#5A5A7A', cursor:'pointer', direction:'rtl', boxShadow:'0 2px 8px rgba(26,26,46,.05)', marginTop:'4px' }}>
          כל השיעורים
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </main>
    </div>
  )
}
