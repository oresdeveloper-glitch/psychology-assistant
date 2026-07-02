import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Info, ChevronRight, Wifi, RefreshCw } from 'lucide-react'

const settingsGroups = [
  {
    title: 'Profile',
    items: [
      { icon: User, label: 'User ID', value: 'user_001', desc: 'Your unique identifier' },
      { icon: Wifi, label: 'Device', value: 'esp32_001', desc: 'Connected ESP32 module' },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { icon: Bell, label: 'Polling Interval', value: '10 seconds', desc: 'Data refresh rate' },
      { icon: RefreshCw, label: 'Sensor Window', value: '30 seconds', desc: 'Window for fusion' },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: Shield, label: 'Version', value: '1.0.0', desc: 'Psychology Assistant' },
      { icon: Info, label: 'Disclaimer', value: 'Not a medical device', desc: 'Wellness screening only' },
    ],
  },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState(null)

  return (
    <main className="min-h-screen text-white font-sans px-6 py-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">
        <motion.div variants={item} className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-xl">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">System configuration</p>
        </motion.div>

        {settingsGroups.map((group, gi) => (
          <motion.div
            key={group.title}
            variants={item}
            className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-xl"
          >
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">{group.title}</h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isOpen = activeSection === item.label
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => setActiveSection(isOpen ? null : item.label)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.06] transition-colors text-left border border-transparent hover:border-white/10"
                    >
                      <div className="p-2 rounded-lg bg-white/[0.06]">
                        <Icon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.value}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-14 pb-3">
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}

        <motion.footer variants={item} className="text-center py-6">
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl mx-auto">
            This system provides wellness screening and early emotional-state indicators only. It is not a medical diagnosis tool.
          </p>
        </motion.footer>
      </motion.div>
    </main>
  )
}
