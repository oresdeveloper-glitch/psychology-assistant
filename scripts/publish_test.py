import json
import time
import paho.mqtt.client as mqtt
from datetime import datetime

BROKER = 'broker.emqx.io'
PORT = 1883
TOPIC = 'yasir/crop/device001/data'

payload = {
    'deviceId': 'esp32_001',
    'temperature': 36.5,
    'heartRate': 130,
    'activityScore': 99.22,
    'sleepScore': 78,
    'stressScore': 64,
    'currentStatus': 'MODERATE',
    'depressionRisk': 'LOW RISK',
    'timestamp': datetime.utcnow().isoformat()
}

client = mqtt.Client(client_id='local_debug_publisher')
try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    msg = json.dumps(payload)
    rc = client.publish(TOPIC, msg)
    print('Published:', msg)
    time.sleep(1)
    client.loop_stop()
    client.disconnect()
except Exception as e:
    print('Publish error:', e)
