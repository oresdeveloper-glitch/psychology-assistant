import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Activity, HeartPulse, Thermometer, Wifi, Brain, ShieldAlert, Clock, AlertTriangle } from 'lucide-react'
import SensorCard from './SensorCard'
import EmotionalStatePanel from './EmotionalStatePanel'
import TrendChart from './TrendChart'
import Esp32Lcd from './Esp32Lcd'
import MicrophonePanel from './MicrophonePanel'
import { getMqttLatest, getMqttHistory } from '../services/api'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function Dashboard() {
  const [connected, setConnected] = useState(false)
  const [brokerOk, setBrokerOk] = useState(false)
  const [waiting, setWaiting] = useState(true)
  const [stale, setStale] = useState(false)
  const [sensorValues, setSensorValues] = useState({
    heartRate: '---', temperature: '---', sleepScore: '---',
    stressScore: '---', currentStatus: '---', depressionRisk: '---',
  })
  const [trendBuffer, setTrendBuffer] = useState([])
  const [lastUpdate, setLastUpdate] = useState('--')
  const [receivedAt, setReceivedAt] = useState(null)
  const evtRef = useRef(null)

  const updateFromData = useCallback((data) => {
    setConnected(true)
    setWaiting(false)
    setStale(data._stale === true)
    setReceivedAt(prev => data._received_at ? data._received_at : prev)
    setSensorValues(prev => {
      const next = {
        heartRate: data.heartRate ?? '---',
        temperature: data.temperature ?? '---',
        sleepScore: data.sleepScore ?? '---',
        stressScore: data.stressScore ?? '---',
        currentStatus: data.currentStatus ?? '---',
        depressionRisk: data.depressionRisk ?? '---',
      }
      const same = prev.heartRate === next.heartRate && prev.temperature === next.temperature && prev.sleepScore === next.sleepScore && prev.stressScore === next.stressScore && prev.currentStatus === next.currentStatus && prev.depressionRisk === next.depressionRisk
      if (!same) {
        setLastUpdate(new Date().toLocaleTimeString())
      }
      return same ? prev : next
    })
  }, [])

  useEffect(() => {
    getMqttLatest().then(latest => {
      const brokerConnected = latest?._broker_connected === true
      setBrokerOk(brokerConnected)
      if (!latest?._no_data && latest?.heartRate !== undefined) {
        updateFromData(latest)
      } else {
        setWaiting(brokerConnected)
      }
    }).catch(() => setWaiting(false))

    const es = new EventSource(`${API_BASE}/mqtt/stream`)
    es.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data)
        if (d && !d._no_data && d.heartRate !== undefined) {
          updateFromData(d)
        }
      } catch {}
    }
    es.onerror = () => {}
    evtRef.current = es

    const histInterval = setInterval(async () => {
      try {
        const h = await getMqttHistory()
        setTrendBuffer(prev => {
          const next = (h || []).map(d => ({
            time: new Date(d._received_at).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            }),
            score: d.stressScore ?? 0,
          }))
          return JSON.stringify(prev) === JSON.stringify(next) ? prev : next
        })
      } catch {}
    }, 5000)

    return () => {
      es.close()
      clearInterval(histInterval)
    }
  }, [updateFromData])

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
    <main className="min-h-screen text-white font-sans px-4 sm:px-6 py-4 sm:py-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-5">

        {/* Premium Header */}
        <motion.header variants={item} className="premium-glass rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center border border-emerald-400/20">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${connected ? 'bg-emerald-400' : waiting ? 'bg-amber-400' : 'bg-red-400'} ring-2 ring-[#0B1121]`} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Live Dashboard</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Real-time sensor data from ESP32 over MQTT</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
            connected
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              : waiting
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                : 'bg-red-500/10 border-red-500/25 text-red-300'
          }`}>
            <span className="relative flex h-2 w-2">
              {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
              {waiting && <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-400' : waiting ? 'bg-amber-400' : 'bg-red-400'}`} />
            </span>
            <Wifi size={13} />
            <span>{connected ? 'Live' : waiting ? 'Waiting...' : 'Disconnected'}</span>
          </div>
        </motion.header>

        {waiting ? (
          <motion.div variants={item} className="premium-glass rounded-2xl p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
              <Wifi size={32} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-amber-200">Waiting for Sensor Data</h2>
            <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto leading-relaxed">
              Backend MQTT client is connected to broker. Run your Wokwi simulation to start receiving live ESP32 sensor data.
            </p>
          </motion.div>
        ) : (
          <>

            {/* Sensor Cards */}
            <motion.section variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SensorCard title="Heart Rate" value={sensorValues.heartRate} suffix="bpm" icon={HeartPulse} accent="#F43F5E" gradient="from-rose-500/10 to-transparent" />
              <SensorCard title="Temperature" value={sensorValues.temperature} suffix="°C" icon={Thermometer} accent="#2DD4BF" gradient="from-emerald-500/10 to-transparent" />
              <SensorCard title="Sleep Score" value={sensorValues.sleepScore} suffix="%" icon={Activity} accent="#6366F1" gradient="from-indigo-500/10 to-transparent" />
              <SensorCard
                title="Stress Score"
                value={sensorValues.stressScore === '---' ? '---' : Number(sensorValues.stressScore)}
                suffix="/100"
                icon={AlertTriangle}
                accent="#F97316"
                gradient="from-orange-500/10 to-transparent"
                valueClass={stressColor}
              />
            </motion.section>

            {/* Microphone Voice Analysis */}
            <MicrophonePanel />

            {/* Emotional State + Trend + LCD */}
            <motion.section variants={item} className="grid grid-cols-1 lg:grid-cols-4 gap-5">
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
              <div className="lg:col-span-1">
                <Esp32Lcd sensor={{
                  temperature: sensorValues.temperature === '---' ? undefined : Number(sensorValues.temperature),
                  heart_rate: sensorValues.heartRate === '---' ? undefined : Number(sensorValues.heartRate),
                  sleep_score: sensorValues.sleepScore === '---' ? undefined : Number(sensorValues.sleepScore),
                  stress_score: sensorValues.stressScore === '---' ? undefined : Number(sensorValues.stressScore),
                  currentStatus: sensorValues.currentStatus,
                  depressionRisk: sensorValues.depressionRisk,
                  _received_at: receivedAt,
                  _broker_connected: brokerOk,
                  _stale: stale,
                }} />
              </div>
            </motion.section>

            {/* Live Status Bar - Premium */}
            <motion.section variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="premium-glass rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center border border-emerald-500/15">
                  <Brain className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className={`text-lg font-bold ${statusColor}`}>
                    {sensorValues.currentStatus}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Current Emotional State</div>
                </div>
              </div>
              <div className="premium-glass rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  sensorValues.depressionRisk === 'HIGH RISK'
                    ? 'bg-red-500/15 border-red-500/25'
                    : 'bg-emerald-500/15 border-emerald-500/15'
                }`}>
                  <ShieldAlert className={`w-5 h-5 ${sensorValues.depressionRisk === 'HIGH RISK' ? 'text-red-400' : 'text-emerald-400'}`} />
                </div>
                <div>
                  <div className={`text-lg font-bold ${sensorValues.depressionRisk === 'HIGH RISK' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {sensorValues.depressionRisk}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Depression Risk</div>
                </div>
              </div>
            </motion.section>
          </>
        )}

        {/* Last Update */}
        <motion.div variants={item} className="flex items-center justify-center gap-2 text-xs text-slate-600">
          <Clock className="w-3 h-3" />
          <span>{waiting ? 'Waiting for Wokwi simulation to publish MQTT data...' : stale ? 'Data stale — no new MQTT messages received' : `Last update: ${lastUpdate}`}</span>
        </motion.div>

        {/* Disclaimer */}
        <motion.footer variants={item} className="premium-glass-light rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-200/70">
          <ShieldAlert size={18} className="text-amber-400/70 mt-0.5 shrink-0" />
          <p className="leading-relaxed">This dashboard provides wellness screening and emotional-state indicators only. It is not a medical diagnosis tool or a replacement for professional mental-health care.</p>
        </motion.footer>
      </motion.div>
    </main>
  )
}
