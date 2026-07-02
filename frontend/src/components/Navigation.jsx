import { useState } from 'react'
import {
  LayoutDashboard, Activity, History, Lightbulb, Settings,
  LogOut, ChevronRight, User, Menu, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview' },
  { id: 'sensors', label: 'Sensors', icon: Activity, desc: 'Live readings' },
  { id: 'history', label: 'History', icon: History, desc: 'Past records' },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, desc: 'Wellness tips' },
  { id: 'profile', label: 'Profile', icon: User, desc: 'My account' },
  { id: 'settings', label: 'Settings', icon: Settings, desc: 'Configuration' },
]

const bottomItems = sidebarItems.slice(0, 4)

const iconColors = {
  dashboard: { from: '#06D6A0', to: '#05B589', glow: 'rgba(6,214,160,0.4)' },
  sensors: { from: '#F97316', to: '#EA580C', glow: 'rgba(249,115,22,0.4)' },
  history: { from: '#818CF8', to: '#6366F1', glow: 'rgba(129,140,248,0.4)' },
  recommendations: { from: '#FBBF24', to: '#F59E0B', glow: 'rgba(251,191,36,0.4)' },
  profile: { from: '#A78BFA', to: '#8B5CF6', glow: 'rgba(167,139,250,0.4)' },
  settings: { from: '#94A3B8', to: '#64748B', glow: 'rgba(148,163,184,0.3)' },
}

const sidebarWidth = 240

export default function Navigation({ active, onNavigate, connected, onLogout, user }) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(null)

  const toggle = () => setOpen((v) => !v)
  const close = () => setOpen(false)

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={toggle}
        className="fixed top-3 right-3 z-50 w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-white/[0.10] transition-colors"
        aria-label="Toggle navigation"
      >
        {open ? <X className="w-4 h-4 text-gray-400" /> : <Menu className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Overlay (mobile only) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 lg:bg-transparent lg:pointer-events-none"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* ===== SIDEBAR (slide in/out) ===== */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: sidebarWidth }}
            animate={{ x: 0 }}
            exit={{ x: sidebarWidth }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-40"
            style={{ width: sidebarWidth }}
          >
            <div className="h-full glass border-l border-white/[0.06] flex flex-col" style={{ backdropFilter: 'blur(20px)' }}>

              {/* Brand */}
              <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-white/[0.06]">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-calm to-emerald-500 flex items-center justify-center shadow-lg shadow-calm/20">
                    <span className="text-white font-black text-sm">K</span>
                  </div>
                  <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'} ring-[3px] ring-surface`} />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight leading-none">Psychology Assistant</h1>
                  <p className="text-[9px] text-gray-600 font-medium mt-1 tracking-wider uppercase">Wellness Monitor</p>
                </div>
              </div>

              {/* Section label */}
              <div className="px-5 pt-5 pb-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-gray-700">Main Menu</p>
              </div>

              {/* Nav items */}
              <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
                {sidebarItems.map((item, i) => {
                  const Icon = item.icon
                  const isActive = active === item.id
                  const isHovered = hovered === item.id
                  const c = iconColors[item.id] || iconColors.dashboard

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { onNavigate(item.id); close() }}
                      onMouseEnter={() => setHovered(item.id)}
                      onMouseLeave={() => setHovered(null)}
                      className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group"
                    >
                      {/* Active background glow */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-bg"
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            background: `linear-gradient(135deg, ${c.from}12, ${c.to}08)`,
                            boxShadow: `inset 0 1px 0 ${c.from}22`,
                          }}
                        />
                      )}

                      {/* Active left bar */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ background: `linear-gradient(180deg, ${c.from}, ${c.to})` }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className="relative flex items-center justify-center rounded-xl shrink-0 transition-all duration-300"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${c.from}25, ${c.to}15)`
                            : 'rgba(255,255,255,0.03)',
                          width: 36, height: 36,
                          transform: isHovered && !isActive ? 'scale(1.08)' : 'scale(1)',
                        }}
                      >
                        <Icon
                          className="w-[18px] h-[18px] transition-all duration-300"
                          style={{
                            color: isActive ? c.from : isHovered ? '#e2e8f0' : '#64748b',
                          }}
                        />
                        {isActive && (
                          <motion.div
                            layoutId="icon-ring"
                            className="absolute inset-0 rounded-xl"
                            style={{ boxShadow: `0 0 16px ${c.glow}` }}
                          />
                        )}
                      </div>

                      {/* Label + desc */}
                      <div className="text-left flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold transition-colors duration-200"
                          style={{ color: isActive ? c.from : isHovered ? '#e2e8f0' : '#64748b' }}
                        >
                          {item.label}
                        </p>
                        <p className="text-[10px] text-gray-700 mt-0.5 truncate">{item.desc}</p>
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        className="w-3.5 h-3.5 transition-all duration-300"
                        style={{
                          color: isActive ? c.from : '#333',
                          opacity: isHovered || isActive ? 1 : 0,
                          transform: isHovered || isActive ? 'translateX(0)' : 'translateX(-4px)',
                        }}
                      />
                    </motion.button>
                  )
                })}
              </nav>

              {/* User / Bottom */}
              <div className="border-t border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center ring-2 ring-white/[0.10]">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-300 truncate">{user?.name || user?.email?.split('@')[0] || 'User'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{connected ? 'Connected' : 'Offline'}</p>
                  </div>
                  <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors" title="Sign out">
                    <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ===== BOTTOM NAV (always visible) ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-30">
        <div className="glass border-t border-white/[0.06] px-1" style={{ backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-around py-1">
            {bottomItems.map((item) => {
              const Icon = item.icon
              const isActive = active === item.id
              const c = iconColors[item.id] || iconColors.dashboard

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]"
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottom-dot"
                      className="absolute -top-0.5 w-6 h-0.5 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }}
                    />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-white/[0.06]' : ''}`}>
                    <Icon className="w-4 h-4 transition-colors" style={{ color: isActive ? c.from : '#4a5568' }} />
                  </div>
                  <span
                    className="text-[8px] font-semibold uppercase tracking-wider transition-colors"
                    style={{ color: isActive ? c.from : '#4a5568' }}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
