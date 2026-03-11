import pandas as pd
from services.data_loader import load_indicators
from services.zscore import detect_zscore
from services.isolation_forest import detect_isolation_forest
from services.mahalanobis import detect_mahalanobis
from services.ensemble import compute_ensemble


def analyze_stability(years: list[int] = [2022, 2023, 2024]) -> dict[str, str]:
    """
    Анализ стабильности аномалий за несколько лет.
    Для каждого региона определяет:
    - 'stable' — аномалия во всех годах
    - 'temporary' — аномалия в 1–2 годах
    - 'normal' — нет аномалий ни в одном году
    """
    anomaly_counts: dict[str, int] = {}

    for year in years:
        df = load_indicators(year)
        if df.empty:
            continue

        z_results = detect_zscore(df)
        if_results, _, _ = detect_isolation_forest(df)
        m_results = detect_mahalanobis(df)
        ens_results = compute_ensemble(z_results, if_results, m_results)

        for region_id in ens_results.index:
            if region_id not in anomaly_counts:
                anomaly_counts[region_id] = 0
            if ens_results.loc[region_id, "is_anomaly"]:
                anomaly_counts[region_id] += 1

    stability = {}
    for region_id, count in anomaly_counts.items():
        if count == len(years):
            stability[region_id] = "stable"
        elif count > 0:
            stability[region_id] = "temporary"
        else:
            stability[region_id] = "normal"

    return stability
