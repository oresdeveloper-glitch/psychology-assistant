import urllib.request, json

BASE = "http://localhost:8000/api/v1"

def post(path, data):
    req = urllib.request.Request(BASE + path, json.dumps(data).encode(), {"Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

ok = 0; fail = 0

# 1. Health
s, d = post("/health", {})
if s == 200: ok += 1; print("1. Health: OK")
else: fail += 1; print("1. Health: FAIL", s, d)

# 2. Sensor reading
s, d = post("/sensor-readings", {
    "user_id": "user_001", "device_id": "esp32_001",
    "timestamp": "2026-06-06T03:00:00Z",
    "temperature": 36.5, "heart_rate": 92,
    "activity_score": 76, "sleep_score": 68
})
if s == 200: ok += 1; print("2. Sensor: OK (id=%d)" % d["id"])
else: fail += 1; print("2. Sensor: FAIL", s, d)

# 3. Voice features
s, d = post("/voice-features", {
    "user_id": "user_001",
    "timestamp": "2026-06-06T03:00:03Z",
    "mfcc": [12.4, -3.2, 6.8, 1.5],
    "pitch": 185.2, "energy": 0.74,
    "speaking_rate": 3.2, "pause_ratio": 0.18
})
if s == 200: ok += 1; print("3. Voice: OK (id=%d)" % d["id"])
else: fail += 1; print("3. Voice: FAIL", s, d)

# 4. Prediction
s, d = post("/predict-state", {
    "user_id": "user_001",
    "sensor_window_seconds": 300,
    "voice_window_seconds": 120
})
if s == 200:
    ok += 1
    print("4. Prediction: OK")
    print("   State: %s (%.0f%%)" % (d["predicted_state"], d["confidence"]*100))
    print("   Risk: %s" % d["depression_risk"])
else:
    fail += 1
    print("4. Prediction: FAIL", s, d)

# 5. Prediction history
s, d = post("/predictions/user_001?limit=5", {})
if s == 200: ok += 1; print("5. History: OK (%d predictions)" % len(d))
else: fail += 1; print("5. History: FAIL", s, d)

print("\nResults: %d passed, %d failed" % (ok, fail))
