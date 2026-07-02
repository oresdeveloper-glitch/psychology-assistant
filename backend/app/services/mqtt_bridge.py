import json
import logging
import threading
import requests
import paho.mqtt.client as mqtt
from datetime import datetime

logger = logging.getLogger(__name__)

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
API_BASE = "http://localhost:8000/api/v1"
TOPIC_SENSOR = "khairaty/sensor/+"
TOPIC_VOICE = "khairaty/voice/+"


def on_sensor_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        payload["timestamp"] = payload.get("timestamp") or datetime.utcnow().isoformat()
        resp = requests.post(f"{API_BASE}/sensor-readings", json=payload, timeout=5)
        logger.info("MQTT->API sensor: %s", resp.status_code)
    except Exception as e:
        logger.error("MQTT sensor bridge error: %s", e)


def on_voice_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        payload["timestamp"] = payload.get("timestamp") or datetime.utcnow().isoformat()
        if isinstance(payload.get("mfcc"), (int, float)):
            payload["mfcc"] = [float(payload["mfcc"])] * 13
        resp = requests.post(f"{API_BASE}/voice-features", json=payload, timeout=5)
        logger.info("MQTT->API voice: %s", resp.status_code)
    except Exception as e:
        logger.error("MQTT voice bridge error: %s", e)


def start_mqtt_bridge():
    def run():
        client = mqtt.Client(client_id="khairaty-bridge")
        client.on_message = lambda c, u, m: (
            on_sensor_message(c, u, m) if "sensor" in m.topic
            else on_voice_message(c, u, m)
        )
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.subscribe(TOPIC_SENSOR)
        client.subscribe(TOPIC_VOICE)
        logger.info("MQTT bridge listening on %s", MQTT_BROKER)
        client.loop_forever()

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread
