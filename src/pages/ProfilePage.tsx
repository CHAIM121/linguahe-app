import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useUserProgress } from '../hooks/useSupabaseProgress'
import { getLevelForXP } from '../lib/levels'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { profile: ap, signOut, updateUserProfile } = useAuth()
  const { data: pd } = useUserProgress()
  const [signingOut, setSigningOut] = useState(false)
  const [editGoal, setEditGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const p = pd ?? ap
  const xp = p?.total_xp ?? 0
  const cur = getLevelForXP(xp)
  const name = p?.display_name ?? 'Learner'

  const handleSignOut = async () => {
    setSigningOut(true)
    try { await signOut(); navigate('/') }
    catch { setSigningOut(false) }
  }

  const saveGoal = async () => {
    const n = parseInt(goalInput, 10)
    if (n>=1&&n<=20) await updateUserProfile({ daily_goal_lessons: n })
    setEditGoal(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%', background:'#FAFAF8' }}>
      <header style={{ padding:'52px 20px 12px', background:'rgba(250,250,248,.95)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', borderBottom:'1px solid rgba(235,235,235,.9)', position:'sticky', top:0, zIndex:20, direction:'rtl' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'22px', color:'#1A1A2E', letterSpacing:'-0.4px' }}>פרופיל</div>
      </header>
      <main style={{ flex:1, padding:'24px 20px 0', display:'flex', flexDirection:'column', gap:'16px', paddingBottom:'24px' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', padding:'16px 0 8px' }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'#1A1A2E', color:'#E8A87C', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'30px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(26,26,46,.2)' }}>{name.charAt(0).toUpperCase()}</div>
          <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'22px', color:'#1A1A2E' }}>{name}</div>
          <div style={{ background:'#1A1A2E', color:'#E8A87C', borderRadius:'20px', padding:'5px 16px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'13px' }}>{cur.nameHe} · רמה {cur.level}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
          {[{v:xp,l:'XP',c:'#E8A87C'},{v:p?.current_streak??0,l:'רצף',c:'#1A1A2E'},{v:p?.words_learned??0,l:'מילים',c:'#6B8FD4'},{v:p?.lessons_completed??0,l:'שיעורים',c:'#4CAF78'}].map(({v,l,c})=>(
            <div key={l} style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:'12px', padding:'12px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', boxShadow:'0 2px 8px rgba(26,26,46,.05)' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'20px', lineHeight:1, color:c, direction:'ltr' }}>{v}</div>
              <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'10px', color:'#8A8A8A', textAlign:'center' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'16px', color:'#1A1A2E', direction:'rtl' }}>הגדרות</div>
        <div style={{ display:'flex', flexDirection:'column', background:'#fff', border:'1px solid #EBEBEB', borderRadius:'14px', overflow:'hidden' }}>
          {[
            { icon:'🔔', label:'התראות יומיות', sub:'08:00', action:()=>{} },
            { icon:'🔊', label:'הגייה אוטומטית', sub:'פעיל', action:()=>{} },
            { icon:'🎯', label:'יעד יומי', sub:`${p?.daily_goal_lessons??3} שיעורים`, action:()=>{ setGoalInput(String(p?.daily_goal_lessons??3)); setEditGoal(true) } },
            { icon:'🌐', label:'שפת ממשק', sub:'עברית', action:()=>{} },
          ].map((item,i,arr)=>(
            <div key={i} onClick={item.action} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:i<arr.length-1?'1px solid #F5F5F5':'none', direction:'rtl', cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'18px', flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:500, fontSize:'15px', color:'#1A1A2E' }}>{item.label}</span>
              </div>
              <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'13px', color:'#8A8A8A' }}>{item.sub}</span>
            </div>
          ))}
        </div>
        {editGoal&&(
          <div style={{ position:'fixed', inset:0, background:'rgba(26,26,46,.5)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={()=>setEditGoal(false)}>
            <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:'430px', background:'#fff', borderRadius:'28px 28px 0 0', padding:'28px 24px 48px', display:'flex', flexDirection:'column', gap:'16px', direction:'rtl' }}>
              <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'18px', color:'#1A1A2E' }}>יעד יומי</div>
              <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'14px', color:'#5A5A7A' }}>כמה שיעורים תרצה להשלים בכל יום?</div>
              <input type="number" min="1" max="20" value={goalInput} onChange={e=>setGoalInput(e.target.value)} style={{ height:'52px', borderRadius:'12px', border:'1.5px solid #EBEBEB', padding:'0 16px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'20px', color:'#1A1A2E', outline:'none', direction:'ltr', textAlign:'center' }} />
              <button onClick={saveGoal} style={{ height:'52px', borderRadius:'14px', border:'none', background:'#1A1A2E', color:'#fff', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'16px', cursor:'pointer' }}>שמור</button>
            </div>
          </div>
        )}
        <button onClick={handleSignOut} disabled={signingOut} style={{ width:'100%', padding:'14px', background:'#FFF0F0', border:'1px solid rgba(224,82,82,.25)', borderRadius:'14px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'15px', color:'#9B2020', cursor:signingOut?'wait':'pointer', opacity:signingOut?.6:1 }}>
          {signingOut?'יוצא...':'יציאה מהחשבון'}
        </button>
      </main>
    </div>
  )
}
