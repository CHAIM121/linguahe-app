import React, { useEffect, useState } from 'react'

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'טוען...' }) => {
  const [dots, setDots] = useState('')
  useEffect(() => { const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d+'.'), 400); return () => clearInterval(t) }, [])
  return (
    <div style={{ width:'100%', minHeight:'100vh', background:'#FAFAF8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' }}>
      <div style={{ position:'relative', width:'72px', height:'72px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid transparent', borderTopColor:'#1A1A2E', borderRightColor:'#E8A87C', animation:'spin 1s linear infinite' }} />
        <span style={{ fontSize:'28px', position:'relative', zIndex:1 }}>📖</span>
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'26px', color:'#1A1A2E', letterSpacing:'-0.5px', direction:'ltr' }}>
        Lingua<span style={{ color:'#E8A87C' }}>He</span>
      </div>
      <p style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'14px', color:'#8A8A8A', minWidth:'80px', textAlign:'center' }}>{message}{dots}</p>
    </div>
  )
}

export const ErrorState: React.FC<{ titleHe?: string; messageHe?: string; onRetry?: () => void }> = ({ titleHe='משהו השתבש', messageHe='אירעה שגיאה. נסה שוב.', onRetry }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', padding:'40px 28px', textAlign:'center', direction:'rtl', flex:1, minHeight:'60vh' }}>
    <div style={{ fontSize:'48px' }}>😕</div>
    <h2 style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'20px', color:'#1A1A2E' }}>{titleHe}</h2>
    <p style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'14px', color:'#8A8A8A', lineHeight:1.6 }}>{messageHe}</p>
    {onRetry && <button onClick={onRetry} style={{ marginTop:'8px', padding:'10px 28px', background:'#1A1A2E', color:'#fff', border:'none', borderRadius:'12px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'15px', cursor:'pointer' }}>נסה שוב</button>}
  </div>
)

export const EmptyState: React.FC<{ emoji?: string; titleHe: string; messageHe?: string; ctaLabelHe?: string; onCta?: () => void }> = ({ emoji='📭', titleHe, messageHe, ctaLabelHe, onCta }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px', padding:'48px 28px', textAlign:'center', direction:'rtl', flex:1 }}>
    <div style={{ fontSize:'52px', marginBottom:'4px' }}>{emoji}</div>
    <h2 style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'19px', color:'#1A1A2E' }}>{titleHe}</h2>
    {messageHe && <p style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'14px', color:'#8A8A8A', lineHeight:1.6, maxWidth:'280px' }}>{messageHe}</p>}
    {ctaLabelHe && onCta && <button onClick={onCta} style={{ marginTop:'12px', padding:'10px 28px', background:'#1A1A2E', color:'#fff', border:'none', borderRadius:'12px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'15px', cursor:'pointer' }}>{ctaLabelHe}</button>}
  </div>
)
