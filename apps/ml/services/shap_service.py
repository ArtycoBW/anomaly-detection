import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import IsolationForest
from services.data_loader import INDICATOR_COLUMNS, COLUMN_LABELS_RU


def compute_shap_values(
    model: IsolationForest, X_scaled: np.ndarray, region_ids: list[str]
) -> dict[str, list[dict]]:
    """
    Вычисляет SHAP values для каждого региона на основе обученного Isolation Forest.
    Возвращает словарь: region_id -> [{feature, value, impact}, ...]
    """
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_scaled)

    result = {}
    for i, region_id in enumerate(region_ids):
        region_shap = []
        for j, col in enumerate(INDICATOR_COLUMNS):
            val = float(shap_values[i, j])
            region_shap.append(
                {
                    "feature": col,
                    "feature_ru": COLUMN_LABELS_RU.get(col, col),
                    "value": round(val, 4),
                    "impact": "positive" if val > 0 else "negative",
                }
            )
        # Сортируем по абсолютному вкладу (самые значимые вверху)
        region_shap.sort(key=lambda x: abs(x["value"]), reverse=True)
        result[region_id] = region_shap

    return result
