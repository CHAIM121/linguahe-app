import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'בית', icon: '🏠' },
  { path: '/lessons', label: 'שיעורים', icon: '📚' },
  { path: '/progress', label: 'התקדמות', icon: '📊' },
  { path: '/profile', label: 'פרופיל', icon: '👤' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  // Hide on lesson flow pages
  const hide = location.pathname.includes('/lesson/')
  if (hide) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50" dir="rtl">
      <div className="max-w-md mx-auto flex">
        {tabs.map(tab => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center py-3 transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-xs mt-0.5 font-medium ${active ? 'text-indigo-600' : ''}`}>
                {tab.label}
              </span>
              {active && (
                <div className="w-1 h-1 bg-indigo-600 rounded-full mt-1" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
