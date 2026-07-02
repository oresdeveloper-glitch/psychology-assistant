import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

const STATE_CONFIG = {
  CALM: { color: '#06D6A0', glow: 'glow-calm', iconBg: 'bg-calm/10', label: 'Calm' },
  STRESS: { color: '#F97316', glow: 'glow-stress', iconBg: 'bg-stress/10', label: 'Stress' },
  ANXIETY: { color: '#EF4444', glow: 'glow-highrisk', iconBg: 'bg-highrisk/10', label: 'Anxiety' },
  FATIGUE: { color: '#818CF8', glow: 'glow-fatigue', iconBg: 'bg-fatigue/10', label: 'Fatigue' },
  UNKNOWN: { color: '#64748b', glow: '', iconBg: 'bg-white/5', label: 'Unknown' },
}

const RISK_CONFIG = {
  LOW_RISK: { label: 'Low Risk', class: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  MODERATE_RISK: { label: 'Moderate', class: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  HIGH_RISK: { label: 'High Risk', class: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  UNKNOWN: { label: 'Unknown', class: 'bg-white/5 text-slate-400 border border-white/10' },
}

export default function MainStatusPanel({ prediction }) {
  if (!prediction) return null

  const state = prediction.predicted_state || 'UNKNOWN'
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.UNKNOWN
  const risk = prediction.depression_risk || 'UNKNOWN'
  const rcfg = RISK_CONFIG[risk] || RISK_CONFIG.UNKNOWN

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl ${cfg.glow} relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.04] rounded-full" style={{ background: `radial-gradient(circle, ${cfg.color}, transparent)` }} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <div className={`p-2 rounded-lg ${cfg.iconBg}`}>
            <Brain className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Emotional State
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-5xl font-extrabold tracking-tight mb-1" style={{ color: cfg.color }}>
              {cfg.label}
            </div>
            <span className="text-sm text-slate-500 font-medium">Current classification</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {(prediction.confidence * 100).toFixed(0)}<span className="text-sm text-slate-500">%</span>
              </div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Confidence</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rcfg.class}`}>
                {rcfg.label}
              </span>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1.5">Depression Risk</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
