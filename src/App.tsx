import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { LoadingScreen } from './components/common/LoadingScreen'
import { useAuth } from './providers/AuthProvider'

const HomePage           = React.lazy(()=>import('./pages/HomePage').then(m=>({default:m.HomePage})))
const LessonsPage        = React.lazy(()=>import('./pages/LessonsPage').then(m=>({default:m.LessonsPage})))
const LessonPage         = React.lazy(()=>import('./pages/LessonPage').then(m=>({default:m.LessonPage})))
const LessonCompletePage = React.lazy(()=>import('./pages/LessonCompletePage').then(m=>({default:m.LessonCompletePage})))
const QuizPage           = React.lazy(()=>import('./pages/QuizPage').then(m=>({default:m.QuizPage})))
const ProgressPage       = React.lazy(()=>import('./pages/ProgressPage').then(m=>({default:m.ProgressPage})))
const ProfilePage        = React.lazy(()=>import('./pages/ProfilePage').then(m=>({default:m.ProfilePage})))

const Guard: React.FC<{children: React.ReactNode}> = ({children}) => {
  const { isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  return <>{children}</>
}

const App: React.FC = () => (
  <BrowserRouter>
    <React.Suspense fallback={<LoadingScreen />}>
      <AppLayout>
        <Routes>
          <Route path="/"                         element={<Guard><HomePage /></Guard>} />
          <Route path="/lessons"                  element={<Guard><LessonsPage /></Guard>} />
          <Route path="/lessons/:lessonId"        element={<Guard><LessonPage /></Guard>} />
          <Route path="/lessons/:lessonId/complete" element={<Guard><LessonCompletePage /></Guard>} />
          <Route path="/quiz/:lessonId"           element={<Guard><QuizPage /></Guard>} />
          <Route path="/progress"                 element={<Guard><ProgressPage /></Guard>} />
          <Route path="/profile"                  element={<Guard><ProfilePage /></Guard>} />
          <Route path="*"                         element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </React.Suspense>
  </BrowserRouter>
)

export default App
