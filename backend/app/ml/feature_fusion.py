import numpy as np
from typing import List, Dict, Any


def build_fused_vector(
    sensor: Dict[str, Any],
    voice: Dict[str, Any]
) -> np.ndarray:
    mfcc_features = voice.get("mfcc", [])
    mfcc_padded = pad_mfcc(mfcc_features, target=13)

    fused = [
        sensor.get("temperature", 36.5),
        sensor.get("heart_rate", 75.0),
        sensor.get("activity_score", 50.0),
        sensor.get("sleep_score", 70.0),
    ]
    fused.extend(mfcc_padded)
    fused.extend([
        voice.get("pitch", 150.0),
        voice.get("energy", 0.5),
        voice.get("speaking_rate", 3.0),
        voice.get("pause_ratio", 0.15),
    ])
    return np.array(fused, dtype=np.float32).reshape(1, -1)


def pad_mfcc(mfcc: List[float], target: int = 13) -> List[float]:
    if len(mfcc) >= target:
        return mfcc[:target]
    return mfcc + [0.0] * (target - len(mfcc))


FEATURE_NAMES = [
    "temperature", "heart_rate", "activity_score", "sleep_score",
    "mfcc_1", "mfcc_2", "mfcc_3", "mfcc_4", "mfcc_5",
    "mfcc_6", "mfcc_7", "mfcc_8", "mfcc_9", "mfcc_10",
    "mfcc_11", "mfcc_12", "mfcc_13",
    "pitch", "energy", "speaking_rate", "pause_ratio",
]

STATES = ["CALM", "STRESS", "ANXIETY", "FATIGUE"]

DEPRESSION_RISK_MAP = {
    "CALM": "LOW_RISK",
    "STRESS": "MODERATE_RISK",
    "ANXIETY": "HIGH_RISK",
    "FATIGUE": "MODERATE_RISK",
}

RECOMMENDATIONS = {
    "CALM": "Your state appears stable. Continue your current routine.",
    "STRESS": "Take a short breathing break and continue monitoring. Consider light physical activity.",
    "ANXIETY": "Practice grounding exercises. Limit caffeine and screen time. Seek social support.",
    "FATIGUE": "Prioritize rest tonight. Ensure 7-9 hours of sleep. Avoid overexertion.",
}
