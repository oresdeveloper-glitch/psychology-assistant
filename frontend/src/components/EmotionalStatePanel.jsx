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
      className="premium-glass rounded-2xl p-6 relative overflow-hidden h-full group"
    >
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl"
        style={{ backgroundColor: accent }}
      />

      <div className="relative z-10">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center border"
          style={{ backgroundColor: `${accent}15`, borderColor: `${accent}25`, color: accent }}
        >
          <Icon size={24} />
        </div>

        <p className="mt-6 text-xs text-slate-500 font-medium uppercase tracking-wider">Current State</p>

        <h2 className="mt-1.5 text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: accent }}>
          {state}
        </h2>

        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Confidence</span>
            <span className="font-semibold">{confidence}%</span>
          </div>

          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}60` }}
            />
          </div>
        </div>

        <div className={`mt-5 rounded-xl border ${riskStyle.border} ${riskStyle.bg} p-3.5 flex gap-3 items-start`}>
          <AlertTriangle size={18} className={`${riskStyle.text} mt-0.5 shrink-0`} />
          <div>
            <p className={`text-sm font-semibold ${riskStyle.text}`}>
              Depression Risk: {risk}
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Continue monitoring trends over time.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
