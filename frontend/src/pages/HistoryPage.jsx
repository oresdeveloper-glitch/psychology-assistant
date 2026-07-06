import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, Thermometer, HeartPulse, Moon, Activity, History as HistoryIcon } from 'lucide-react'
import SensorChart from '../charts/SensorChart'
import { getMqttHistory, healthCheck } from '../services/api'

const STATUS_COLORS = {
  'NORMAL/CALM': '#2DD4BF',
  MODERATE: '#F97316',
  STRESS: '#EF4444',
  'HIGH RISK': '#EF4444',
  'LOW RISK': '#2DD4BF',
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }

export default function HistoryPage() {
  const [readings, setReadings] = useState([])
  const [expanded, setExpanded] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      await healthCheck()
      const data = await getMqttHistory()
      setReadings(Array.isArray(data) ? data.filter((r) => !r._no_data) : [])
    } catch {}
  }, [])

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i) }, [fetchData])

  return (
    <main className="min-h-screen text-white font-sans px-4 sm:px-6 py-4 sm:py-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <motion.div variants={item} className="premium-glass rounded-2xl p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">History</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Live sensor readings ({readings.length})</p>
            </div>
          </div>
          <Clock className="w-5 h-5 text-slate-500" />
        </motion.div>

        {/* Latest Snapshot */}
        {readings.length > 0 && (() => {
          const last = readings[readings.length - 1]
          return (
            <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="premium-glass rounded-2xl p-4 text-center">
                <Thermometer className="w-5 h-5 mx-auto mb-2 text-rose-400" />
                <p className="text-xs text-slate-500">Temperature</p>
                <p className="text-lg font-bold text-white mt-1">{last.temperature?.toFixed(1)}&deg;C</p>
              </div>
              <div className="premium-glass rounded-2xl p-4 text-center">
                <HeartPulse className="w-5 h-5 mx-auto mb-2 text-red-400" />
                <p className="text-xs text-slate-500">Heart Rate</p>
                <p className="text-lg font-bold text-white mt-1">{last.heartRate} bpm</p>
              </div>
              <div className="premium-glass rounded-2xl p-4 text-center">
                <Moon className="w-5 h-5 mx-auto mb-2 text-indigo-400" />
                <p className="text-xs text-slate-500">Sleep Score</p>
                <p className="text-lg font-bold text-white mt-1">{last.sleepScore}%</p>
              </div>
              <div className="premium-glass rounded-2xl p-4 text-center">
                <Activity className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                <p className="text-xs text-slate-500">Stress Score</p>
                <p className="text-lg font-bold mt-1" style={{ color: STATUS_COLORS[last.currentStatus] || '#94a3b8' }}>{last.stressScore}</p>
              </div>
            </motion.div>
          )
        })()}

        {/* Trend Charts */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SensorChart data={readings} dataKey="temperature" label="Temperature Trend" color="#F43F5E" delay={0.1} timeKey="_received_at" />
          <SensorChart data={readings} dataKey="heartRate" label="Heart Rate Trend" color="#EF4444" delay={0.15} timeKey="_received_at" />
          <SensorChart data={readings} dataKey="sleepScore" label="Sleep Score Trend" color="#818CF8" delay={0.2} timeKey="_received_at" />
          <SensorChart data={readings} dataKey="stressScore" label="Stress Score Trend" color="#F97316" delay={0.25} timeKey="_received_at" />
        </motion.div>

        {/* Full History List */}
        <motion.div variants={item} className="premium-glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">All Readings</h3>
          </div>

          {readings.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No sensor readings yet. Ensure your ESP32 is sending data.</p>
          ) : (
            <div className="space-y-1">
              {[...readings].reverse().map((r, i) => {
                const statusColor = STATUS_COLORS[r.currentStatus] || '#64748b'
                const time = new Date(r._received_at || Date.now()).toLocaleString()
                const id = r._received_at || i
                const isExpanded = expanded === id
                return (
                  <div key={id}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : id)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.06]"
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}60` }} />
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <span className="text-xs font-semibold" style={{ color: statusColor }}>{r.currentStatus || 'N/A'}</span>
                        <span className="text-xs text-slate-500">{r.heartRate}bpm</span>
                        <span className="text-xs text-slate-500">{r.temperature?.toFixed(1)}&deg;C</span>
                        <span className="text-xs text-slate-500">sleep {r.sleepScore}%</span>
                        <span className="text-xs text-slate-500">stress {r.stressScore}</span>
                      </div>
                      <span className="text-xs text-slate-600 font-mono shrink-0">{new Date(r._received_at || Date.now()).toLocaleDateString()}</span>
                    </button>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-12 pb-3">
                        <div className="premium-glass-light rounded-xl p-4 text-sm space-y-2">
                          <p className="text-slate-500">Time: <span className="text-white font-medium">{time}</span></p>
                          <p className="text-slate-500">Temperature: <span className="text-white font-medium">{r.temperature?.toFixed(1)}&deg;C</span></p>
                          <p className="text-slate-500">Heart Rate: <span className="text-white font-medium">{r.heartRate} bpm</span></p>
                          <p className="text-slate-500">Sleep Score: <span className="text-white font-medium">{r.sleepScore}%</span></p>
                          <p className="text-slate-500">Stress Score: <span className="text-white font-medium">{r.stressScore}</span></p>
                          <p className="text-slate-500">Status: <span className="font-medium" style={{ color: statusColor }}>{r.currentStatus}</span></p>
                          <p className="text-slate-500">Depression Risk: <span className="font-medium" style={{ color: STATUS_COLORS[r.depressionRisk] || '#94a3b8' }}>{r.depressionRisk}</span></p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

      </motion.div>
    </main>
  )
}
