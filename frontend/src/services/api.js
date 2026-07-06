const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

function getToken() {
  try { return localStorage.getItem('khairaty_token') } catch { return null }
}

function authHeaders() {
  const token = getToken()
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
    throw new Error(err.detail || 'Login failed')
  }
  return res.json()
}

export async function registerUser(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
    throw new Error(err.detail || 'Registration failed')
  }
  return res.json()
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function postSensorReading(data) {
  const res = await fetch(`${API_BASE}/sensor-readings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function postVoiceFeatures(data) {
  const res = await fetch(`${API_BASE}/voice-features`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function predictState(userId) {
  const res = await fetch(`${API_BASE}/predict-state`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      user_id: userId,
      sensor_window_seconds: 30,
      voice_window_seconds: 10,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getPredictions(userId, limit = 20) {
  const res = await fetch(`${API_BASE}/predictions/${userId}?limit=${limit}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getSensorHistory(userId, limit = 50) {
  const res = await fetch(`${API_BASE}/sensor-readings/${userId}?limit=${limit}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getMqttLatest() {
  const res = await fetch(`${API_BASE}/mqtt/latest`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getMqttHistory() {
  const res = await fetch(`${API_BASE}/mqtt/history`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getLiveRecommendations() {
  const res = await fetch(`${API_BASE}/recommendations/live`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
