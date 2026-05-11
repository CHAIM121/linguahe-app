import React from 'react'
import { useAuth } from '../providers/AuthProvider'
import { useUserProgress, useActiveDates, useAchievements } from '../hooks/useSupabaseProgress'
import { XPBar } from '../components/progress/XPBar'
import { StreakCard } from '../components/progress/StreakCard'
import { LoadingScreen } from '../components/common/LoadingScreen'
import { getLevelForXP, getNextLevel } from '../lib/levels'

export const ProgressPage: React.FC = () => {
  const { profile: ap } = useAuth()
  const { data: pd, isLoading } = useUserProgress()
  const activeDates = useActiveDates()
  const { data: achievements } = useAchievements()
  if (isLoading) return <LoadingScreen />
  const p = pd ?? ap
  const xp = p?.total_xp ?? 0
  const cur = getLevelForXP(xp)
  const next = getNextLevel(cur.level)
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%' }}>
      <header style={{ padding:'52px 20px 16px', background:'rgba(250,250,248,.95)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', borderBottom:'1px solid rgba(235,235,235,.9)', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', direction:'rtl' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'22px', color:'#1A1A2E' }}>התקדמות</div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'#1A1A2E', color:'#fff', borderRadius:'20px', padding:'4px 12px 4px 8px', fontFamily:"'Syne',sans-serif", fontSize:'12px', fontWeight:600, direction:'ltr' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#E8A87C' }} />
            Level {cur.level} · {cur.nameEn}
          </div>
        </div>
        <XPBar totalXP={xp} currentLevelConfig={cur} nextLevelConfig={next} />
      </header>
      <main style={{ flex:1, padding:'20px 20px 0', display:'flex', flexDirection:'column', gap:'16px', paddingBottom:'24px', overflowY:'auto' }}>
        <div style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:'16px', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px rgba(26,26,46,.06)', direction:'rtl' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:`${cur.color}18`, border:`2px solid ${cur.color}60`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px' }}>{cur.emoji}</div>
            <div>
              <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'18px', color:'#1A1A2E' }}>{cur.nameHe}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'12px', color:'#8A8A8A', direction:'ltr' }}>Level {cur.level} · {cur.nameEn}</div>
            </div>
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'14px', color:'#8A8A8A', direction:'ltr' }}>{xp.toLocaleString()} XP</div>
        </div>
        <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'17px', color:'#1A1A2E', direction:'rtl' }}>רצף לימוד</div>
        <StreakCard currentStreak={p?.current_streak??0} longestStreak={p?.longest_streak??0} activeDates={activeDates} />
        <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'17px', color:'#1A1A2E', direction:'rtl' }}>סטטיסטיקה</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
          {[{v:p?.words_learned??0,l:'מילים',c:'#1A1A2E'},{v:`${p?.quizzes_taken?Math.min(Math.round(((p.total_xp??0)/Math.max(p.quizzes_taken,1)/10)*100),100):0}%`,l:'דיוק',c:'#4CAF78'},{v:p?.lessons_completed??0,l:'שיעורים',c:'#6B8FD4'},{v:p?.quizzes_taken??0,l:'חידונים',c:'#C49A3C'},{v:p?.perfect_quizzes??0,l:'מושלם',c:'#B45EA4'},{v:xp,l:'XP',c:'#E8A87C'}].map(({v,l,c})=>(
            <div key={l} style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:'14px', padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', boxShadow:'0 2px 8px rgba(26,26,46,.05)' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'22px', color:c, lineHeight:1, direction:'ltr' }}>{v}</div>
              <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'11px', color:'#8A8A8A', fontWeight:500, textAlign:'center' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'17px', color:'#1A1A2E', direction:'rtl' }}>הישגים</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {(achievements??[]).map(a=>(
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'10px', background:a.earned_at?'#fff':'#F5F5F5', border:'1px solid #EBEBEB', borderRadius:'12px', padding:'12px 14px', direction:'rtl', opacity:a.earned_at?1:.5, animation:'chipIn .3s ease both' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:a.earned_at?'#FDF4EC':'#EEE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', filter:a.earned_at?'none':'grayscale(1)', flexShrink:0 }}>{a.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'14px', color:'#1A1A2E' }}>{a.title_he}</div>
                <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'12px', color:'#8A8A8A', marginTop:'1px' }}>{a.description_he}</div>
              </div>
              {a.earned_at?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0C0C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
