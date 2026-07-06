import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, Camera, Heart } from 'lucide-react'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }

export default function ProfilePage({ user, onUpdateUser }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
  })

  const handleSave = () => {
    onUpdateUser({ ...user, ...form })
    setEditing(false)
  }

  return (
    <main className="min-h-screen text-white font-sans px-4 sm:px-6 py-4 sm:py-6">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-5">

        {/* Header Card */}
        <motion.div variants={item} className="premium-glass rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <User className="w-10 h-10 text-white" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <Camera className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{form.name || 'User'}</h1>
            <p className="text-slate-400 text-sm mt-1">{form.bio || 'Wellness journey in progress'}</p>
            <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                <Heart className="w-3 h-3" /> Psychology Assistant
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">Member</span>
            </div>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${editing ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}
          >
            {editing ? <><Save className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit</>}
          </button>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div variants={item} className="premium-glass rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Personal Information</h3>
            {[
              { icon: User, label: 'Full Name', value: form.name, key: 'name' },
              { icon: Mail, label: 'Email', value: form.email, key: 'email' },
              { icon: Phone, label: 'Phone', value: form.phone, key: 'phone' },
              { icon: MapPin, label: 'Location', value: form.location, key: 'location' },
            ].map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.06]">
                  <f.icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{f.label}</p>
                  {editing ? (
                    <input
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white mt-0.5 focus:outline-none focus:border-emerald-400/50"
                    />
                  ) : (
                    <p className={`text-sm font-medium truncate ${form[f.key] ? 'text-white' : 'text-slate-500 italic'}`}>
                      {form[f.key] || 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={item} className="premium-glass rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Account Details</h3>
            {[
              { icon: Calendar, label: 'Member Since', value: user?.memberSince || 'Today' },
              { icon: Shield, label: 'Account Type', value: 'Standard' },
              { icon: Shield, label: 'Data Encryption', value: 'AES-256' },
              { icon: Shield, label: 'Two-Factor Auth', value: 'Enabled' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.06]">
                  <f.icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm font-medium text-white">{f.value}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bio */}
        <motion.div variants={item} className="premium-glass rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Bio</h3>
          {editing ? (
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white min-h-[80px] focus:outline-none focus:border-emerald-400/50"
            />
          ) : (
            <p className={`text-sm leading-relaxed ${form.bio ? 'text-slate-300' : 'text-slate-500 italic'}`}>
              {form.bio || 'No bio set'}
            </p>
          )}
        </motion.div>
      </motion.div>
    </main>
  )
}
