import pandas as pd
from sklearn.preprocessing import MinMaxScaler


def compute_ensemble(
    zscore_results: pd.DataFrame,
    if_results: pd.DataFrame,
    maha_results: pd.DataFrame,
    weights: tuple[float, float, float] = (0.3, 0.4, 0.3),
) -> pd.DataFrame:
    """
    Ensemble score: взвешенная сумма нормализованных scores трёх методов.
    weights: (z-score, isolation_forest, mahalanobis)
    """
    scaler = MinMaxScaler()

    scores = pd.DataFrame(
        {
            "zscore": zscore_results["score"].values,
            "if": if_results["score"].values,
            "maha": maha_results["score"].values,
        },
        index=zscore_results.index,
    )

    # Нормализуем каждый score в [0, 1]
    scores_normalized = pd.DataFrame(
        scaler.fit_transform(scores),
        index=scores.index,
        columns=scores.columns,
    )

    w_z, w_if, w_m = weights
    ensemble_score = (
        w_z * scores_normalized["zscore"]
        + w_if * scores_normalized["if"]
        + w_m * scores_normalized["maha"]
    )

    # Аномалия по ensemble: если 2+ метода считают аномалией
    anomaly_votes = (
        zscore_results["is_anomaly"].astype(int)
        + if_results["is_anomaly"].astype(int)
        + maha_results["is_anomaly"].astype(int)
    )

    results = pd.DataFrame(
        {
            "method": "ensemble",
            "score": ensemble_score,
            "is_anomaly": anomaly_votes >= 2,
        },
        index=zscore_results.index,
    )

    return results
