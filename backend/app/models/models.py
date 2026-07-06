from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(String(50), server_default=func.now())


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    device_name = Column(String(255), nullable=False)
    device_type = Column(String(100), nullable=False)
    status = Column(String(50), default="active")
    created_at = Column(String(50), server_default=func.now())


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    device_id = Column(String(100), nullable=False)
    timestamp = Column(String(50), nullable=False)
    temperature = Column(Float, nullable=False)
    heart_rate = Column(Float, nullable=False)
    activity_score = Column(Float, nullable=False)
    sleep_score = Column(Float, nullable=False)


class VoiceFeature(Base):
    __tablename__ = "voice_features"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    timestamp = Column(String(50), nullable=False)
    mfcc_json = Column(Text, nullable=False)
    pitch = Column(Float, nullable=False)
    energy = Column(Float, nullable=False)
    speaking_rate = Column(Float, nullable=False)
    pause_ratio = Column(Float, nullable=False)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    timestamp = Column(String(50), nullable=False)
    predicted_state = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    depression_risk = Column(String(50), nullable=False)
    recommendation = Column(Text, nullable=False)
    model_version = Column(String(50), default="v1.0")
