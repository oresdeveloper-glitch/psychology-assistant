const API_BASE = '/api/v1'

export async function postSensorReading(data) {
  const res = await fetch(`${API_BASE}/sensor-readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function postVoiceFeatures(data) {
  const res = await fetch(`${API_BASE}/voice-features`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function predictState(userId) {
  const res = await fetch(`${API_BASE}/predict-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE}/predictions/${userId}?limit=${limit}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getSensorHistory(userId, limit = 50) {
  const res = await fetch(`${API_BASE}/sensor-readings/${userId}?limit=${limit}`)
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
