import json
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional
from datetime import datetime


class SensorReading(BaseModel):
    user_id: str
    device_id: str
    timestamp: datetime
    temperature: float = Field(..., ge=30.0, le=45.0)
    heart_rate: float = Field(..., ge=30.0, le=220.0)
    activity_score: float = Field(..., ge=0.0, le=100.0)
    sleep_score: float = Field(..., ge=0.0, le=100.0)


class VoiceFeatures(BaseModel):
    user_id: str
    timestamp: datetime
    mfcc: List[float] = Field(..., min_length=1, max_length=40)
    pitch: float = Field(..., ge=50.0, le=500.0)
    energy: float = Field(..., ge=0.0, le=1.0)
    speaking_rate: float = Field(..., ge=0.5, le=10.0)
    pause_ratio: float = Field(..., ge=0.0, le=1.0)


class FusionRequest(BaseModel):
    user_id: str
    sensor_window_seconds: int = Field(default=30, ge=5, le=300)
    voice_window_seconds: int = Field(default=10, ge=5, le=120)


class PredictionResponse(BaseModel):
    predicted_state: str
    confidence: float
    depression_risk: str
    recommendation: str
    medical_warning: str = (
        "This system is not a medical diagnosis tool. "
        "It provides wellness screening only. "
        "Consult a healthcare professional for medical advice."
    )


class SensorReadingResponse(SensorReading):
    id: int

    class Config:
        from_attributes = True


class VoiceFeaturesResponse(BaseModel):
    id: int
    user_id: str
    timestamp: datetime
    mfcc: List[float]
    pitch: float
    energy: float
    speaking_rate: float
    pause_ratio: float

    @model_validator(mode="before")
    @classmethod
    def map_mfcc_json(cls, data):
        if hasattr(data, "mfcc_json"):
            raw = data.mfcc_json
            if isinstance(raw, str):
                data.mfcc = json.loads(raw)
            elif isinstance(raw, list):
                data.mfcc = raw
            else:
                data.mfcc = []
        return data

    class Config:
        from_attributes = True


class PredictionHistory(BaseModel):
    id: int
    user_id: str
    timestamp: datetime
    predicted_state: str
    confidence: float
    depression_risk: str
    recommendation: str
    model_version: str

    class Config:
        from_attributes = True
