import type { NavTab } from '../types/navigation.types'

export const NAV_TABS: NavTab[] = [
  { id:'home',     path:'/',         labelHe:'בית',     icon:'home' },
  { id:'lessons',  path:'/lessons',  labelHe:'שיעורים', icon:'book' },
  { id:'progress', path:'/progress', labelHe:'התקדמות', icon:'star' },
  { id:'profile',  path:'/profile',  labelHe:'פרופיל',  icon:'user' },
]

export const LESSON_ID_RESTAURANT = '20000000-0000-0000-0000-000000000001'

export const PATHS = {
  home: '/',
  lessons: '/lessons',
  lesson: (id: string) => `/lessons/${id}`,
  lessonComplete: (id: string) => `/lessons/${id}/complete`,
  quiz: (id: string) => `/quiz/${id}`,
  progress: '/progress',
  profile: '/profile',
} as const
