import sys
sys.path.insert(0, 'backend')
sys.path.insert(0, 'ml')

from app.models.database import SessionLocal, engine, Base
from app.models.models import VoiceFeature
import json

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    record = VoiceFeature(
        user_id="user_001",
        timestamp="2026-06-06T03:00:03Z",
        mfcc_json=json.dumps([1.0, 2.0]),
        pitch=150.0,
        energy=0.5,
        speaking_rate=3.0,
        pause_ratio=0.1,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    print("DB insert OK:", record.id)
    print("mfcc_json type:", type(record.mfcc_json), "value:", record.mfcc_json)
except Exception as e:
    print("ERROR:", e)
    import traceback
    traceback.print_exc()
finally:
    db.close()
