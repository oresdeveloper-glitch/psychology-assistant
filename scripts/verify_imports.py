import sys
sys.path.insert(0, 'backend')

from app.ml.model import predictor
print('Model loaded:', predictor.model is not None)

from app.ml.feature_fusion import build_fused_vector
print('Feature fusion: OK')

from app.schemas.schemas import SensorReading, VoiceFeatures, FusionRequest
print('Schemas: OK')

from app.services.prediction_service import predict_state
print('Prediction service: OK')

sensor = {'temperature': 37.0, 'heart_rate': 92, 'activity_score': 76, 'sleep_score': 68}
voice = {'mfcc': [12.4, -3.2, 6.8, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         'pitch': 185.2, 'energy': 0.74, 'speaking_rate': 3.2, 'pause_ratio': 0.18}

r = predictor.predict(build_fused_vector(sensor, voice))
print('Prediction:', r['predicted_state'], f"{r['confidence']:.2%}", r['depression_risk'])
print('All modules verified successfully')
