import { useState, useEffect } from 'react'
import { Heart, Activity, Thermometer, Droplets, Brain } from 'lucide-react'

const API = '/api/v1'
const C = { rose: '#fb7185', orange: '#fb923c', cyan: '#22d3ee', emerald: '#34d399' }

function Card({ title, value, unit, icon: Icon, colorKey, sub }) {
  const color = C[colorKey] || '#94a3b8'
  return (
    <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.06)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.06)'}}>
      <div className="flex items-center gap-2" style={{color:'#94a3b8', fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px'}}>
        <Icon className="w-4 h-4" style={{color}} />
        {title}
      </div>
      <div style={{fontSize:'24px', fontWeight:700, color}}>{value ?? '--'}</div>
      {unit && <div style={{fontSize:'12px', color:'#64748b', marginTop:'2px'}}>{unit}</div>}
      {sub && <div style={{fontSize:'12px', color:'#94a3b8', marginTop:'4px'}}>{sub}</div>}
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
    <div className="min-h-screen" style={{background:'#0F172A', color: '#e2e8f0', fontFamily: 'Inter, sans-serif'}}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{color:'#e2e8f0'}}>Psychology Assistant</h1>
            <p className="text-xs" style={{color:'#94a3b8'}}>Mental Wellness Monitor</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #2DD4BF, #10B981)'}}>
            <Heart className="w-5 h-5" style={{color:'#0F172A'}} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card title="Heart Rate" value={data?.heartRate} unit="bpm" icon={Heart} colorKey="rose" />
          <Card title="Temperature" value={data?.temperature} unit="°C" icon={Thermometer} colorKey="orange" />
          <Card title="Humidity" value={data?.humidity} unit="%" icon={Droplets} colorKey="cyan" />
          <Card title="Soil Moisture" value={data?.soil_moisture} unit="%" icon={Droplets} colorKey="emerald" />
        </div>

        <div className="rounded-xl p-4 mb-4" style={{background:'rgba(255,255,255,0.06)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-2" style={{color:'#94a3b8', fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em'}}>
            <Brain className="w-4 h-4" style={{color:'#a78bfa'}} />
            Mental State
          </div>
          <div className="text-lg font-bold" style={{color:'#a78bfa'}}>
            {data?.currentStatus || data?.stressScore ? 'Monitoring' : 'Awaiting data...'}
          </div>
          {data?.stressScore && (
            <div className="flex gap-3 mt-2" style={{fontSize:'12px'}}>
              <span style={{color:'#94a3b8'}}>Stress: <span style={{color:'#fb923c', fontWeight:600}}>{data.stressScore}</span></span>
              <span style={{color:'#94a3b8'}}>Sleep: <span style={{color:'#818cf8', fontWeight:600}}>{data.sleepScore ?? '--'}</span></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2" style={{fontSize:'12px', color:'#64748b'}}>
          <Activity className="w-3 h-3" />
          Last update: {data?._received_at ? new Date(data._received_at).toLocaleTimeString() : '--'}
        </div>
      </div>
    </div>
  )
}
