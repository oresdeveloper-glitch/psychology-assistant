#!/usr/bin/env python3
import time
import json
from datetime import datetime
import paho.mqtt.client as mqtt

TOPIC = "yasir/crop/device001/data"
BROKER = "broker.emqx.io"
PORT = 1883


def on_connect(client, userdata, flags, rc):
    print(f"[{datetime.utcnow().isoformat()}] SUBSCRIBER connected rc={rc}")
    client.subscribe(TOPIC)


def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        try:
            j = json.loads(payload)
            pretty = json.dumps(j, indent=2)
        except Exception:
            pretty = payload
        print(f"[{datetime.utcnow().isoformat()}] MSG {msg.topic}: {pretty}")
    except Exception as e:
        print(f"Error decoding message: {e}")


def main():
    client = mqtt.Client(client_id="local_debug_subscriber")
    client.on_connect = on_connect
    client.on_message = on_message
    try:
        client.connect(BROKER, PORT, 60)
    except Exception as e:
        print(f"Connect error: {e}")
        return
    client.loop_start()
    print(f"Subscriber running and listening to {TOPIC} on {BROKER}:{PORT}")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Subscriber stopping")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == '__main__':
    main()
