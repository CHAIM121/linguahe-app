import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { LoadingScreen } from './components/common/LoadingScreen'
import { useAuth } from './providers/AuthProvider'

// Pages — lazy loaded for faster initial paint
const HomePage           = React.lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const LessonsPage        = React.lazy(() => import('./pages/LessonsPage').then(m => ({ default: m.LessonsPage })))
const LessonPage         = React.lazy(() => import('./pages/LessonPage').then(m => ({ default: m.LessonPage })))
const LessonCompletePage = React.lazy(() => import('./pages/LessonCompletePage').then(m => ({ default: m.LessonCompletePage })))
const QuizPage           = React.lazy(() => import('./pages/QuizPage').then(m => ({ default: m.QuizPage })))
const ProgressPage       = React.lazy(() => import('./pages/ProgressPage').then(m => ({ default: m.ProgressPage })))
const ProfilePage        = React.lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))

// ── Protected route wrapper ───────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  // Phase 5.2: mock always authenticated. When real auth is built,
  // redirect to /auth/signin when !isAuthenticated.
  return <>{children}</>
}

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <BrowserRouter>
    <React.Suspense fallback={<LoadingScreen />}>
      <AppLayout>
        <Routes>
          {/* Tab routes */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/lessons" element={<ProtectedRoute><LessonsPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Lesson flow — full screen, no bottom nav */}
          <Route path="/lessons/:lessonId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          <Route path="/lessons/:lessonId/complete" element={<ProtectedRoute><LessonCompletePage /></ProtectedRoute>} />

          {/* Quiz flow — full screen, no bottom nav */}
          <Route path="/quiz/:lessonId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </React.Suspense>
  </BrowserRouter>
)

export default App
