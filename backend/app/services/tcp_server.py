import json
import logging
import socket
import threading
from datetime import datetime

logger = logging.getLogger(__name__)


def start_tcp_server(host="127.0.0.1", port=9000):
    def handle_client(conn):
        try:
            data = conn.recv(4096)
            if data:
                payload = json.loads(data.decode().strip())
                payload["_received_at"] = datetime.utcnow().isoformat()
                from app.services.live_mqtt import push_data
                push_data(payload)
                logger.info("TCP sensor data: %s", payload)
        except Exception as e:
            logger.error("TCP handler error: %s", e)
        finally:
            conn.close()

    def run():
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind((host, port))
            s.listen(5)
            s.settimeout(1.0)
            logger.info("TCP server listening on %s:%s", host, port)
            while True:
                try:
                    conn, addr = s.accept()
                    threading.Thread(target=handle_client, args=(conn,), daemon=True).start()
                except socket.timeout:
                    continue
        except Exception as e:
            logger.error("TCP server error: %s", e)
        finally:
            s.close()

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread
