import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'
import { motion } from 'framer-motion'

const STATE_COLORS = { CALM: '#06D6A0', STRESS: '#F97316', ANXIETY: '#EF4444', FATIGUE: '#818CF8' }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/90 backdrop-blur-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-0.5">{payload[0].payload?.state}</p>
      <p className="text-white font-semibold">{payload[0].value} occurrences</p>
    </div>
  )
}

export default function StateHistoryChart({ predictions }) {
  const chartData = useMemo(() => {
    if (!predictions?.length) return []
    const counts = {}
    predictions.forEach((p) => { counts[p.predicted_state] = (counts[p.predicted_state] || 0) + 1 })
    return Object.entries(counts).map(([state, count]) => ({ state, count, fill: STATE_COLORS[state] || '#64748b' }))
  }, [predictions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-xl"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Emotional State History</p>
      {chartData.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center">
          <p className="text-sm text-slate-500">No predictions yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="state" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={48}>
              {chartData.map((entry, idx) => (
                <rect key={idx} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
