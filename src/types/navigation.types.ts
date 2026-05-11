export type RouteId = 'home'|'lessons'|'lesson'|'lesson-complete'|'quiz'|'quiz-result'|'progress'|'profile'
export type TransitionType = 'fade'|'slide-left'|'slide-right'|'slide-up'|'none'
export interface NavTab { id: RouteId; path: string; labelHe: string; icon: 'home'|'book'|'star'|'user' }
