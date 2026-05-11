import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopicsWithLessons, useUserLessonProgress } from '../hooks/useSupabaseLesson'
import { useAuth } from '../providers/AuthProvider'
import { Header } from '../components/navigation/Header'
import { LoadingScreen, ErrorState } from '../components/common/LoadingScreen'
import { PATHS } from '../routes'
import type { TopicWithLessons } from '../types/database.types'

export const LessonsPage: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: topics, isLoading, error } = useTopicsWithLessons()
  const { data: progress } = useUserLessonProgress()
  const [expanded, setExpanded] = useState<string|null>('food-restaurants')

  if (isLoading) return <><Header titleHe="שיעורים" /><LoadingScreen /></>
  if (error) return <><Header titleHe="שיעורים" /><ErrorState /></>

  const pMap = new Map((progress??[]).map(p=>[p.lesson_id, p]))
  const userLevel = profile?.current_level ?? 1

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%' }}>
      <Header titleHe="שיעורים" />
      <main style={{ flex:1, padding:'16px 20px', paddingBottom:'24px', display:'flex', flexDirection:'column', gap:'12px' }}>
        {(topics??[]).map((topic: TopicWithLessons) => {
          const locked = topic.min_level > userLevel
          const open = expanded === topic.slug
          const lessons = topic.lessons ?? []
          const done = lessons.filter(l => pMap.get(l.id)?.status === 'completed').length
          const pct = lessons.length > 0 ? Math.round((done/lessons.length)*100) : 0
          const C = 2*Math.PI*15
          const color = pct===100?'#4CAF78':pct>0?'#E8A87C':'#EBEBEB'
          return (
            <div key={topic.id} style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 8px rgba(26,26,46,.05)', opacity:locked?.55:1 }}>
              <div onClick={()=>!locked&&setExpanded(open?null:topic.slug)} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 16px', direction:'rtl', cursor:locked?'not-allowed':'pointer' }}>
                <div style={{ flexShrink:0, width:'36px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {locked ? <span style={{ fontSize:'18px' }}>🔒</span> : (
                    <svg width="36" height="36" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#EBEBEB" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={C.toFixed(1)} strokeDashoffset={(C-(C*pct/100)).toFixed(1)} style={{ transform:'rotate(-90deg)', transformOrigin:'18px 18px' }}/>
                      <text x="18" y="22" textAnchor="middle" fontFamily="Syne" fontWeight="700" fontSize="9" fill={color}>{pct}%</text>
                    </svg>
                  )}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontWeight:600, fontSize:'15px', color:'#1A1A2E', marginBottom:'2px' }}>{topic.title_he}</div>
                  <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'12px', color:'#8A8A8A' }}>{topic.title_en} · {done}/{lessons.length} שיעורים{locked?` · נעול עד רמה ${topic.min_level}`:''}</div>
                </div>
                <span style={{ fontSize:'20px', flexShrink:0 }}>{topic.icon_emoji}</span>
                {!locked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9AB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform:`rotate(${open?90:270}deg)`, transition:'transform .25s', flexShrink:0 }}><path d="M15 18l-6-6 6-6"/></svg>}
              </div>
              {open && !locked && (
                <div style={{ borderTop:'1px solid #EBEBEB' }}>
                  {lessons.map(lesson => {
                    const lp = pMap.get(lesson.id)
                    const isDone = lp?.status === 'completed'
                    const inProg = lp?.status === 'in_progress'
                    return (
                      <div key={lesson.id} onClick={()=>navigate(PATHS.lesson(lesson.id))} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderTop:'1px solid #F5F5F5', cursor:'pointer', direction:'rtl' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='#F8F8F6')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:isDone?'#F0FDF5':inProg?'#FDF4EC':'#F5F5F5', border:`1px solid ${isDone?'rgba(76,175,120,.4)':inProg?'rgba(232,168,124,.4)':'#EBEBEB'}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'11px', color:'#5A5A7A', flexShrink:0 }}>{isDone?'✓':inProg?`${lp?.best_score??0}%`:'•'}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:'14px', color:'#1A1A2E', direction:'ltr' }}>{lesson.title_en}</div>
                          <div style={{ fontFamily:"'Noto Sans Hebrew',sans-serif", fontSize:'12px', color:'#8A8A8A' }}>{lesson.title_he}</div>
                        </div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:'12px', color:'#C0A080', flexShrink:0, direction:'ltr' }}>+{lesson.xp_reward} XP</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </main>
    </div>
  )
}
