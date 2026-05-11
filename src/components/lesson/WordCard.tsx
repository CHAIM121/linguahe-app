import React, { useEffect, useRef, useState } from 'react'
import type { Word, CardPhase } from '../../types/lesson.types'

const AudioBtn: React.FC<{ word: string; url?: string }> = ({ word, url }) => {
  const [playing, setPlaying] = useState(false)
  const speak = () => {
    if (playing) return
    if (url) { const a = new Audio(url); setPlaying(true); a.onended = () => setPlaying(false); a.play(); return }
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word); u.lang='en-US'; u.rate=.88
    setPlaying(true); u.onend = u.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(u)
  }
  return (
    <button onClick={speak} aria-label={`השמע ${word}`} style={{ width:'48px', height:'48px', borderRadius:'50%', border:`1.5px solid ${playing?'#1A1A2E':'#DDDDD5'}`, background:playing?'#1A1A2E':'#F5F0E8', color:playing?'#E8A87C':'#1A1A2E', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
    </button>
  )
}

interface Props { word: Word; cardPhase: CardPhase; onTap: () => void; onRevealed: () => void; onExited: () => void; onKnewIt: () => void; onPracticeAgain: () => void; isRequeued: boolean }

export const WordCard: React.FC<Props> = ({ word, cardPhase, onTap, onRevealed, onExited, onKnewIt, onPracticeAgain, isRequeued }) => {
  const [flipped, setFlipped] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [entering, setEntering] = useState(true)
  const [exitDir, setExitDir] = useState<'r'|'l'>('r')
  const revealed = useRef(false)

  useEffect(() => { const t = setTimeout(()=>setEntering(false),350); return ()=>clearTimeout(t) }, [])
  useEffect(() => { setFlipped(false); setExiting(false); setEntering(true); revealed.current=false; const t=setTimeout(()=>setEntering(false),350); return ()=>clearTimeout(t) }, [word.id])
  useEffect(() => {
    if (cardPhase==='revealing'&&!flipped) { setFlipped(true); const t=setTimeout(()=>{if(!revealed.current){revealed.current=true;onRevealed()}},420); return()=>clearTimeout(t) }
    if (cardPhase==='exiting'&&!exiting) { setExiting(true); const t=setTimeout(onExited,320); return()=>clearTimeout(t) }
  }, [cardPhase, flipped, exiting, onRevealed, onExited])

  const tx = exiting?(exitDir==='r'?'110%':'-110%'):entering?'4px':'0'
  const op = exiting||entering?0:1
  const isBack = cardPhase==='back'

  return (
    <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'16px', opacity:op, transform:`translateX(${tx})`, transition:exiting?'transform .32s cubic-bezier(.4,0,1,1),opacity .28s ease':'transform .35s cubic-bezier(.22,1,.36,1),opacity .3s ease' }}>
      {isRequeued && <div style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'12px', fontWeight:600, color:'#7A4520', background:'#FDF4EC', border:'1px solid rgba(232,168,124,.4)', borderRadius:'20px', padding:'4px 14px', width:'fit-content', margin:'0 auto' }}>🔄 חזרה על המילה</div>}
      <div style={{ width:'100%', height:'360px', position:'relative', transformStyle:'preserve-3d', transition:'transform .42s cubic-bezier(.4,0,.2,1)', transform:flipped?'rotateY(180deg)':'rotateY(0deg)', borderRadius:'20px', cursor:flipped?'default':'pointer' }} onClick={!flipped?onTap:undefined}>
        <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', borderRadius:'20px', background:'#fff', border:'1px solid #EBEBEB', boxShadow:'0 4px 24px rgba(26,26,46,.08)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 24px 24px', overflow:'hidden' }}>
          <p style={{ position:'absolute', top:'18px', fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'11px', fontWeight:500, color:'#C0C0C8' }}>הקש לגלות תרגום</p>
          <div style={{ fontSize:'54px', marginBottom:'20px', lineHeight:1 }}>{word.imageEmoji}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'44px', color:'#1A1A2E', letterSpacing:'-1.5px', textAlign:'center', direction:'ltr', marginBottom:'10px' }}>{word.english}</div>
          <div style={{ fontFamily:"'Noto Sans',monospace", fontSize:'15px', color:'#A0A0B0', direction:'ltr' }}>/{word.transliteration}/</div>
        </div>
        <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', transform:'rotateY(180deg)', borderRadius:'20px', background:'#FAFAF8', border:'1px solid #EBEBEB', boxShadow:'0 4px 24px rgba(26,26,46,.08)', display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 24px 24px', overflow:'hidden' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'16px', color:'#C0C0C8', textAlign:'center', marginBottom:'8px', direction:'ltr' }}>{word.english}</div>
          <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:700, fontSize:'40px', color:'#1A1A2E', textAlign:'center', direction:'rtl', marginBottom:'4px', letterSpacing:'1px', lineHeight:1.25 }}>{word.hebrew}</div>
          <div style={{ fontFamily:"'Noto Sans',monospace", fontSize:'14px', color:'#B0B0C0', direction:'ltr', marginBottom:'14px' }}>{word.transliteration}</div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', direction:'rtl' }}>
            <AudioBtn word={word.english} url={word.audioUrl} />
            <span style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'13px', color:'#8A8A8A' }}>השמע הגייה</span>
          </div>
          <div style={{ width:'100%', height:'1px', background:'#EBEBEB', marginBottom:'14px', flexShrink:0 }} />
          <div style={{ width:'100%' }}>
            <p style={{ fontFamily:"'Noto Sans',sans-serif", fontSize:'14px', color:'#5A5A7A', fontStyle:'italic', textAlign:'left', direction:'ltr', lineHeight:1.5 }}>"{word.exampleEn}"</p>
            <p style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'13px', color:'#9A9AB0', textAlign:'right', direction:'rtl', lineHeight:1.6, marginTop:'6px' }}>{word.exampleHe}</p>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:'12px', opacity:isBack?1:0, transform:isBack?'translateY(0)':'translateY(12px)', pointerEvents:isBack?'auto':'none', transition:'opacity .25s .1s ease,transform .25s .1s ease' }}>
        <button onClick={()=>{setExitDir('l');onPracticeAgain()}} style={{ flexShrink:0, display:'flex', alignItems:'center', gap:'8px', height:'52px', padding:'0 20px', borderRadius:'14px', border:'1px solid rgba(232,168,124,.35)', background:'#FDF4EC', color:'#7A4520', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'15px', cursor:'pointer', direction:'rtl' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          תרגל שוב
        </button>
        <button onClick={()=>{setExitDir('r');onKnewIt()}} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', height:'52px', borderRadius:'14px', border:'none', background:'#1A1A2E', color:'#fff', fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'16px', cursor:'pointer', direction:'rtl', boxShadow:'0 4px 16px rgba(26,26,46,.2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          ידעתי!
        </button>
      </div>
    </div>
  )
}
