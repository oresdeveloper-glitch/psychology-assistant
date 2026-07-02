import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Activity, HeartPulse, Thermometer, Wifi, Brain, ShieldAlert, Clock, AlertTriangle } from 'lucide-react'
import SensorCard from './SensorCard'
import EmotionalStatePanel from './EmotionalStatePanel'
import TrendChart from './TrendChart'
import { getMqttLatest, getMqttHistory } from '../services/api'

const POLL_INTERVAL = 2500

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }

export default function Dashboard() {
  const [connected, setConnected] = useState(false)
  const [brokerOk, setBrokerOk] = useState(false)
  const [waiting, setWaiting] = useState(true)
  const [sensorValues, setSensorValues] = useState({
    heartRate: '---', temperature: '---', sleepScore: '---',
    stressScore: '---', currentStatus: '---', depressionRisk: '---',
  })
  const [trendBuffer, setTrendBuffer] = useState([])
  const [lastUpdate, setLastUpdate] = useState('--')
  const loading = useRef(false)

  useEffect(() => {
    const poll = async () => {
      if (loading.current) return
      loading.current = true
      try {
        const [latest, hist] = await Promise.all([
          getMqttLatest(),
          getMqttHistory(),
        ])
        const brokerConnected = latest?._broker_connected === true
        setBrokerOk(brokerConnected)
        if (latest?._no_data) {
          setConnected(false)
          setWaiting(brokerConnected)
        } else if (latest && latest.heartRate !== undefined) {
          setConnected(true)
          setWaiting(false)
          setLastUpdate(new Date().toLocaleTimeString())
          setSensorValues({
            heartRate: latest.heartRate ?? '---',
            temperature: latest.temperature ?? '---',
            sleepScore: latest.sleepScore ?? '---',
            stressScore: latest.stressScore ?? '---',
            currentStatus: latest.currentStatus ?? '---',
            depressionRisk: latest.depressionRisk ?? '---',
          })
          setTrendBuffer(
            (hist || []).map((d) => ({
              time: new Date(d._received_at).toLocaleTimeString([], {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              }),
              score: d.stressScore ?? 0,
            }))
          )
        } else {
          setConnected(false)
          setWaiting(false)
        }
      } catch {
        setConnected(false)
        setWaiting(false)
      }
      loading.current = false
    }
    poll()
    const i = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(i)
  }, [])

  const stressColor =
    sensorValues.stressScore === '---' ? 'text-slate-400' :
    sensorValues.stressScore < 40 ? 'text-emerald-400' :
    sensorValues.stressScore < 70 ? 'text-amber-400' : 'text-red-400'

  const statusColor =
    sensorValues.currentStatus === 'NORMAL/CALM' ? 'text-emerald-400' :
    sensorValues.currentStatus === 'MODERATE' ? 'text-amber-400' :
    sensorValues.currentStatus === 'STRESS' ? 'text-red-400' :
    'text-slate-400'

  return (
    <main className="min-h-screen text-white font-sans px-6 py-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.header variants={item} className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Live Dashboard</h1>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : waiting ? 'bg-amber-400' : 'bg-red-400'}`} />
            </div>
            <p className="text-sm text-slate-400">Real-time sensor data from ESP32 over MQTT</p>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 border ${connected ? 'bg-teal-400/10 border-teal-400/30 text-teal-300' : waiting ? 'bg-amber-400/10 border-amber-400/30 text-amber-300' : 'bg-red-400/10 border-red-400/30 text-red-300'}`}>
            <span className="relative flex h-2 w-2">
              {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />}
              {waiting && <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-teal-400' : waiting ? 'bg-amber-400' : 'bg-red-400'}`} />
            </span>
            <Wifi size={14} />
            <span className="text-xs font-semibold">{connected ? 'Live' : waiting ? 'Waiting...' : 'Disconnected'}</span>
          </div>
        </motion.header>

        {waiting ? (
          <motion.div variants={item} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 backdrop-blur-xl p-10 shadow-xl text-center">
            <Wifi size={48} className="text-amber-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-200">Waiting for Sensor Data</h2>
            <p className="text-sm text-slate-400 mt-3 max-w-md mx-auto">
              Backend MQTT client is connected to broker. Run your Wokwi simulation to start receiving live ESP32 sensor data.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Sensor Cards */}
            <motion.section variants={item} layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SensorCard title="Heart Rate" value={sensorValues.heartRate} suffix="bpm" icon={HeartPulse} accent="#F43F5E" />
              <SensorCard title="Temperature" value={sensorValues.temperature} suffix="°C" icon={Thermometer} accent="#2DD4BF" />
              <SensorCard title="Sleep Score" value={sensorValues.sleepScore} suffix="%" icon={Activity} accent="#6366F1" />
              <SensorCard
                title="Stress Score"
                value={sensorValues.stressScore === '---' ? '---' : Number(sensorValues.stressScore)}
                suffix="/100"
                icon={AlertTriangle}
                accent="#F97316"
                valueClass={stressColor}
              />
            </motion.section>

            {/* Emotional State + Trend */}
            <motion.section variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1">
                <EmotionalStatePanel
                  icon={Brain}
                  state={sensorValues.currentStatus}
                  confidence={
                    sensorValues.stressScore === '---' ? 0 :
                    sensorValues.stressScore < 40 ? 90 :
                    sensorValues.stressScore < 70 ? 70 : 85
                  }
                  risk={sensorValues.depressionRisk}
                />
              </div>
              <div className="lg:col-span-2">
                <TrendChart data={trendBuffer} />
              </div>
            </motion.section>

            {/* Live Status Bar */}
            <motion.section variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4 shadow-xl flex items-center gap-4">
                <div className={`text-2xl font-bold ${statusColor}`}>
                  {sensorValues.currentStatus}
                </div>
                <div className="text-xs text-slate-400">Current State</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4 shadow-xl flex items-center gap-4">
                <div className={`text-2xl font-bold ${sensorValues.depressionRisk === 'HIGH RISK' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {sensorValues.depressionRisk}
                </div>
                <div className="text-xs text-slate-400">Depression Risk</div>
              </div>
            </motion.section>
          </>
        )}

        {/* Last Update */}
        <motion.div variants={item} className="flex items-center justify-center gap-2 text-xs text-slate-600">
          <Clock className="w-3 h-3" />
          <span>{waiting ? 'Waiting for Wokwi simulation to publish MQTT data...' : `Last update: ${lastUpdate} — Polling backend every 2.5s`}</span>
        </motion.div>

        {/* Disclaimer */}
        <motion.footer variants={item} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 backdrop-blur-xl p-4 flex items-start gap-3 text-sm text-amber-100">
          <ShieldAlert size={20} className="text-amber-300 mt-0.5 shrink-0" />
          <p>This dashboard provides wellness screening and emotional-state indicators only. It is not a medical diagnosis tool or a replacement for professional mental-health care.</p>
        </motion.footer>
      </motion.div>
    </main>
  )
}
