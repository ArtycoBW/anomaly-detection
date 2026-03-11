from fastapi import APIRouter, HTTPException
from services.data_loader import load_indicators
from services.zscore import detect_zscore
from services.isolation_forest import detect_isolation_forest
from services.mahalanobis import detect_mahalanobis
from services.ensemble import compute_ensemble
from services.shap_service import compute_shap_values
from services.stability import analyze_stability
from db.writer import save_anomaly_results
from models.schemas import PipelineResponse

router = APIRouter()


@router.post("/run", response_model=PipelineResponse)
async def run_pipeline(year: int = 2023):
    """Запуск полного ML пайплайна детекции аномалий."""

    # 1. Загрузка данных
    df = load_indicators(year)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"Нет данных за {year} год")

    region_ids = list(df.index)

    # 2. Три метода детекции
    z_results = detect_zscore(df)
    if_results, if_model, X_scaled = detect_isolation_forest(df)
    m_results = detect_mahalanobis(df)

    # 3. Ensemble
    ens_results = compute_ensemble(z_results, if_results, m_results)

    # 4. SHAP
    shap_values = compute_shap_values(if_model, X_scaled, region_ids)

    # 5. Stability (анализ по всем доступным годам)
    stability = analyze_stability()

    # 6. Собираем все результаты для записи в БД
    all_results = []

    for region_id in region_ids:
        # Z-score
        all_results.append({
            "region_id": region_id,
            "method": "zscore",
            "score": z_results.loc[region_id, "score"],
            "is_anomaly": z_results.loc[region_id, "is_anomaly"],
            "z_scores": z_results.loc[region_id, "z_scores"],
            "stability_status": stability.get(region_id, "normal"),
        })

        # Isolation Forest
        all_results.append({
            "region_id": region_id,
            "method": "isolation_forest",
            "score": if_results.loc[region_id, "score"],
            "is_anomaly": if_results.loc[region_id, "is_anomaly"],
            "shap_values": shap_values.get(region_id),
            "stability_status": stability.get(region_id, "normal"),
        })

        # Mahalanobis
        all_results.append({
            "region_id": region_id,
            "method": "mahalanobis",
            "score": m_results.loc[region_id, "score"],
            "is_anomaly": m_results.loc[region_id, "is_anomaly"],
            "stability_status": stability.get(region_id, "normal"),
        })

        # Ensemble
        all_results.append({
            "region_id": region_id,
            "method": "ensemble",
            "score": ens_results.loc[region_id, "score"],
            "is_anomaly": ens_results.loc[region_id, "is_anomaly"],
            "shap_values": shap_values.get(region_id),
            "z_scores": z_results.loc[region_id, "z_scores"],
            "stability_status": stability.get(region_id, "normal"),
        })

    # 7. Сохранение в БД
    saved_count = save_anomaly_results(year, all_results)

    anomalies_found = int(ens_results["is_anomaly"].sum())

    return PipelineResponse(
        status="success",
        year=year,
        regions_processed=len(region_ids),
        anomalies_found=anomalies_found,
    )
