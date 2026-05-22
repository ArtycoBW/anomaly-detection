import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from services.data_loader import INDICATOR_COLUMNS


def detect_zscore(df: pd.DataFrame, threshold: float = 2.5) -> pd.DataFrame:
    """
    Z-score детекция аномалий.
    Для каждого показателя вычисляет z-score.
    Регион считается аномальным, если хотя бы один |z| > threshold.
    Порог 2.5 соответствует ТЗ.
    """
    scaler = StandardScaler()
    z_scores = pd.DataFrame(
        scaler.fit_transform(df[INDICATOR_COLUMNS]),
        index=df.index,
        columns=INDICATOR_COLUMNS,
    )

    # Максимальный |z| по всем показателям — это anomaly score
    max_abs_z = z_scores.abs().max(axis=1)

    results = pd.DataFrame(
        {
            "method": "zscore",
            "score": max_abs_z,
            "is_anomaly": max_abs_z > threshold,
        },
        index=df.index,
    )

    # Сохраняем все z-scores как словарь для каждого региона
    results["z_scores"] = z_scores.apply(
        lambda row: {col: round(val, 3) for col, val in row.items()}, axis=1
    )

    return results
