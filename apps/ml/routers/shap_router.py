from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from db.connection import engine
import json

router = APIRouter()


@router.get("/shap/{region_id}")
async def get_shap_values(region_id: str, year: int = Query(default=2023)):
    """Получить SHAP values для конкретного региона."""
    query = text("""
        SELECT shap_values, z_scores, score, is_anomaly, stability_status
        FROM anomaly_results
        WHERE region_id = :region_id AND year = :year AND method = 'ensemble'
    """)

    with engine.connect() as conn:
        row = conn.execute(query, {"region_id": region_id, "year": year}).fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Результаты для региона {region_id} за {year} год не найдены. Запустите пайплайн: POST /run?year={year}",
        )

    shap_values = row[0]
    z_scores = row[1]

    # shap_values и z_scores хранятся как JSON
    if isinstance(shap_values, str):
        shap_values = json.loads(shap_values)
    if isinstance(z_scores, str):
        z_scores = json.loads(z_scores)

    return {
        "region_id": region_id,
        "year": year,
        "ensemble_score": row[2],
        "is_anomaly": row[3],
        "stability_status": row[4],
        "shap_values": shap_values,
        "z_scores": z_scores,
    }
