import numpy as np
import pandas as pd
from scipy.spatial.distance import mahalanobis
from scipy.stats import chi2
from sklearn.covariance import LedoitWolf
from services.data_loader import INDICATOR_COLUMNS


def detect_mahalanobis(
    df: pd.DataFrame, significance: float = 0.05
) -> pd.DataFrame:
    """
    Mahalanobis distance детекция аномалий.
    Вычисляет расстояние каждого региона от центроида.
    Использует Ledoit-Wolf shrinkage для устойчивой оценки ковариационной матрицы
    (критично при n=8 < p=10).

    Тест на аномалию: D² ~ χ²(k), где k = число показателей.
    Аномалия при p-value < significance (по умолчанию 0.05).
    """
    X = df[INDICATOR_COLUMNS].values
    k = X.shape[1]  # число показателей (степени свободы χ²)
    mean = np.mean(X, axis=0)

    # Ledoit-Wolf shrinkage — устойчивая оценка ковариационной матрицы при n < p
    lw = LedoitWolf().fit(X)
    cov_inv = np.linalg.inv(lw.covariance_)

    distances = np.array([
        mahalanobis(X[i], mean, cov_inv) for i in range(X.shape[0])
    ])

    # D² — квадрат расстояния Махаланобиса
    d_squared = distances ** 2

    # χ² тест: p-value = P(χ²(k) > D²)
    p_values = chi2.sf(d_squared, df=k)

    # Аномалия: p-value < significance (статистически значимое отклонение)
    is_anomaly = p_values < significance

    results = pd.DataFrame(
        {
            "method": "mahalanobis",
            "score": distances,
            "d_squared": d_squared,
            "chi2_p_value": p_values,
            "is_anomaly": is_anomaly,
        },
        index=df.index,
    )

    return results
