import React from 'react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps { titleHe: string; showBack?: boolean; onBack?: () => void; rightSlot?: React.ReactNode }

export const Header: React.FC<HeaderProps> = ({ titleHe, showBack=false, onBack, rightSlot }) => {
  const navigate = useNavigate()
  return (
    <header style={{ padding:'52px 16px 12px', background:'rgba(250,250,248,.95)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', borderBottom:'1px solid rgba(235,235,235,.9)', position:'sticky', top:0, zIndex:20, direction:'rtl' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ width:'48px', display:'flex', alignItems:'center' }}>
          {showBack && (
            <button onClick={onBack ?? (() => navigate(-1))} aria-label="חזור" style={{ width:'36px', height:'36px', borderRadius:'50%', border:'none', background:'transparent', color:'#5A5A7A', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
        </div>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'20px', color:'#1A1A2E', letterSpacing:'-0.4px', flex:1, textAlign:'center' }}>{titleHe}</h1>
        <div style={{ width:'48px', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{rightSlot}</div>
      </div>
    </header>
  )
}
