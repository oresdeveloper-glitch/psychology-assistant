#!/usr/bin/env python3
"""Khairaty sensor simulator.

Produces realistic physiological sensor readings (as if from the real
ESP32 MAX30102 + NTC thermistor) and forwards them to the Khairaty
backend ingest endpoint so the live dashboard shows plausible live data.

This mirrors tools/serial_bridge.py's payload format exactly, so switching
between real hardware (serial_bridge.py) and simulation is seamless.

Usage:
    python simulate_sensor.py              # default healthy resting state
    python simulate_sensor.py --stress     # HR elevated / stressed
    python simulate_sensor.py --finger=off # force no-finger (IR low, BPM 0)

Flags:
    --finger on|off|auto   finger presence (default auto: toggles periodically)
"""

import argparse
import json
import logging
import math
import random
import sys
import time

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("simulator")

API_URL = "https://orresydeveloper11-khairaty-api.hf.space/api/v1/sensor/ingest"


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
    if 24 <= temp_c <= 28:
        s += 5
    elif 28 < temp_c <= 31:
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stress", action="store_true", help="simulate a stressed state")
    ap.add_argument("--finger", choices=["on", "off", "auto"], default="auto")
    args = ap.parse_args()

    log.info("Simulator started (stress=%s finger=%s)", args.stress, args.finger)
    t0 = time.time()
    finger_on = args.finger in ("on", "auto")
    finger_phase = 0.0
    while True:
        t = time.time() - t0
        # --- Temperature: room baseline ~24C with slow drift, or fever in stress ---
        base_temp = 39.5 if args.stress else 36.6
        temp = base_temp + 0.8 * math.sin(2 * math.pi * t / 60.0) + randomish_noise(0.05)

        # --- Heart rate: 72 bpm resting + sinus arrhythmia; higher when stressed ---
        base_hr = 112 if args.stress else 72
        hr = int(base_hr
                 + 5.0 * math.sin(2 * math.pi * t / 8.0)   # respiratory sinus arrythmia
                 + 3.0 * math.sin(2 * math.pi * t / 4.7)       # minor variation
                 + randomish_noise(1.5))

        # --- IR: finger detection. High (~75000) with finger, low (~700) without ---
        if args.finger == "off":
            finger_on = False
        elif args.finger == "on":
            finger_on = True
        else:
            # auto: finger present ~85% of the time, briefly removed to simulate taps
            inject_phase = (t % 20.0)
            finger_on = not (10 <= inject_phase < 12)

        if finger_on:
            ir = 74000 + 12000 * math.sin(2 * math.pi * t / 1.0) + randomish_noise(1500)
            ir = max(60000, ir)
        else:
            ir = 700 + randomish_noise(50)
            hr = 0  # no finger -> no valid beats

        stress = calc_stress(temp, hr)
        payload = {
            "temperature": round(temp, 2),
            "heartRate": hr,
            "ir": int(ir),
            "sleepScore": 100 if hr < 70 else (85 if hr < 90 else 65),
            "stressScore": stress,
            "currentStatus": classify(stress),
            "depressionRisk": classify_risk(hr),
        }
        try:
            r = requests.post(API_URL, json=payload, timeout=5)
            if r.status_code == 200:
                log.info("sim  %s", json.dumps(payload))
            else:
                log.warning("POST %s -> %s", r.status_code, r.text[:120])
        except Exception as e:
            log.warning("POST error: %s", e)
        time.sleep(2.0)


def randomish_noise(amp):
    # deterministic-ish pseudo noise so output looks organic
    return (math.sin(time.time() * 13.0 + 17.0) + math.sin(time.time() * 7.0)) * amp


if __name__ == "__main__":
    main()