import { useState, useEffect } from 'react'
import { Heart, Activity, Thermometer, Droplets, Brain } from 'lucide-react'

const API = '/api/v1'
const C = { rose: '#fb7185', orange: '#fb923c', cyan: '#22d3ee', emerald: '#34d399' }

function Card({ title, value, unit, icon: Icon, colorKey, sub }) {
  const color = C[colorKey] || '#94a3b8'
  return (
    <div className="premium-glass rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        <Icon className="w-4 h-4" style={{color}} />
        {title}
      </div>
      <div className="text-2xl font-bold" style={{color}}>{value ?? '--'}</div>
      {unit && <div className="text-xs text-slate-500 mt-0.5">{unit}</div>}
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

export default function DashboardSlim() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await fetch(`${API}/mqtt/latest`)
        if (r.ok) setData(await r.json())
      } catch {}
    }
    fetchData()
    const id = setInterval(fetchData, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen app-bg" style={{color: '#e2e8f0', fontFamily: 'Inter, sans-serif'}}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Psychology Assistant</h1>
            <p className="text-xs text-slate-500">Mental Wellness Monitor</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Heart className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card title="Heart Rate" value={data?.heartRate} unit="bpm" icon={Heart} colorKey="rose" />
          <Card title="Temperature" value={data?.temperature} unit="°C" icon={Thermometer} colorKey="orange" />
          <Card title="Humidity" value={data?.humidity} unit="%" icon={Droplets} colorKey="cyan" />
          <Card title="Soil Moisture" value={data?.soil_moisture} unit="%" icon={Droplets} colorKey="emerald" />
        </div>

        <div className="premium-glass rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            Mental State
          </div>
          <div className="text-lg font-bold text-indigo-400">
            {data?.currentStatus || data?.stressScore ? 'Monitoring' : 'Awaiting data...'}
          </div>
          {data?.stressScore && (
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-slate-500">Stress: <span className="text-orange-400 font-semibold">{data.stressScore}</span></span>
              <span className="text-slate-500">Sleep: <span className="text-indigo-400 font-semibold">{data.sleepScore ?? '--'}</span></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Activity className="w-3 h-3" />
          Last update: {data?._received_at ? new Date(data._received_at).toLocaleTimeString() : '--'}
        </div>
      </div>
    </div>
  )
}
