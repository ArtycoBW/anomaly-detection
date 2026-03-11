import json
from fastapi import APIRouter, Query
from sqlalchemy import text
from db.connection import engine

router = APIRouter()


@router.get("/results")
async def get_results(year: int = Query(default=2023)):
    """Все результаты анализа за указанный год (для фронтенда)."""
    query = text("""
        SELECT ar.region_id, r.name, r.federal_district,
               ar.method, ar.score, ar.is_anomaly,
               ar.z_scores, ar.shap_values, ar.stability_status
        FROM anomaly_results ar
        JOIN regions r ON r.id = ar.region_id
        WHERE ar.year = :year
        ORDER BY ar.region_id, ar.method
    """)

    with engine.connect() as conn:
        rows = conn.execute(query, {"year": year}).fetchall()

    # Группируем по регионам
    regions = {}
    for row in rows:
        region_id = row[0]
        if region_id not in regions:
            regions[region_id] = {
                "region_id": region_id,
                "name": row[1],
                "federal_district": row[2],
                "methods": {},
            }

        z_scores = row[6]
        shap_values = row[7]
        if isinstance(z_scores, str):
            z_scores = json.loads(z_scores)
        if isinstance(shap_values, str):
            shap_values = json.loads(shap_values)

        regions[region_id]["methods"][row[3]] = {
            "score": round(row[4], 4),
            "is_anomaly": row[5],
            "z_scores": z_scores,
            "shap_values": shap_values,
            "stability_status": row[8],
        }

    return {
        "year": year,
        "regions": list(regions.values()),
        "total": len(regions),
    }
