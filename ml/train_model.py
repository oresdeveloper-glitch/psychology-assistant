import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.preprocessing import StandardScaler

N_FEATURES = 21
N_SAMPLES = 2000
STATES = ["CALM", "STRESS", "ANXIETY", "FATIGUE"]
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")


def generate_training_data() -> tuple:
    np.random.seed(42)
    X = np.zeros((N_SAMPLES, N_FEATURES))
    y = np.zeros(N_SAMPLES, dtype=int)

    for i in range(N_SAMPLES):
        state = np.random.choice(len(STATES), p=[0.3, 0.3, 0.2, 0.2])
        y[i] = state

        if state == 0:
            X[i] = [
                np.random.normal(36.5, 0.3),
                np.random.normal(72, 5),
                np.random.uniform(60, 100),
                np.random.uniform(70, 100),
                *np.random.normal(-2, 1, 13),
                np.random.normal(160, 20),
                np.random.uniform(0.3, 0.6),
                np.random.uniform(2.5, 4.0),
                np.random.uniform(0.05, 0.15),
            ]
        elif state == 1:
            X[i] = [
                np.random.normal(37.0, 0.4),
                np.random.normal(95, 10),
                np.random.uniform(30, 60),
                np.random.uniform(30, 50),
                *np.random.normal(5, 2, 13),
                np.random.normal(200, 30),
                np.random.uniform(0.6, 0.9),
                np.random.uniform(4.0, 6.0),
                np.random.uniform(0.1, 0.25),
            ]
        elif state == 2:
            X[i] = [
                np.random.normal(37.2, 0.5),
                np.random.normal(105, 15),
                np.random.uniform(20, 50),
                np.random.uniform(20, 40),
                *np.random.normal(8, 3, 13),
                np.random.normal(220, 40),
                np.random.uniform(0.7, 1.0),
                np.random.uniform(5.0, 8.0),
                np.random.uniform(0.05, 0.15),
            ]
        else:
            X[i] = [
                np.random.normal(36.0, 0.4),
                np.random.normal(60, 8),
                np.random.uniform(10, 30),
                np.random.uniform(20, 50),
                *np.random.normal(-5, 2, 13),
                np.random.normal(120, 20),
                np.random.uniform(0.1, 0.3),
                np.random.uniform(1.0, 2.5),
                np.random.uniform(0.2, 0.4),
            ]

    return X, y


def train():
    os.makedirs(MODEL_DIR, exist_ok=True)
    print("Generating training data...")
    X, y = generate_training_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=100, max_depth=15, random_state=42, class_weight="balanced"
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    f1 = f1_score(y_test, y_pred, average="weighted")
    print(f"\nWeighted F1 Score: {f1:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=STATES))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print(f"\nFeature importances:")
    for i, imp in enumerate(model.feature_importances_):
        print(f"  Feature {i}: {imp:.4f}")

    model_path = os.path.join(MODEL_DIR, "khairaty_model.pkl")
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"\nModel saved to: {model_path}")
    print(f"Scaler saved to: {scaler_path}")


if __name__ == "__main__":
    train()
