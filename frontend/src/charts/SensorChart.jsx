import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useMemo } from 'react'
import { motion } from 'framer-motion'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/90 backdrop-blur-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="text-white font-semibold">{payload[0].value?.toFixed(1)}</p>
    </div>
  )
}

export default function SensorChart({ data, dataKey, label, color = '#06D6A0', delay = 0, timeKey = 'timestamp' }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    const sorted = [...data].sort((a, b) => new Date(a[timeKey] || a.timestamp) - new Date(b[timeKey] || b.timestamp))
    return sorted.map((d) => ({
      time: new Date(d[timeKey] || d.timestamp).toLocaleTimeString(),
      value: d[dataKey],
    }))
  }, [data, dataKey, timeKey])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-xl"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">{label}</p>
      {chartData.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center">
          <p className="text-sm text-slate-500">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={35} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} dot={false} activeDot={{ r: 3, fill: color, stroke: '#0F172A', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
