import React, { useEffect, useState } from 'react'
import type { LevelConfig } from '../../lib/levels'
import { getXPIntoLevel, getXPForNextLevel } from '../../lib/levels'

interface XPBarProps { totalXP: number; currentLevelConfig: LevelConfig; nextLevelConfig: LevelConfig|null }

export const XPBar: React.FC<XPBarProps> = ({ totalXP, currentLevelConfig, nextLevelConfig }) => {
  const band = getXPForNextLevel(currentLevelConfig.level)
  const into = getXPIntoLevel(totalXP)
  const pctRaw = isFinite(band) ? Math.min((into/band)*100, 100) : 100
  const [pct, setPct] = useState(0)
  useEffect(() => { const f = requestAnimationFrame(() => setPct(pctRaw)); return () => cancelAnimationFrame(f) }, [pctRaw])
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px', width:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', direction:'rtl' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', direction:'ltr' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:currentLevelConfig.color, flexShrink:0 }} />
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'14px', color:'#1A1A2E' }}>{currentLevelConfig.emoji} {currentLevelConfig.nameEn}</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:'12px', color:'#8A8A8A' }}>Lv.{currentLevelConfig.level}</span>
        </div>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:'12px', fontWeight:600, color:'#8A8A8A', direction:'ltr' }}>{isFinite(band)?`${into} / ${band} XP`:'MAX'}</span>
      </div>
      <div style={{ height:'10px', background:'#EBEBEB', borderRadius:'20px', overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', inset:0, width:`${pct}%`, background:`linear-gradient(90deg,${currentLevelConfig.color}CC,${currentLevelConfig.color})`, borderRadius:'20px', transition:'width 1s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      {nextLevelConfig && (
        <div style={{ display:'flex', alignItems:'center', gap:'6px', direction:'rtl' }}>
          <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'12px', color:'#9A9AB0' }}>הרמה הבאה:</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:'12px', fontWeight:600, color:'#5A5A7A', direction:'ltr' }}>{nextLevelConfig.emoji} {nextLevelConfig.nameEn}</span>
        </div>
      )}
    </div>
  )
}
