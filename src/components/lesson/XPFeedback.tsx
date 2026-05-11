import React, { useEffect } from 'react'
interface Props { amount: number; onDone: () => void }
export const XPFeedback: React.FC<Props> = ({ amount, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 1100); return () => clearTimeout(t) }, [onDone])
  return (
    <div aria-live="polite" style={{ position:'fixed', top:'28%', left:'50%', transform:'translateX(-50%)', zIndex:200, pointerEvents:'none', animation:'xpFloat 1.1s cubic-bezier(.22,1,.36,1) both' }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:'2px', background:'#1A1A2E', color:'#E8A87C', padding:'8px 20px', borderRadius:'50px', boxShadow:'0 8px 32px rgba(26,26,46,.25)', direction:'ltr' }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'16px', opacity:.7 }}>+</span>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'28px', lineHeight:1 }}>{amount}</span>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:'14px', opacity:.7, marginLeft:'2px' }}>XP</span>
      </div>
    </div>
  )
}
