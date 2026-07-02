import { Activity, User, Wifi, WifiOff, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

const RISK_BADGE = {
  LOW_RISK: { label: 'Low Risk', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  MODERATE_RISK: { label: 'Moderate Risk', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  HIGH_RISK: { label: 'High Risk', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
  UNKNOWN: { label: 'Unknown', class: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

export default function TopBar({ connected, riskLevel }) {
  const badge = RISK_BADGE[riskLevel] || RISK_BADGE.UNKNOWN

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass border-b border-white/5 px-6 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Activity className="w-6 h-6 text-calm" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-calm rounded-full animate-pulse" />
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">Psychology Assistant</h1>
        <span className="hidden sm:inline text-xs text-gray-500 font-medium uppercase tracking-wider">
          Wellness Monitor
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.class}`}>
          {badge.label}
        </span>

        <span className="flex items-center gap-1.5 text-xs">
          {connected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400/80">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400/80">Offline</span>
            </>
          )}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <User className="w-3.5 h-3.5" />
          user_001
        </span>
      </div>
    </motion.header>
  )
}
