import React from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from '../components/navigation/BottomNav'

function showNav(path: string): boolean {
  if (path.startsWith('/lessons/') && path !== '/lessons') return false
  if (path.startsWith('/quiz/')) return false
  return true
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation()
  const nav = showNav(pathname)
  return (
    <div style={{ width:'100%', maxWidth:'430px', margin:'0 auto', minHeight:'100vh', background:'#FAFAF8', display:'flex', flexDirection:'column', position:'relative', overflowX:'hidden' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', paddingBottom:nav?'68px':'0' }}>
        {children}
      </div>
      {nav && <BottomNav />}
    </div>
  )
}
