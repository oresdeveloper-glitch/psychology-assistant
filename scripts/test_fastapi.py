import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Health
r = client.get("/api/v1/health")
print("Health:", r.status_code, r.json())

# Sensor
r = client.post("/api/v1/sensor-readings", json={
    "user_id": "user_001", "device_id": "esp32_001",
    "timestamp": "2026-06-06T03:00:00Z",
    "temperature": 36.5, "heart_rate": 92,
    "activity_score": 76, "sleep_score": 68
})
print("Sensor:", r.status_code, r.json())

# Voice
r = client.post("/api/v1/voice-features", json={
    "user_id": "user_001",
    "timestamp": "2026-06-06T03:00:03Z",
    "mfcc": [12.4, -3.2, 6.8, 1.5],
    "pitch": 185.2, "energy": 0.74,
    "speaking_rate": 3.2, "pause_ratio": 0.18
})
print("Voice:", r.status_code)
if r.status_code != 200:
    print("  Error:", r.text)
else:
    print("  Body:", r.json())

# Prediction
r = client.post("/api/v1/predict-state", json={
    "user_id": "user_001",
    "sensor_window_seconds": 30,
    "voice_window_seconds": 10
})
print("Prediction:", r.status_code)
if r.status_code == 200:
    print("  State:", r.json()["predicted_state"], r.json()["confidence"])
