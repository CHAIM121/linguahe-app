import React from 'react'
const DAY_HE = ['א','ב','ג','ד','ה','ו','ש']
function lastNDays(n: number): string[] {
  return Array.from({length:n},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(n-1-i));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})
}
interface Props { currentStreak: number; longestStreak: number; activeDates: string[] }
export const StreakCard: React.FC<Props> = ({ currentStreak, longestStreak, activeDates }) => {
  const today = new Date().toISOString().slice(0,10)
  const week = lastNDays(7)
  return (
    <div style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:'16px', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px rgba(26,26,46,.06)', direction:'rtl' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'42px', height:'42px', background:'#FFF4E8', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', animation:'firePulse 2.5s ease-in-out infinite', flexShrink:0 }}>🔥</div>
        <div>
          <div style={{ display:'flex', alignItems:'baseline', gap:'1px' }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'26px', color:'#1A1A2E', lineHeight:1, direction:'ltr' }}>{currentStreak}</span>
            <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'13px', color:'#5A5A7A' }}> ימים</span>
          </div>
          <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'11px', color:'#8A8A8A' }}>רצף לימוד</div>
          {longestStreak > 0 && <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'11px', color:'#C0A080', marginTop:'2px' }}>שיא: {longestStreak} ימים</div>}
        </div>
      </div>
      <div>
        <div style={{ display:'flex', gap:'4px', direction:'ltr' }}>
          {week.map(date => {
            const on = activeDates.includes(date), isT = date === today, idx = new Date(date+'T12:00:00').getDay()
            return <div key={date} style={{ width:'22px', height:'22px', borderRadius:'50%', background:on?'#E8A87C':isT?'#1A1A2E':'#EBEBEB', color:on||isT?'#fff':'#8A8A8A', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontSize:'9px', fontWeight:700, boxShadow:on?'0 2px 8px rgba(232,168,124,.4)':'none', transition:'all .25s' }}>{DAY_HE[idx]}</div>
          })}
        </div>
        <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'10px', color:'#8A8A8A', textAlign:'center', marginTop:'3px' }}>השבוע</div>
      </div>
    </div>
  )
}
