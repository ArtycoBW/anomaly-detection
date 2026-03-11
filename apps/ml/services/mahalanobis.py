import numpy as np
import pandas as pd
from scipy.spatial.distance import mahalanobis
from sklearn.covariance import LedoitWolf
from services.data_loader import INDICATOR_COLUMNS


def detect_mahalanobis(
    df: pd.DataFrame, contamination: float = 0.25
) -> pd.DataFrame:
    """
    Mahalanobis distance детекция аномалий.
    Вычисляет расстояние каждого региона от центроида.
    Использует Ledoit-Wolf shrinkage для устойчивой оценки ковариационной матрицы
    (критично при n=8 < p=10).
    Порог: top `contamination` доля регионов с наибольшим расстоянием.
    """
    X = df[INDICATOR_COLUMNS].values
    mean = np.mean(X, axis=0)

    # Ledoit-Wolf shrinkage — устойчивая оценка ковариационной матрицы при n < p
    lw = LedoitWolf().fit(X)
    cov_inv = np.linalg.inv(lw.covariance_)

    distances = np.array([
        mahalanobis(X[i], mean, cov_inv) for i in range(X.shape[0])
    ])

    # Порог: верхний квантиль (contamination % самых далёких = аномалии)
    threshold = np.percentile(distances, 100 * (1 - contamination))

    results = pd.DataFrame(
        {
            "method": "mahalanobis",
            "score": distances,
            "is_anomaly": distances > threshold,
        },
        index=df.index,
    )

    return results
