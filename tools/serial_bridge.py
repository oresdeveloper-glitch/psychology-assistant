#!/usr/bin/env python3
"""Khairaty serial -> API bridge.

Reads the ESP32's real sensor lines from a USB serial port
(KHAIRATY:<tempC>,<bpm>,<ir>) and forwards them to the Khairaty
backend ingest endpoint so the live dashboard shows real data.

Usage:
    python serial_bridge.py                # auto-detect COM port
    python serial_bridge.py COM12          # explicit port
"""

import json
import logging
import re
import sys
import time

import requests
import serial
import serial.tools.list_ports

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("serial_bridge")

# Backend ingest endpoint (live HF Space)
API_URL = "https://orresydeveloper11-khairaty-api.hf.space/api/v1/sensor/ingest"

LINE_RE = re.compile(r"^KHAIRATY:([-0-9.]+),([0-9]+),([0-9]+)\s*$")


def find_esp32_port():
    for p in serial.tools.list_ports.comports():
        desc = (p.description or "").lower()
        if "ch340" in desc or "ch34" in desc or "ch9102" in desc or "serial" in desc:
            return p.device
    return None


def parse_line(line):
    m = LINE_RE.match(line)
    if not m:
        return None
    temp_c = float(m.group(1))
    bpm = int(m.group(2))
    ir = int(m.group(3))
    return {"temperature": round(temp_c, 2), "heartRate": bpm, "ir": ir}


def calc_stress(temp_c, hr):
    s = 0
    if hr < 75:
        s += 10
    elif hr < 95:
        s += 30
    elif hr < 110:
        s += 50
    else:
        s += 70
    if temp_c >= 24 and temp_c <= 28:
        s += 5
    elif temp_c > 28 and temp_c <= 31:
        s += 15
    else:
        s += 25
    return max(0, min(100, s))


def classify(s):
    if s < 40:
        return "NORMAL/CALM"
    if s < 70:
        return "MODERATE"
    return "STRESS"


def classify_risk(hr):
    if hr > 105:
        return "HIGH RISK"
    if hr > 90:
        return "MODERATE RISK"
    return "LOW RISK"


def build_payload(sample):
    temp = sample["temperature"]
    hr = sample["heartRate"]
    stress = calc_stress(temp, hr)
    return {
        "temperature": temp,
        "heartRate": hr,
        "ir": sample["ir"],
        "sleepScore": 100 if hr < 70 else (85 if hr < 90 else 65),
        "stressScore": stress,
        "currentStatus": classify(stress),
        "depressionRisk": classify_risk(hr),
    }


def post(payload):
    try:
        r = requests.post(API_URL, json=payload, timeout=5)
        if r.status_code == 200:
            log.info("sent  %s", json.dumps(payload))
        else:
            log.warning("POST %s -> %s", r.status_code, r.text[:120])
    except Exception as e:
        log.warning("POST error: %s", e)


def run(port, baud=115200):
    log.info("Opening %s @ %d", port, baud)
    ser = serial.Serial(port, baud, timeout=0.5)
    last_send = 0.0
    while True:
        line = ser.readline()
        if not line:
            continue
        try:
            text = line.decode("utf-8", errors="replace").strip()
        except Exception:
            continue
        sample = parse_line(text)
        if sample is None:
            continue
        now = time.time()
        if now - last_send < 1.0:
            continue
        last_send = now
        post(build_payload(sample))


def main():
    port = sys.argv[1] if len(sys.argv) > 1 else find_esp32_port()
    if not port:
        log.error("No ESP32 serial port found. Is the device plugged in?")
        sys.exit(1)
    while True:
        try:
            run(port)
        except serial.SerialException as e:
            log.error("Serial error: %s. Reconnecting in 3s...", e)
            time.sleep(3)
        except KeyboardInterrupt:
            log.info("Stopped.")
            break


if __name__ == "__main__":
    main()
