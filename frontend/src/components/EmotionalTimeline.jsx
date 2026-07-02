import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Clock } from 'lucide-react'

const STATE_CONFIG = {
  CALM: { color: '#06D6A0', bg: 'bg-calm/10', dot: 'bg-calm' },
  STRESS: { color: '#F97316', bg: 'bg-stress/10', dot: 'bg-stress' },
  ANXIETY: { color: '#EF4444', bg: 'bg-highrisk/10', dot: 'bg-highrisk' },
  FATIGUE: { color: '#818CF8', bg: 'bg-fatigue/10', dot: 'bg-fatigue' },
}

export default function EmotionalTimeline({ predictions }) {
  const timeline = useMemo(() => {
    if (!predictions?.length) return []
    return [...predictions]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8)
      .reverse()
  }, [predictions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-4 h-4 text-slate-500" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Emotional Journey
        </h3>
      </div>

      {timeline.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No history available</p>
      ) : (
        <div className="relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
          <div className="space-y-4">
            {timeline.map((p, i) => {
              const cfg = STATE_CONFIG[p.predicted_state] || STATE_CONFIG.CALM
              const dotBg = cfg.dot
              const time = new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              return (
                <motion.div
                  key={p.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-[15px] h-[15px] rounded-full ${dotBg} ring-2 ring-slate-900 shrink-0 relative z-10`} />
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold`} style={{ color: cfg.color }}>
                        {p.predicted_state}
                      </span>
                      <span className="text-xs text-slate-500">{(p.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{time}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}
