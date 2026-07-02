import json
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.models.models import SensorReading, VoiceFeature, Prediction
from app.ml.feature_fusion import build_fused_vector
from app.ml.model import predictor

logger = logging.getLogger(__name__)


def get_recent_sensor(
    db: Session, user_id: str, window_seconds: int
) -> Optional[dict]:
    cutoff = datetime.utcnow() - timedelta(seconds=window_seconds)
    reading = (
        db.query(SensorReading)
        .filter(
            SensorReading.user_id == user_id,
            SensorReading.timestamp >= cutoff,
        )
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    if reading is None:
        return None
    return {
        "temperature": reading.temperature,
        "heart_rate": reading.heart_rate,
        "activity_score": reading.activity_score,
        "sleep_score": reading.sleep_score,
    }


def get_recent_voice(
    db: Session, user_id: str, window_seconds: int
) -> Optional[dict]:
    cutoff = datetime.utcnow() - timedelta(seconds=window_seconds)
    feature = (
        db.query(VoiceFeature)
        .filter(
            VoiceFeature.user_id == user_id,
            VoiceFeature.timestamp >= cutoff,
        )
        .order_by(VoiceFeature.timestamp.desc())
        .first()
    )
    if feature is None:
        return None
    mfcc = feature.mfcc_json
    if isinstance(mfcc, str):
        mfcc = json.loads(mfcc)
    return {
        "mfcc": mfcc,
        "pitch": feature.pitch,
        "energy": feature.energy,
        "speaking_rate": feature.speaking_rate,
        "pause_ratio": feature.pause_ratio,
    }


def predict_state(
    db: Session,
    user_id: str,
    sensor_window: int = 30,
    voice_window: int = 10,
    store: bool = True,
) -> dict:
    sensor = get_recent_sensor(db, user_id, sensor_window)
    voice = get_recent_voice(db, user_id, voice_window)

    if sensor is None and voice is None:
        return {
            "predicted_state": "UNKNOWN",
            "confidence": 0.0,
            "depression_risk": "UNKNOWN",
            "recommendation": "No recent data available. Ensure sensors are active.",
            "medical_warning": (
                "This system is not a medical diagnosis tool."
            ),
        }

    sensor = sensor or {
        "temperature": 36.5, "heart_rate": 75.0,
        "activity_score": 50.0, "sleep_score": 70.0,
    }
    voice = voice or {
        "mfcc": [0.0] * 13, "pitch": 150.0, "energy": 0.5,
        "speaking_rate": 3.0, "pause_ratio": 0.15,
    }

    fused = build_fused_vector(sensor, voice)
    result = predictor.predict(fused)

    if store:
        pred = Prediction(
            user_id=user_id,
            timestamp=datetime.utcnow(),
            predicted_state=result["predicted_state"],
            confidence=result["confidence"],
            depression_risk=result["depression_risk"],
            recommendation=result["recommendation"],
            model_version="v1.0",
        )
        db.add(pred)
        db.commit()

    return result
