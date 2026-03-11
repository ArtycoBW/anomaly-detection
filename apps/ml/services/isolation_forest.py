import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler
from services.data_loader import INDICATOR_COLUMNS


def detect_isolation_forest(
    df: pd.DataFrame, contamination: float = 0.25
) -> tuple[pd.DataFrame, IsolationForest, np.ndarray]:
    """
    Isolation Forest детекция аномалий.
    Возвращает результаты, обученную модель и скалированные данные
    (модель и данные нужны для SHAP).
    """
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(df[INDICATOR_COLUMNS])

    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
    )
    model.fit(X_scaled)

    # decision_function: чем ниже, тем аномальнее
    raw_scores = model.decision_function(X_scaled)
    predictions = model.predict(X_scaled)  # 1 = нормальный, -1 = аномалия

    # Нормализуем score: переворачиваем, чтобы выше = аномальнее
    anomaly_scores = -raw_scores

    results = pd.DataFrame(
        {
            "method": "isolation_forest",
            "score": anomaly_scores,
            "is_anomaly": predictions == -1,
        },
        index=df.index,
    )

    return results, model, X_scaled
