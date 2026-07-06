import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.models import SensorReading as SensorReadingModel
from app.models.models import VoiceFeature as VoiceFeatureModel
from app.models.models import Prediction as PredictionModel
from app.schemas.schemas import (
    SensorReading,
    SensorReadingResponse,
    VoiceFeatures,
    VoiceFeaturesResponse,
    FusionRequest,
    PredictionResponse,
    PredictionHistory,
)
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1")


@router.post("/sensor-readings", response_model=SensorReadingResponse)
def create_sensor_reading(reading: SensorReading, db: Session = Depends(get_db)):
    record = SensorReadingModel(
        user_id=reading.user_id,
        device_id=reading.device_id,
        timestamp=reading.timestamp,
        temperature=reading.temperature,
        heart_rate=reading.heart_rate,
        activity_score=reading.activity_score,
        sleep_score=reading.sleep_score,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("Sensor reading stored for user %s", reading.user_id)
    return record


@router.post("/voice-features", response_model=VoiceFeaturesResponse)
def create_voice_features(features: VoiceFeatures, db: Session = Depends(get_db)):
    try:
        mfcc_str = json.dumps(features.mfcc)
        record = VoiceFeatureModel(
            user_id=features.user_id,
            timestamp=str(features.timestamp),
            mfcc_json=mfcc_str,
            pitch=features.pitch,
            energy=features.energy,
            speaking_rate=features.speaking_rate,
            pause_ratio=features.pause_ratio,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info("Voice features stored for user %s", features.user_id)
        return record
    except Exception as e:
        logger.error("Voice features error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-state", response_model=PredictionResponse)
def get_prediction(req: FusionRequest, db: Session = Depends(get_db)):
    try:
        from app.services.prediction_service import predict_state
        result = predict_state(
            db,
            user_id=req.user_id,
            sensor_window=req.sensor_window_seconds,
            voice_window=req.voice_window_seconds,
        )
    except Exception:
        logger.warning("ML prediction unavailable, returning unknown")
        result = {
            "predicted_state": "UNKNOWN",
            "confidence": 0.0,
            "depression_risk": "UNKNOWN",
            "recommendation": "ML prediction service unavailable. Using live recommendations instead.",
            "medical_warning": "This system is not a medical diagnosis tool.",
        }
    return result


@router.get("/predictions/{user_id}", response_model=List[PredictionHistory])
def get_prediction_history(
    user_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    records = (
        db.query(PredictionModel)
        .filter(PredictionModel.user_id == user_id)
        .order_by(PredictionModel.timestamp.desc())
        .limit(limit)
        .all()
    )
    return records


@router.get("/sensor-readings/{user_id}", response_model=List[SensorReadingResponse])
def get_sensor_history(
    user_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    records = (
        db.query(SensorReadingModel)
        .filter(SensorReadingModel.user_id == user_id)
        .order_by(SensorReadingModel.timestamp.desc())
        .limit(limit)
        .all()
    )
    return records


@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "khairaty-api", "version": "1.0.0"}


import app.services.live_mqtt as mqtt_svc

@router.get("/mqtt/latest")
def get_mqtt_latest():
    latest = mqtt_svc.get_latest()
    result = dict(latest) if latest else {}
    result["_broker_connected"] = mqtt_svc.is_connected()
    return result

@router.get("/mqtt/history")
def get_mqtt_history():
    return list(mqtt_svc.history)


from fastapi.responses import StreamingResponse

@router.get("/mqtt/stream")
async def mqtt_stream():
    return StreamingResponse(mqtt_svc.stream_latest(), media_type="text/event-stream")


@router.get("/recommendations/live")
def get_live_recommendations():
    latest = mqtt_svc.get_latest()
    if not latest or latest.get("_no_data"):
        return {
            "predicted_state": "UNKNOWN",
            "confidence": 0.0,
            "depression_risk": "UNKNOWN",
            "recommendation": "Waiting for sensor data. Please ensure your ESP32 is running and connected.",
            "medical_warning": "This system is not a medical diagnosis tool. It provides wellness screening only. Consult a healthcare professional for medical advice.",
            "sensor_data": None,
        }

    temp = latest.get("temperature")
    hr = latest.get("heartRate")
    sleep = latest.get("sleepScore")
    stress = latest.get("stressScore")
    status = latest.get("currentStatus", "UNKNOWN")
    risk = latest.get("depressionRisk", "UNKNOWN")

    recommendations = []
    warnings = []

    if hr is not None:
        if hr > 110:
            recommendations.append("Your heart rate is very high. Find a quiet space and practice slow, deep breathing for 5 minutes - inhale 4s, hold 7s, exhale 8s.")
            warnings.append("Heart rate above 110 bpm - consider consulting a healthcare professional if this persists.")
        elif hr > 95:
            recommendations.append("Your heart rate is elevated. Try a 3-minute grounding exercise: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.")
        elif hr < 75:
            recommendations.append("Your heart rate is in a healthy range. Maintain your current routine with light activity.")
        else:
            recommendations.append("Your heart rate is normal. A short walk or stretching can help maintain your balance.")

    if temp is not None:
        if temp > 37.5:
            recommendations.append("Your temperature is above normal. Rest and hydrate. Monitor for other symptoms.")
            warnings.append("Elevated temperature detected - if accompanied by other symptoms, seek medical advice.")
        elif temp < 36.0:
            recommendations.append("Your temperature is slightly low. Stay warm and ensure you're eating well.")
        else:
            recommendations.append("Your body temperature is normal.")

    if stress is not None:
        if stress >= 70:
            recommendations.append("Stress level is high. Take a 10-minute screen break. Try progressive muscle relaxation: tense each muscle group for 5s, then release.")
            warnings.append("High stress score detected - prolonged stress can affect sleep and cardiovascular health.")
        elif stress >= 40:
            recommendations.append("You're experiencing moderate stress. A 15-minute walk or listening to calming music can help bring it down.")
        else:
            recommendations.append("Your stress is well-managed. Keep up your healthy coping strategies.")

    if sleep is not None:
        if sleep < 40:
            recommendations.append("Sleep quality is poor. Aim for 7-9 hours. Avoid screens 1 hour before bed. Try a warm bath or chamomile tea before sleep.")
            warnings.append("Low sleep score - chronic sleep deprivation increases risk of depression and anxiety.")
        elif sleep < 70:
            recommendations.append("Sleep could be improved. Consider setting a consistent bedtime and reducing caffeine after 2 PM.")
        else:
            recommendations.append("Sleep quality looks good! Quality sleep is essential for emotional resilience.")

    if risk == "HIGH RISK":
        warnings.append("Depression risk elevated. Please reach out to a mental health professional for support. You are not alone.")

    recommendation_text = " ".join(recommendations[:3]) if recommendations else "Continue monitoring. Your data is being analyzed for personalized recommendations."
    warning_text = " ".join(warnings[:2]) if warnings else ""

    predicted_state = status if status != "UNKNOWN" else "MODERATE"
    confidence = 0.85 if predicted_state != "UNKNOWN" else 0.0

    return {
        "predicted_state": predicted_state,
        "confidence": confidence,
        "depression_risk": risk,
        "recommendation": recommendation_text,
        "medical_warning": warning_text or "This system is not a medical diagnosis tool. It provides wellness screening only. Consult a healthcare professional for medical advice.",
        "sensor_data": {
            "temperature": temp,
            "heartRate": hr,
            "sleepScore": sleep,
            "stressScore": stress,
            "currentStatus": status,
            "depressionRisk": risk,
            "_received_at": latest.get("_received_at"),
        },
    }


from pydantic import BaseModel

class Esp32SensorData(BaseModel):
    # Accept camelCase from some firmware versions...
    temperature: float | None = None
    heartRate: int | None = None
    sleepScore: int | None = None
    stressScore: int | None = None
    currentStatus: str | None = None
    depressionRisk: str | None = None

    # ...and snake_case from others (tolerant ingest)
    heart_rate: int | None = None
    sleep_score: int | None = None
    stress_score: int | None = None
    # allow aliases for future payloads
    depression_risk: str | None = None


@router.post("/sensor/ingest")
def ingest_sensor_data(data: Esp32SensorData):
    from datetime import datetime

    raw = data.model_dump(exclude_none=True)

    # Normalize keys to the frontend expectation (camelCase)
    normalized = {
        "temperature": raw.get("temperature"),
        "heartRate": raw.get("heartRate") if "heartRate" in raw else raw.get("heart_rate"),
        "sleepScore": raw.get("sleepScore") if "sleepScore" in raw else raw.get("sleep_score"),
        "stressScore": raw.get("stressScore") if "stressScore" in raw else raw.get("stress_score"),
        "currentStatus": raw.get("currentStatus"),
        "depressionRisk": raw.get("depressionRisk")
        if "depressionRisk" in raw
        else raw.get("depression_risk"),
    }

    # Basic validation: require at least temperature and heartRate to avoid pushing empty state
    if normalized["temperature"] is None or normalized["heartRate"] is None:
        raise HTTPException(status_code=422, detail="Missing required sensor fields: temperature and heartRate")

    normalized["_received_at"] = datetime.utcnow().isoformat()
    mqtt_svc.push_data(normalized)
    return {"status": "ok", "received": normalized}

