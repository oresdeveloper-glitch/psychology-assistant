import sys, json
sys.path.insert(0, 'backend')

from datetime import datetime
from app.schemas.schemas import VoiceFeatures
from app.models.database import SessionLocal, engine, Base
from app.models.models import VoiceFeature as VoiceFeatureModel

Base.metadata.create_all(bind=engine)
db = SessionLocal()

payload = {
    "user_id": "user_001",
    "timestamp": "2026-06-06T03:00:03Z",
    "mfcc": [12.4, -3.2, 6.8, 1.5],
    "pitch": 185.2,
    "energy": 0.74,
    "speaking_rate": 3.2,
    "pause_ratio": 0.18,
}

try:
    features = VoiceFeatures(**payload)
    print("Pydantic validation OK")
    print("timestamp type:", type(features.timestamp), "value:", features.timestamp)

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
    print("DB insert OK, id:", record.id)

    from app.schemas.schemas import VoiceFeaturesResponse
    response = VoiceFeaturesResponse.model_validate(record)
    print("Response OK:", response.model_dump())
except Exception as e:
    print("ERROR:", type(e).__name__, e)
    import traceback
    traceback.print_exc()
finally:
    db.close()
