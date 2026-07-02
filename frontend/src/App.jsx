import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import SensorsPage from './pages/SensorsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import RecommendationPage from './pages/RecommendationPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

const pages = {
  dashboard: Dashboard,
  sensors: SensorsPage,
  history: HistoryPage,
  recommendations: RecommendationPage,
  profile: ProfilePage,
  settings: SettingsPage,
}

function loadUser() {
  try {
    const saved = localStorage.getItem('khairaty_user')
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

function saveUser(data) {
  if (data) localStorage.setItem('khairaty_user', JSON.stringify(data))
  else localStorage.removeItem('khairaty_user')
}

export default function App() {
  const [user, setUserState] = useState(loadUser)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [authPage, setAuthPage] = useState('login')

  const setUser = (data) => { saveUser(data); setUserState(data) }

  const withDefaults = (data) => ({
    ...data,
    phone: data.phone || '',
    location: data.location || '',
    memberSince: data.memberSince || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    bio: data.bio || 'Wellness journey in progress',
  })

  const handleLogin = (data) => setUser(withDefaults(data))
  const handleRegister = (data) => setUser(withDefaults(data))
  const handleLogout = () => setUser(null)

  if (!user) {
    if (authPage === 'register') {
      return (
        <div className="min-h-screen app-bg-auth">
          <RegisterPage onRegister={handleRegister} onSwitchToLogin={() => setAuthPage('login')} />
        </div>
      )
    }
    return (
      <div className="min-h-screen app-bg-auth">
        <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setAuthPage('register')} />
      </div>
    )
  }

  const Page = pages[activeTab] || Dashboard

  return (
    <div className="min-h-screen app-bg">
      <Navigation active={activeTab} onNavigate={setActiveTab} onLogout={handleLogout} user={user} />
      <div className="pb-14">
        <Page user={user} onUpdateUser={setUser} />
      </div>
    </div>
  )
}
