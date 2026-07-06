import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Activity, Thermometer, Heart, Moon, Clock, Wifi } from 'lucide-react'
import StatusCards from '../components/StatusCards'
import SensorChart from '../charts/SensorChart'
import { getSensorHistory, getMqttLatest, healthCheck } from '../services/api'

const USER_ID = 'user_001'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }

export default function SensorsPage() {
  const [connected, setConnected] = useState(false)
  const [sensorHistory, setSensorHistory] = useState([])
  const [latestSensor, setLatestSensor] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      await healthCheck()
      setConnected(true)
      const [data, latest] = await Promise.all([
        getSensorHistory(USER_ID, 100),
        getMqttLatest(),
      ])

      const liveSensor = latest && latest.temperature !== undefined
        ? {
            temperature: latest.temperature,
            heart_rate: latest.heartRate,
            activity_score: latest.activityScore ?? latest.activity_score ?? 0,
            sleep_score: latest.sleepScore ?? latest.sleep_score ?? 0,
            timestamp: latest._received_at || new Date().toISOString(),
          }
        : null

      if (liveSensor) {
        setLatestSensor(liveSensor)
        setSensorHistory(data.length > 0 ? data : [liveSensor])
      } else if (data.length > 0) {
        setSensorHistory(data)
        setLatestSensor(data[0])
      } else {
        setSensorHistory([])
        setLatestSensor(null)
      }
    } catch {
      setConnected(false)
    }
  }, [])

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i) }, [fetchData])

  const lastUpdate = latestSensor?.timestamp ? new Date(latestSensor.timestamp).toLocaleTimeString() : '--'

  return (
    <main className="min-h-screen text-white font-sans px-4 sm:px-6 py-4 sm:py-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-5">
        <motion.div variants={item} className="premium-glass rounded-2xl p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Sensor Data</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Live readings from ESP32</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">Last: {lastUpdate}</span>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          </div>
        </motion.div>

        <motion.div variants={item}>
          <StatusCards sensor={latestSensor} />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SensorChart data={sensorHistory} dataKey="heart_rate" label="Heart Rate (bpm)" color="#EF4444" />
          <SensorChart data={sensorHistory} dataKey="temperature" label="Temperature (°C)" color="#F97316" />
          <SensorChart data={sensorHistory} dataKey="activity_score" label="Activity Score" color="#06D6A0" />
          <SensorChart data={sensorHistory} dataKey="sleep_score" label="Sleep Score" color="#818CF8" />
        </motion.div>

        {latestSensor && (
          <motion.div variants={item} className="premium-glass rounded-2xl p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Latest Reading</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Heart Rate', value: `${latestSensor.heart_rate?.toFixed(0)} bpm`, icon: Heart, color: '#EF4444' },
                { label: 'Temperature', value: `${latestSensor.temperature?.toFixed(1)}°C`, icon: Thermometer, color: '#F97316' },
                { label: 'Activity', value: `${latestSensor.activity_score?.toFixed(0)}%`, icon: Activity, color: '#06D6A0' },
                { label: 'Sleep', value: `${latestSensor.sleep_score?.toFixed(0)}%`, icon: Moon, color: '#818CF8' },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/[0.06]">
                      <Icon className="w-5 h-5" style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{s.label}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{s.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </main>
  )
}
