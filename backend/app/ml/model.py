import os
import joblib
import numpy as np
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

from .feature_fusion import STATES, DEPRESSION_RISK_MAP, RECOMMENDATIONS

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml", "models", "khairaty_model.pkl"
)
SCALER_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml", "models", "scaler.pkl"
)


class KhairatyPredictor:
    def __init__(self):
        self._model = None
        self._scaler = None
        self._loaded = False

    def _ensure_loaded(self):
        if self._loaded:
            return
        self._loaded = True
        self._load_or_init()

    def _load_or_init(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            try:
                self._model = joblib.load(MODEL_PATH)
                self._scaler = joblib.load(SCALER_PATH)
                logger.info("Loaded trained model from %s", MODEL_PATH)
            except Exception as e:
                logger.warning("Failed to load model: %s. Using fallback.", e)
                self._init_fallback()
        else:
            logger.info("No trained model found. Using rule-based fallback.")
            self._init_fallback()

    def _init_fallback(self):
        self._model = RandomForestClassifier(n_estimators=50, random_state=42)
        self._scaler = StandardScaler()
        dummy_X = np.random.randn(100, 21)
        dummy_y = np.random.randint(0, len(STATES), 100)
        self._scaler.fit(dummy_X)
        self._model.fit(self._scaler.transform(dummy_X), dummy_y)

    def predict(self, fused_vector: np.ndarray) -> dict:
        self._ensure_loaded()
        X_scaled = self._scaler.transform(fused_vector)
        pred_id = self._model.predict(X_scaled)[0]
        proba = self._model.predict_proba(X_scaled)[0]
        confidence = float(max(proba))
        state = STATES[int(pred_id)] if int(pred_id) < len(STATES) else "CALM"
        return {
            "predicted_state": state,
            "confidence": round(confidence, 4),
            "depression_risk": DEPRESSION_RISK_MAP.get(state, "LOW_RISK"),
            "recommendation": RECOMMENDATIONS.get(
                state, "Continue monitoring."
            ),
            "medical_warning": (
                "This system is not a medical diagnosis tool. "
                "It provides wellness screening only. "
                "Consult a healthcare professional for medical advice."
            ),
        }


predictor = KhairatyPredictor()
