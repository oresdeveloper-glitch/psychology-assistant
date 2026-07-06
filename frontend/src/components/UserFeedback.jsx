import { useState } from 'react'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

export default function UserFeedback({ predictedState }) {
  const [submitted, setSubmitted] = useState(null)

  if (!predictedState || predictedState === 'UNKNOWN') return null
  if (submitted) return null

  const handleFeedback = (value) => {
    setSubmitted(value)
    console.log('User feedback:', predictedState, value)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-glass rounded-2xl p-5 flex items-center justify-between"
    >
      <div>
        <p className="text-sm text-slate-300 font-medium">
          System says: <span className="font-bold" style={{
            color: predictedState === 'CALM' ? '#06D6A0' :
                   predictedState === 'STRESS' ? '#F97316' :
                   predictedState === 'FATIGUE' ? '#818CF8' : '#EF4444'
          }}>{predictedState}</span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Is this accurate?</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleFeedback(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-400 hover:text-emerald-400 text-xs font-semibold transition-colors"
        >
          <ThumbsUp className="w-3.5 h-3.5" /> Yes
        </button>
        <button
          onClick={() => handleFeedback(false)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors"
        >
          <ThumbsDown className="w-3.5 h-3.5" /> No
        </button>
      </div>
    </motion.div>
  )
}
