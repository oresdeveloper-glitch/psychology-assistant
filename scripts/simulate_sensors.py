import requests
import time
import random
from datetime import datetime

API_BASE = "http://localhost:8000/api/v1"
USER_ID = "user_001"
DEVICE_ID = "esp32_001"


def generate_sensor_reading():
    return {
        "user_id": USER_ID,
        "device_id": DEVICE_ID,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "temperature": round(random.gauss(36.5, 0.5), 1),
        "heart_rate": round(random.gauss(75, 15), 0),
        "activity_score": round(random.uniform(20, 100), 0),
        "sleep_score": round(random.uniform(30, 100), 0),
    }


def generate_voice_features():
    return {
        "user_id": USER_ID,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "mfcc": [round(random.gauss(0, 5), 2) for _ in range(13)],
        "pitch": round(random.gauss(180, 30), 1),
        "energy": round(random.uniform(0.2, 0.9), 2),
        "speaking_rate": round(random.gauss(3.5, 1.0), 1),
        "pause_ratio": round(random.uniform(0.05, 0.35), 2),
    }


def main():
    print("KHAIRATY Sensor Simulator")
    print("Sending data every 10 seconds to", API_BASE)

    while True:
        sensor = generate_sensor_reading()
        voice = generate_voice_features()

        try:
            r1 = requests.post(f"{API_BASE}/sensor-readings", json=sensor, timeout=5)
            r2 = requests.post(f"{API_BASE}/voice-features", json=voice, timeout=5)

            pred = requests.post(
                f"{API_BASE}/predict-state",
                json={"user_id": USER_ID, "sensor_window_seconds": 30, "voice_window_seconds": 10},
                timeout=5,
            )

            print(
                f"[{datetime.now().strftime('%H:%M:%S')}] "
                f"Sensor:{r1.status_code} Voice:{r2.status_code} "
                f"Prediction:{pred.json()['predicted_state']} "
                f"({pred.json()['confidence']*100:.0f}%)"
            )
        except Exception as e:
            print(f"Error: {e}")

        time.sleep(10)


if __name__ == "__main__":
    main()
