import json
import logging
import threading
import time
import asyncio
from collections import deque
from datetime import datetime
import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)

MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
TOPIC = "yasir/crop/device001/data"
TOPICS = [
    TOPIC,
    "khairaty/sensor/esp32_001",
    "khairaty/sensor/+",
]
HISTORY_SIZE = 30

_state = {'latest': {}, 'connected': False, 'real_data': False}
history = deque(maxlen=HISTORY_SIZE)


def first_present(data, *keys):
    for key in keys:
        if key in data:
            return data[key]
    return None


def is_success_code(code):
    try:
        return int(code) == 0
    except Exception:
        return str(code).lower() == "success"


def on_connect(client, userdata, flags, rc, properties=None):
    _state['connected'] = is_success_code(rc)
    if _state['connected']:
        for topic in TOPICS:
            client.subscribe(topic)
        logger.info("Live MQTT connected -> subscribed to %s", ", ".join(TOPICS))
    else:
        logger.warning("Live MQTT connect failed: rc=%s", rc)


def on_disconnect(client, userdata, disconnect_flags, rc, properties=None):
    _state['connected'] = False
    logger.warning("Live MQTT disconnected: rc=%s", rc)


def is_valid_data(data):
    try:
        t = data.get("temperature")
        hr = first_present(data, "heartRate", "heart_rate")
        sleep = first_present(data, "sleepScore", "sleep_score")
        stress = first_present(data, "stressScore", "stress_score")
        if t is not None and (t < -20 or t > 80):
            return False
        if hr is not None and (hr < 30 or hr > 220):
            return False
        if sleep is not None and (sleep < 0 or sleep > 100):
            return False
        if stress is not None and (stress < 0 or stress > 100):
            return False
        return True
    except Exception:
        return False


def on_message(client, userdata, msg):
    try:
        if msg.retain:
            logger.info("Ignoring retained message on %s", msg.topic)
            return
        data = json.loads(msg.payload.decode())
        data = normalize_data(data)
        if not is_valid_data(data):
            logger.warning("MQTT received invalid data, dropped: %s", data)
            return
        data["_received_at"] = datetime.utcnow().isoformat()
        data["_stale"] = False
        _state['latest'] = data
        _state['real_data'] = True
        history.append(data)
        logger.debug("MQTT live data: %s", data)
    except Exception as e:
        logger.error("MQTT live parse error: %s", e)


def normalize_data(data):
    return {
        **data,
        "heartRate": first_present(data, "heartRate", "heart_rate"),
        "sleepScore": first_present(data, "sleepScore", "sleep_score"),
        "stressScore": first_present(data, "stressScore", "stress_score"),
        "activityScore": first_present(data, "activityScore", "activity_score"),
        "currentStatus": first_present(data, "currentStatus", "current_status"),
        "depressionRisk": first_present(data, "depressionRisk", "depression_risk"),
    }


def push_data(data):
    data = normalize_data(data)
    if not is_valid_data(data):
        logger.warning("push_data rejected invalid data: %s", data)
        return
    if "_received_at" not in data:
        data["_received_at"] = datetime.utcnow().isoformat()
    data["_stale"] = False
    _state['latest'] = data
    _state['real_data'] = True
    _state['connected'] = True
    history.append(data)

def get_latest():
    return _state['latest']

def is_connected():
    return _state['connected']

def has_real_data():
    return _state['real_data']


def mqtt_thread():
    client = mqtt.Client(
        client_id="psychology-assistant-live",
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
    )
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    try:
        client.connect_async(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_forever()
    except Exception as e:
        logger.error("Live MQTT connection failed: %s", e)


def fallback_thread():
    ever_seen_real = False
    last_real_ts = 0.0
    while True:
        time.sleep(3)
        now = time.time()
        latest = _state.get('latest', {})
        if latest and '_received_at' in latest and not latest.get('_no_data'):
            if not ever_seen_real:
                ever_seen_real = True
            try:
                last_real_ts = datetime.fromisoformat(latest['_received_at']).timestamp()
            except Exception:
                pass
        if ever_seen_real:
            _state['latest']['_stale'] = now - last_real_ts > 30
        else:
            _state['latest'] = {
                "_no_data": True, "_received_at": datetime.utcnow().isoformat()
            }
        _state['connected'] = is_connected()


def start_live_mqtt():
    t1 = threading.Thread(target=mqtt_thread, daemon=True)
    t1.start()
    t2 = threading.Thread(target=fallback_thread, daemon=True)
    t2.start()
    logger.info("Live MQTT + HTTP ingest active")
    return t1


_last_sent_json = [""]

async def stream_latest():
    while True:
        latest = _state.get('latest', {})
        if latest and not latest.get('_no_data'):
            data = dict(latest)
            data["_broker_connected"] = _state.get('connected', False)
            current = json.dumps(data, default=str)
            if current != _last_sent_json[0]:
                _last_sent_json[0] = current
                yield f"data: {current}\n\n"
        await asyncio.sleep(0.05)
