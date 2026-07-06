import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import SensorsPage from './pages/SensorsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import RecommendationPage from './pages/RecommendationPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { getCurrentUser } from './services/api'

const pages = {
  dashboard: Dashboard,
  sensors: SensorsPage,
  history: HistoryPage,
  recommendations: RecommendationPage,
  profile: ProfilePage,
  settings: SettingsPage,
}

function loadToken() {
  try { return localStorage.getItem('khairaty_token') } catch { return null }
}

function saveToken(token) {
  if (token) localStorage.setItem('khairaty_token', token)
  else localStorage.removeItem('khairaty_token')
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

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

export default function App() {
  const [user, setUserState] = useState(loadUser)
  const [token, setTokenState] = useState(loadToken)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [authPage, setAuthPage] = useState('login')
  const [verifying, setVerifying] = useState(!!loadToken())

  useEffect(() => {
    const savedToken = loadToken()
    if (!savedToken) { setVerifying(false); return }
    getCurrentUser()
      .then((userData) => {
        setUserState(withDefaults(userData))
        setVerifying(false)
      })
      .catch(() => {
        saveToken(null)
        saveUser(null)
        setTokenState(null)
        setUserState(null)
        setVerifying(false)
      })
  }, [])

  const setUser = (data) => { saveUser(data); setUserState(data) }
  const setToken = (t) => { saveToken(t); setTokenState(t) }

  const withDefaults = (data) => ({
    ...data,
    phone: data.phone || '',
    location: data.location || '',
    memberSince: data.memberSince || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    bio: data.bio || 'Wellness journey in progress',
  })

  const handleLogin = (authResult) => {
    setToken(authResult.token)
    setUser(withDefaults(authResult.user))
  }

  const handleRegister = (authResult) => {
    setToken(authResult.token)
    setUser(withDefaults(authResult.user))
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
  }

  if (verifying) {
    return (
      <div className="min-h-screen app-bg-auth flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Page user={user} onUpdateUser={setUser} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
