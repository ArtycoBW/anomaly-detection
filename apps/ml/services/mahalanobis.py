import numpy as np
import pandas as pd
from scipy.spatial.distance import mahalanobis
from scipy.stats import chi2
from services.data_loader import INDICATOR_COLUMNS


def detect_mahalanobis(
    df: pd.DataFrame, significance: float = 0.05
) -> pd.DataFrame:
    """
    Mahalanobis distance детекция аномалий.
    Вычисляет расстояние каждого региона от центроида.
    Аномалия, если расстояние превышает χ²-порог (df=число показателей, p<significance).
    """
    X = df[INDICATOR_COLUMNS].values
    n_features = X.shape[1]

    mean = np.mean(X, axis=0)
    cov = np.cov(X, rowvar=False)

    # Регуляризация ковариационной матрицы (малая выборка — 8 регионов)
    cov_reg = cov + np.eye(n_features) * 1e-6
    cov_inv = np.linalg.inv(cov_reg)

    distances = []
    for i in range(X.shape[0]):
        d = mahalanobis(X[i], mean, cov_inv)
        distances.append(d)

    distances = np.array(distances)

    # χ²-тест: порог при df = число показателей
    threshold = np.sqrt(chi2.ppf(1 - significance, df=n_features))

    results = pd.DataFrame(
        {
            "method": "mahalanobis",
            "score": distances,
            "is_anomaly": distances > threshold,
        },
        index=df.index,
    )

    return results
