import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import StatusCards from '../components/StatusCards'
import Esp32Lcd from '../components/Esp32Lcd'
import MainStatusPanel from '../components/MainStatusPanel'
import Recommendations from '../components/Recommendations'
import SensorChart from '../charts/SensorChart'
import UserFeedback from '../components/UserFeedback'
import { getLiveRecommendations, getMqttLatest, healthCheck } from '../services/api'

const POLL_INTERVAL = 3000

export default function DashboardPage({ onConnectionChange }) {
  const [recommendation, setRecommendation] = useState(null)
  const [sensorHistory, setSensorHistory] = useState([])
  const [latestSensor, setLatestSensor] = useState(null)
  const [connected, setConnected] = useState(false)
  const historyRef = useRef([])

  const processSensorData = useCallback((data) => {
    if (!data || data.temperature === undefined || data._no_data) return
    const live = {
      temperature: data.temperature,
      heart_rate: data.heartRate ?? 0,
      sleep_score: data.sleepScore ?? 0,
      stress_score: data.stressScore ?? 0,
      currentStatus: data.currentStatus ?? 'UNKNOWN',
      depressionRisk: data.depressionRisk ?? 'UNKNOWN',
      _received_at: data._received_at,
      _broker_connected: data._broker_connected,
      timestamp: data._received_at || new Date().toISOString(),
    }
    setLatestSensor(live)
    historyRef.current = [...historyRef.current.slice(-29), live]
    setSensorHistory([...historyRef.current])
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const [recData, mqttLatest] = await Promise.all([
        getLiveRecommendations(),
        getMqttLatest(),
      ])
      setConnected(true)
      onConnectionChange?.(true)
      setRecommendation(recData)
      processSensorData(mqttLatest)
    } catch {
      setConnected(false)
      onConnectionChange?.(false)
    }
  }, [onConnectionChange, processSensorData])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchAll])

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {connected ? 'Live monitoring active' : 'Disconnected'}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="text-xs px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white font-medium transition-colors border border-white/10"
        >
          Refresh
        </button>
      </motion.div>

      <StatusCards sensor={latestSensor} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <MainStatusPanel prediction={recommendation} />
        </div>
        <div>
          <Esp32Lcd sensor={latestSensor} />
        </div>
      </div>
      <UserFeedback predictedState={recommendation?.predicted_state} />
      <Recommendations prediction={recommendation} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SensorChart data={sensorHistory} dataKey="heart_rate" label="Heart Rate Trend" color="#EF4444" delay={0} timeKey="timestamp" />
        <SensorChart data={sensorHistory} dataKey="temperature" label="Temperature Trend" color="#F97316" delay={0.1} timeKey="timestamp" />
        <SensorChart data={sensorHistory} dataKey="sleep_score" label="Sleep Score Trend" color="#818CF8" delay={0.15} timeKey="timestamp" />
        <SensorChart data={sensorHistory} dataKey="stress_score" label="Stress Score Trend" color="#F97316" delay={0.2} timeKey="timestamp" />
      </div>

      <footer className="text-center py-4">
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xl mx-auto">
          This system provides wellness screening and early emotional-state indicators only. It is not a medical diagnosis tool.
        </p>
      </footer>
    </div>
  )
}
