import React, { useEffect, useRef, useState } from 'react'
import type { LevelConfig } from '../../lib/levels'

const COLORS = ['#E8A87C','#1A1A2E','#4CAF78','#6B8FD4','#B45EA4','#C49A3C']

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef<number>(0)
  useEffect(() => {
    if (!active) return
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    c.width = c.offsetWidth; c.height = c.offsetHeight
    const W = c.width, H = c.height
    let particles = Array.from({length:80},()=>({ x:W/2+(Math.random()-.5)*120, y:H*.35, vx:(Math.random()-.5)*10, vy:-Math.random()*12-4, color:COLORS[Math.floor(Math.random()*COLORS.length)], size:Math.random()*8+4, rot:Math.random()*Math.PI*2, rs:(Math.random()-.5)*.2, op:1, shape:Math.random()>.5?'rect':'circle' as const }))
    const draw = () => {
      ctx.clearRect(0,0,W,H)
      particles = particles.filter(p => p.op > .02)
      particles.forEach(p => { p.x+=p.vx;p.y+=p.vy;p.vy+=.35;p.vx*=.99;p.rot+=p.rs;p.op-=.012;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=Math.max(0,p.op);ctx.fillStyle=p.color;if(p.shape==='rect')ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);else{ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill()};ctx.restore() })
      if (particles.length > 0) raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf.current)
  }, [active])
  if (!active) return null
  return <canvas ref={ref} style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:299 }} />
}

interface Props { newLevel: LevelConfig; onDismiss: () => void }
export const LevelUpModal: React.FC<Props> = ({ newLevel, onDismiss }) => {
  const [visible, setVisible] = useState(false)
  const [celebrating, setCelebrating] = useState(true)
  useEffect(() => { const t1 = setTimeout(()=>setVisible(true),60); const t2 = setTimeout(()=>setCelebrating(false),2500); return ()=>{clearTimeout(t1);clearTimeout(t2)} }, [])
  const dismiss = () => { setVisible(false); setTimeout(onDismiss,300) }
  return (
    <>
      <Confetti active={celebrating} />
      <div onClick={dismiss} style={{ position:'fixed', inset:0, background:'rgba(26,26,46,.65)', zIndex:300, opacity:visible?1:0, transition:'opacity .3s', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)' }} />
      <div role="dialog" aria-modal="true" style={{ position:'fixed', bottom:0, left:'50%', transform:`translateX(-50%) translateY(${visible?'0':'100%'})`, transition:'transform .45s cubic-bezier(.22,1,.36,1)', width:'100%', maxWidth:'430px', background:'#fff', borderRadius:'28px 28px 0 0', zIndex:301, padding:'32px 28px 48px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
        <div style={{ width:'40px', height:'4px', borderRadius:'2px', background:'#EBEBEB', marginBottom:'4px' }} />
        <div style={{ width:'100px', height:'100px', borderRadius:'50%', background:`${newLevel.color}18`, border:`3px solid ${newLevel.color}60`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'44px', animation:'popIn .6s .3s ease both' }}>{newLevel.emoji}</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'13px', letterSpacing:'.12em', color:newLevel.color }}>LEVEL UP!</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'28px', color:'#1A1A2E' }}>עלית לרמה {newLevel.level}!</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'18px', color:newLevel.color, direction:'ltr' }}>{newLevel.nameEn}</div>
        </div>
        <button onClick={dismiss} style={{ width:'100%', height:'54px', background:'#1A1A2E', color:'#fff', border:'none', borderRadius:'16px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'17px', cursor:'pointer' }}>המשך ללמוד 💪</button>
      </div>
    </>
  )
}
