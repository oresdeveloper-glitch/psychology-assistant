import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const stateColors = {
  CALM: "#2DD4BF",
  STRESS: "#F97316",
  FATIGUE: "#818CF8",
  HIGH_RISK: "#EF4444",
};

const riskColors = {
  'HIGH RISK': { border: 'border-red-400/20', bg: 'bg-red-400/10', text: 'text-red-300' },
  'LOW RISK': { border: 'border-emerald-400/20', bg: 'bg-emerald-400/10', text: 'text-emerald-300' },
};

function normalizeState(state) {
  const s = (state || '').toUpperCase()
  if (s.includes('NORMAL') || s.includes('CALM')) return 'CALM'
  if (s.includes('STRESS')) return 'STRESS'
  if (s.includes('MODERATE')) return 'STRESS'
  if (s.includes('FATIGUE')) return 'FATIGUE'
  return state
}

export default function EmotionalStatePanel({
  icon: Icon,
  state,
  confidence,
  risk,
}) {
  const normalized = normalizeState(state)
  const accent = stateColors[normalized] || "#2DD4BF"
  const riskStyle = riskColors[risk] || riskColors['LOW RISK']

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl h-full"
    >
      <motion.div
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: accent }}
      />

      <div className="relative z-10">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          <Icon size={26} />
        </div>

        <p className="mt-6 text-sm text-slate-300">Current Emotional State</p>

        <h2 className="mt-1 text-4xl font-extrabold" style={{ color: accent }}>
          {state}
        </h2>

        <div className="mt-5">
          <div className="flex justify-between text-sm text-slate-300">
            <span>Confidence</span>
            <span>{confidence}%</span>
          </div>

          <div className="mt-2 h-3 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full"
              style={{ backgroundColor: accent }}
            />
          </div>
        </div>

        <div className={`mt-5 rounded-xl border ${riskStyle.border} ${riskStyle.bg} p-3 flex gap-3`}>
          <AlertTriangle size={20} className={riskStyle.text} />
          <div>
            <p className={`text-sm font-semibold ${riskStyle.text}`}>
              Depression Risk: {risk}
            </p>
            <p className="text-xs text-slate-300">
              Continue monitoring trends over time.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
