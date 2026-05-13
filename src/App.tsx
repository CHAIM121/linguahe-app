import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import BottomNav from './components/BottomNav'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import HomePage from './pages/HomePage'
import LessonsPage from './pages/LessonsPage'
import LessonPage from './pages/LessonPage'
import LessonCompletePage from './pages/LessonCompletePage'
import QuizPage from './pages/QuizPage'
import ProgressPage from './pages/ProgressPage'
import ProfilePage from './pages/ProfilePage'

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/lessons" element={<ProtectedRoute><LessonsPage /></ProtectedRoute>} />
        <Route path="/lesson/:id" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
        <Route path="/lesson/:id/complete" element={<ProtectedRoute><LessonCompletePage /></ProtectedRoute>} />
        <Route path="/lesson/:id/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
