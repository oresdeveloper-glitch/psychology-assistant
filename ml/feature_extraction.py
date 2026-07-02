import numpy as np
import librosa
from typing import Tuple, Optional


def extract_mfcc(
    audio_path: str, n_mfcc: int = 13
) -> Tuple[np.ndarray, float, float, float, float]:
    y, sr = librosa.load(audio_path, sr=16000)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    mfcc_mean = np.mean(mfcc, axis=1)
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_values = pitches[pitches > 0]
    pitch = float(np.mean(pitch_values)) if len(pitch_values) > 0 else 150.0
    energy = float(np.mean(librosa.feature.rms(y=y)))
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
    speaking_rate = max(0.5, len(onset_frames) / (len(y) / sr) * 2)
    pause_ratio = 0.0
    return mfcc_mean, pitch, energy, speaking_rate, pause_ratio


def simulate_sensor_data(n_samples: int = 1000) -> np.ndarray:
    np.random.seed(42)
    data = np.zeros((n_samples, 4))
    data[:, 0] = np.random.normal(36.5, 0.5, n_samples)
    data[:, 1] = np.random.normal(75, 15, n_samples)
    data[:, 2] = np.random.uniform(20, 100, n_samples)
    data[:, 3] = np.random.uniform(30, 100, n_samples)
    return data
