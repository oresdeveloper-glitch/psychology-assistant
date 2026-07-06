import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Heart, Brain, Moon, Sun, Wind, Dumbbell, Music, Coffee, BookOpen, Sparkles, AlertTriangle, Activity, Thermometer, HeartPulse } from 'lucide-react'
import { getLiveRecommendations, healthCheck } from '../services/api'

const USER_ID = 'user_001'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }

const recommendations = [
  {
    category: 'Mindfulness',
    icon: Brain,
    color: '#818CF8',
    items: [
      { title: 'Deep Breathing', desc: 'Inhale 4s — Hold 7s — Exhale 8s. Repeat 5 times.', icon: Wind, time: '3 min' },
      { title: 'Body Scan', desc: 'Slowly focus on each part of your body from head to toe.', icon: Moon, time: '10 min' },
      { title: 'Gratitude Journal', desc: 'Write down 3 things you are grateful for today.', icon: BookOpen, time: '5 min' },
    ],
  },
  {
    category: 'Physical Wellness',
    icon: Dumbbell,
    color: '#F97316',
    items: [
      { title: 'Stretch Break', desc: 'Stand up, reach for the sky, touch your toes. Hold 15s.', icon: Sun, time: '2 min' },
      { title: 'Walk Outside', desc: 'A short 10-minute walk in fresh air resets your mind.', icon: Wind, time: '10 min' },
      { title: 'Hydrate', desc: 'Drink a glass of water. Your brain performs better hydrated.', icon: Coffee, time: '1 min' },
    ],
  },
  {
    category: 'Rest & Recovery',
    icon: Moon,
    color: '#06D6A0',
    items: [
      { title: 'Power Nap', desc: 'A 20-minute nap boosts alertness without sleep inertia.', icon: Moon, time: '20 min' },
      { title: 'Screen Break', desc: 'Look at something 20 feet away for 20 seconds every 20 min.', icon: Sun, time: '20 sec' },
      { title: 'Calm Music', desc: 'Listen to lo-fi or nature sounds to lower stress levels.', icon: Music, time: '15 min' },
    ],
  },
]

const moodTips = {
  CALM: { tip: 'You are in a good state. Use this clarity to plan your week ahead.', color: '#06D6A0' },
  STRESS: { tip: 'Try the 4-7-8 breathing technique. Step away from triggers for 10 min.', color: '#F97316' },
  FATIGUE: { tip: 'Rest is not optional. Take a power nap or a 10-min walk outside.', color: '#818CF8' },
  ANXIETY: { tip: 'Ground yourself: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.', color: '#EF4444' },
  UNKNOWN: { tip: 'Continue monitoring. Your wellness data is being analyzed.', color: '#94a3b8' },
}

export default function RecommendationPage() {
  const [selected, setSelected] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [connected, setConnected] = useState(false)

  const activeMood = recommendation?.predicted_state || 'UNKNOWN'
  const mood = moodTips[activeMood] || moodTips.UNKNOWN

  const fetchData = useCallback(async () => {
    try {
      await healthCheck()
      setConnected(true)
      const data = await getLiveRecommendations()
      setRecommendation(data)
    } catch {
      setConnected(false)
    }
  }, [])

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i) }, [fetchData])

  return (
    <main className="min-h-screen text-white font-sans px-4 sm:px-6 py-4 sm:py-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <motion.div variants={item} className="premium-glass rounded-2xl p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Recommendations</h1>
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">AI-powered insights based on your live sensor data</p>
            </div>
          </div>
          <Lightbulb className="w-5 h-5 text-amber-400/70" />
        </motion.div>

        {/* Live Status + AI Recommendation */}
        {recommendation && (
          <motion.div variants={item} className="premium-glass rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Live Analysis</h3>
              <span className="text-[10px] text-slate-600 ml-auto font-mono">Confidence {(recommendation.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Detected State:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{ backgroundColor: `${mood.color}18`, borderColor: `${mood.color}33`, color: mood.color }}>
                {activeMood}
              </span>
              <span className="text-xs text-slate-500">| Depression Risk: {recommendation.depression_risk || 'N/A'}</span>
            </div>

            {/* Live Sensor Values */}
            {recommendation.sensor_data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="premium-glass-light rounded-xl p-3 text-center">
                  <Thermometer className="w-4 h-4 mx-auto mb-1.5 text-rose-400" />
                  <p className="text-xs text-slate-500">Temp</p>
                  <p className="text-sm font-bold text-white mt-0.5">{recommendation.sensor_data.temperature?.toFixed(1)}°C</p>
                </div>
                <div className="premium-glass-light rounded-xl p-3 text-center">
                  <HeartPulse className="w-4 h-4 mx-auto mb-1.5 text-red-400" />
                  <p className="text-xs text-slate-500">Heart Rate</p>
                  <p className="text-sm font-bold text-white mt-0.5">{recommendation.sensor_data.heartRate} bpm</p>
                </div>
                <div className="premium-glass-light rounded-xl p-3 text-center">
                  <Moon className="w-4 h-4 mx-auto mb-1.5 text-indigo-400" />
                  <p className="text-xs text-slate-500">Sleep</p>
                  <p className="text-sm font-bold text-white mt-0.5">{recommendation.sensor_data.sleepScore}%</p>
                </div>
                <div className="premium-glass-light rounded-xl p-3 text-center">
                  <Activity className="w-4 h-4 mx-auto mb-1.5 text-amber-400" />
                  <p className="text-xs text-slate-500">Stress</p>
                  <p className="text-sm font-bold text-white mt-0.5">{recommendation.sensor_data.stressScore}</p>
                </div>
              </div>
            )}

            {recommendation.recommendation && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${mood.color}18` }}>
                  <Heart className="w-4 h-4" style={{ color: mood.color }} />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mt-1">{recommendation.recommendation}</p>
              </div>
            )}

            {recommendation.medical_warning && (
              <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300/80 leading-relaxed">{recommendation.medical_warning}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Tips by Mood */}
        <motion.div variants={item} className="premium-glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${mood.color}18` }}>
              <Sparkles className="w-4 h-4" style={{ color: mood.color }} />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Quick Tip Based on Your Current State</h3>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 mt-0.5 shrink-0" style={{ color: mood.color }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: mood.color }}>{activeMood}</p>
              <p className="text-sm text-slate-300 leading-relaxed">{mood.tip}</p>
            </div>
          </div>
        </motion.div>

        {/* Recommendation Categories */}
        {recommendations.map((cat) => (
          <motion.div key={cat.category} variants={item} className="premium-glass rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${cat.color}18` }}>
                <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: cat.color }}>{cat.category}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cat.items.map((r) => (
                <div key={r.title}>
                  <button
                    onClick={() => setSelected(selected === r.title ? null : r.title)}
                    className="w-full text-left rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.06] transition-all hover:border-white/[0.12]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <r.icon className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] text-slate-600 font-mono">{r.time}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{r.title}</p>
                    {selected === r.title && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-xs text-slate-400 leading-relaxed">
                        {r.desc}
                      </motion.p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Last Updated Timestamp */}
        {recommendation?.sensor_data?._received_at && (
          <motion.div variants={item} className="text-center">
            <span className="text-[10px] text-slate-600 font-mono">Last updated: {new Date(recommendation.sensor_data._received_at).toLocaleTimeString()}</span>
          </motion.div>
        )}

        {/* Disclaimer */}
        <motion.div variants={item} className="premium-glass-light rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400/70 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-100/70 leading-relaxed">
            These recommendations are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment.
          </p>
        </motion.div>

      </motion.div>
    </main>
  )
}
