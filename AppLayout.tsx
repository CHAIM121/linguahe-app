import React from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from '../components/navigation/BottomNav'

const NO_NAV_PREFIXES = ['/lessons/', '/quiz/']

function shouldShowNav(pathname: string): boolean {
  if (NO_NAV_PREFIXES.some(p => pathname.startsWith(p))) return false
  return true
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation()
  const showNav = shouldShowNav(pathname)

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        minHeight: '100vh',
        background: '#FAFAF8',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: showNav ? '68px' : '0',
        }}
      >
        {children}
      </div>
      {showNav && <BottomNav />}
    </div>
  )
}
