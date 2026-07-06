import { Heart, Thermometer, Gauge } from 'lucide-react'
import { motion } from 'framer-motion'

const cards = [
  {
    label: 'Heart Rate',
    key: 'heart_rate',
    icon: Heart,
    unit: 'bpm',
    color: '#EF4444',
    gradient: 'from-red-500/10 to-transparent',
  },
  {
    label: 'Temperature',
    key: 'temperature',
    icon: Thermometer,
    unit: '\u00b0C',
    color: '#F97316',
    gradient: 'from-orange-500/10 to-transparent',
  },
  {
    label: 'Activity / Sleep',
    key: 'activity_score',
    icon: Gauge,
    unit: '%',
    color: '#06D6A0',
    gradient: 'from-emerald-500/10 to-transparent',
    secondary: { key: 'sleep_score', label: 'Sleep', unit: '%' },
  },
]

export default function StatusCards({ sensor }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon
        const val = sensor?.[c.key]
        const sec = c.secondary ? sensor?.[c.secondary.key] : null

        return (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="premium-glass rounded-2xl p-5 relative overflow-hidden group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-30`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {c.label}
                </span>
                <Icon className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold" style={{ color: val != null ? c.color : '#64748b' }}>
                  {val != null ? val.toFixed(0) : '---'}
                </span>
                <span className="text-sm text-slate-500 font-medium">{c.unit}</span>
              </div>
              {sec != null && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                  <span className="text-xs text-slate-500">{c.secondary.label}</span>
                  <span className="text-sm font-semibold text-slate-300">{sec.toFixed(0)}<span className="text-xs text-slate-500">%</span></span>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
