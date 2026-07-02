import urllib.request, json

BASE = "http://localhost:8000/api/v1"

def post(path, data):
    req = urllib.request.Request(f"{BASE}{path}", data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def get(path):
    r = urllib.request.urlopen(f"{BASE}{path}")
    return r.status, json.loads(r.read())

# Health
print("=== Health ===")
s, d = get("/health")
print(f"  {s}: {d}")

# Sensor reading
print("\n=== Sensor Reading ===")
s, d = post("/sensor-readings", {
    "user_id": "user_001", "device_id": "esp32_001",
    "timestamp": "2026-06-06T03:00:00Z",
    "temperature": 36.5, "heart_rate": 92,
    "activity_score": 76, "sleep_score": 68
})
print(f"  {s}: {d}")

# Voice features
print("\n=== Voice Features ===")
s, d = post("/voice-features", {
    "user_id": "user_001",
    "timestamp": "2026-06-06T03:00:03Z",
    "mfcc": [12.4, -3.2, 6.8, 1.5],
    "pitch": 185.2, "energy": 0.74,
    "speaking_rate": 3.2, "pause_ratio": 0.18
})
print(f"  {s}: {d}")

# Prediction
print("\n=== Prediction ===")
s, d = post("/predict-state", {
    "user_id": "user_001",
    "sensor_window_seconds": 300,
    "voice_window_seconds": 300
})
print(f"  {s}: {d}")

# History
print("\n=== Prediction History ===")
s, d = get("/predictions/user_001")
print(f"  {s}: {len(d)} predictions")

print("\n=== Sensor History ===")
s, d = get("/sensor-readings/user_001")
print(f"  {s}: {len(d)} readings")

print("\n✅ All endpoints tested")
