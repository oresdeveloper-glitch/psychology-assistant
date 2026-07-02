import { motion, useSpring, useTransform } from "framer-motion";

export default function SensorCard({ title, value, suffix, icon: Icon, accent, valueClass }) {
  const isLive = typeof value === 'number'
  const spring = useSpring(isLive ? value : 0, { stiffness: 80, damping: 18 })
  const display = useTransform(spring, (latest) =>
    isLive ? (Number.isInteger(value) ? Math.round(latest) : latest.toFixed(1)) : '---'
  )

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          <Icon size={23} />
        </div>
        <span className="text-xs text-slate-400 uppercase tracking-wider">Live</span>
      </div>
      <p className="mt-5 text-sm text-slate-300">{title}</p>
      <div className="mt-1 flex items-end gap-2">
        <motion.span className={`text-4xl font-bold ${valueClass ?? ''}`}>{display}</motion.span>
        <span className="text-slate-400 mb-1">{suffix}</span>
      </div>
    </motion.div>
  )
}
