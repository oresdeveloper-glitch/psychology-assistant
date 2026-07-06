import { Lightbulb, AlertTriangle, Heart } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Recommendations({ prediction }) {
  if (!prediction) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">Recommendation</h3>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-3">
        <Heart className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-sm text-slate-400 leading-relaxed">{prediction.recommendation}</p>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
        <p className="text-xs text-red-300/80 leading-relaxed">
          {prediction.medical_warning}
        </p>
      </div>
    </motion.div>
  )
}
