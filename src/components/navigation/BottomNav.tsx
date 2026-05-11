import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NAV_TABS } from '../../routes'
import type { NavTab } from '../../types/navigation.types'

const NavIcon: React.FC<{ name: NavTab['icon']; active: boolean }> = ({ name, active }) => {
  const c = active ? '#1A1A2E' : '#9A9AB0', sw = active ? '2.2' : '1.8', s = { width:22, height:22 } as const
  if (name === 'home') return <svg {...s} viewBox="0 0 24 24" fill={active?'#1A1A2E':'none'} stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>
  if (name === 'book') return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill={active?'#1A1A2E':'none'}/></svg>
  if (name === 'star') return <svg {...s} viewBox="0 0 24 24" fill={active?'#1A1A2E':'none'} stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  return <svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" fill={active?'#1A1A2E':'none'}/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
}

export const BottomNav: React.FC = () => {
  const navigate = useNavigate(); const { pathname } = useLocation()
  return (
    <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', background:'#fff', borderTop:'1px solid #EBEBEB', display:'flex', zIndex:100, boxShadow:'0 -4px 24px rgba(26,26,46,.07)', paddingBottom:'env(safe-area-inset-bottom,8px)' }}>
      {NAV_TABS.map(tab => {
        const active = pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path))
        return (
          <button key={tab.id} onClick={() => navigate(tab.path)} aria-label={tab.labelHe} aria-current={active?'page':undefined}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'10px 4px 6px', border:'none', background:'transparent', cursor:'pointer', color:active?'#1A1A2E':'#9A9AB0', position:'relative', WebkitTapHighlightColor:'transparent' }}>
            <div style={{ position:'absolute', top:0, left:'50%', transform:`translateX(-50%) scaleX(${active?1:0})`, width:'24px', height:'3px', background:'#1A1A2E', borderRadius:'0 0 3px 3px', transition:'transform .25s cubic-bezier(.22,1,.36,1)' }} />
            <div style={{ transform:active?'translateY(-1px)':'none', transition:'transform .2s cubic-bezier(.22,1,.36,1)' }}>
              <NavIcon name={tab.icon} active={active} />
            </div>
            <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'10px', fontWeight:active?700:500, lineHeight:1 }}>{tab.labelHe}</span>
          </button>
        )
      })}
    </nav>
  )
}
