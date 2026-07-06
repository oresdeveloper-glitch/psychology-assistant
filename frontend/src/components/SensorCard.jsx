import { motion } from "framer-motion";

export default function SensorCard({ title, value, suffix, icon: Icon, accent, gradient, valueClass }) {
  const isLive = typeof value === 'number'
  const display = isLive ? (Number.isInteger(value) ? value : value.toFixed(1)) : '---'

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="premium-glass rounded-2xl p-5 sm:p-6 relative overflow-hidden group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient || 'from-white/5 to-transparent'} opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center border"
            style={{ backgroundColor: `${accent}15`, borderColor: `${accent}25`, color: accent }}
          >
            <Icon size={22} />
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
            Live
          </span>
        </div>
        <p className="mt-5 text-xs sm:text-sm text-slate-400 font-medium">{title}</p>
        <div className="mt-1 flex items-end gap-2">
          <span className={`text-3xl sm:text-4xl font-bold tabular-nums tracking-tight ${valueClass ?? ''}`}>{display}</span>
          <span className="text-slate-500 mb-1 text-sm">{suffix}</span>
        </div>
      </div>
    </motion.div>
  )
}
