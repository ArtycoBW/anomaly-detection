import json
from sqlalchemy import text
from db.connection import engine


def save_anomaly_results(
    year: int,
    results_list: list[dict],
) -> int:
    """
    Сохраняет результаты детекции аномалий в таблицу anomaly_results.
    Использует upsert (ON CONFLICT UPDATE).
    Возвращает количество сохранённых записей.
    """
    upsert_sql = text("""
        INSERT INTO anomaly_results (region_id, year, method, score, is_anomaly, z_scores, shap_values, stability_status)
        VALUES (:region_id, :year, :method, :score, :is_anomaly, :z_scores, :shap_values, :stability_status)
        ON CONFLICT (region_id, year, method)
        DO UPDATE SET
            score = EXCLUDED.score,
            is_anomaly = EXCLUDED.is_anomaly,
            z_scores = EXCLUDED.z_scores,
            shap_values = EXCLUDED.shap_values,
            stability_status = EXCLUDED.stability_status
    """)

    count = 0
    with engine.begin() as conn:
        for r in results_list:
            conn.execute(
                upsert_sql,
                {
                    "region_id": r["region_id"],
                    "year": year,
                    "method": r["method"],
                    "score": float(r["score"]),
                    "is_anomaly": bool(r["is_anomaly"]),
                    "z_scores": json.dumps(r.get("z_scores")) if r.get("z_scores") else None,
                    "shap_values": json.dumps(r.get("shap_values")) if r.get("shap_values") else None,
                    "stability_status": r.get("stability_status"),
                },
            )
            count += 1

    return count
