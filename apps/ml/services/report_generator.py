import os
import json
import httpx
from sqlalchemy import text
from db.connection import engine
from services.data_loader import COLUMN_LABELS_RU

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "gemma3:4b")


def _load_anomaly_data(year: int) -> list[dict]:
    """Загружает результаты ensemble-анализа за указанный год."""
    query = text("""
        SELECT ar.region_id, r.name, ar.score, ar.is_anomaly,
               ar.z_scores, ar.shap_values, ar.stability_status
        FROM anomaly_results ar
        JOIN regions r ON r.id = ar.region_id
        WHERE ar.year = :year AND ar.method = 'ensemble'
        ORDER BY ar.score DESC
    """)
    with engine.connect() as conn:
        rows = conn.execute(query, {"year": year}).fetchall()

    results = []
    for row in rows:
        z_scores = row[4]
        shap_values = row[5]
        if isinstance(z_scores, str):
            z_scores = json.loads(z_scores)
        if isinstance(shap_values, str):
            shap_values = json.loads(shap_values)

        results.append({
            "region_id": row[0],
            "name": row[1],
            "score": round(row[2], 3),
            "is_anomaly": row[3],
            "z_scores": z_scores,
            "shap_values": shap_values,
            "stability_status": row[6],
        })
    return results


def _build_prompt(year: int, data: list[dict]) -> str:
    """Формирует промпт для LLM на основе данных анализа."""
    anomalies = [d for d in data if d["is_anomaly"]]
    normals = [d for d in data if not d["is_anomaly"]]

    # Формируем таблицу аномальных регионов
    anomaly_lines = []
    for a in anomalies:
        top_shap = []
        if a["shap_values"]:
            for sv in a["shap_values"][:3]:
                feature_ru = sv.get("feature_ru", sv.get("feature", ""))
                top_shap.append(f"{feature_ru} ({sv['value']:+.3f})")

        top_z = []
        if a["z_scores"]:
            sorted_z = sorted(a["z_scores"].items(), key=lambda x: abs(x[1]), reverse=True)[:3]
            for col, val in sorted_z:
                col_ru = COLUMN_LABELS_RU.get(col, col)
                top_z.append(f"{col_ru}: z={val:+.2f}")

        anomaly_lines.append(
            f"- {a['name']} (ensemble score: {a['score']}, "
            f"стабильность: {a['stability_status']})\n"
            f"  Топ-3 z-score: {'; '.join(top_z)}\n"
            f"  Топ-3 SHAP-драйвера: {'; '.join(top_shap)}"
        )

    normal_names = ", ".join(n["name"] for n in normals)

    prompt = f"""Ты — эксперт-аналитик социально-экономического развития регионов России.
На основе данных ниже напиши аналитический отчёт на русском языке.

## Данные анализа за {year} год

Регионы анализа: 8 субъектов ЮФО и СКФО.
Методы: z-score, Isolation Forest, Mahalanobis distance, Ensemble.

### Аномальные регионы (отклонения от средних):
{chr(10).join(anomaly_lines)}

### Регионы без аномалий:
{normal_names}

## Требования к отчёту:
1. **Краткое резюме** (3–5 предложений): общая картина, сколько аномалий, какие регионы.
2. **Детальный анализ каждого аномального региона**: какие показатели отклоняются, почему это проблема, связь с реальной экономической ситуацией.
3. **Сравнение методов**: какие регионы выявлены всеми методами (устойчивые аномалии), какие — только отдельными.
4. **3 управленческие гипотезы** по устранению устойчивых аномалий с конкретными мерами, целевыми показателями и сроками.
5. **Выводы и рекомендации** (5–7 пунктов): приоритетные регионы, мониторинг, связь с национальными проектами.

Пиши профессионально, но понятно. Используй конкретные цифры из данных."""

    return prompt


async def generate_report(year: int) -> dict:
    """Генерирует аналитический отчёт через Ollama LLM."""
    data = _load_anomaly_data(year)
    if not data:
        return {"error": f"Нет данных анализа за {year} год. Сначала запустите POST /run?year={year}"}

    prompt = _build_prompt(year, data)

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 4096,
                },
            },
        )

    if response.status_code != 200:
        return {"error": f"Ollama вернул ошибку: {response.status_code} — {response.text}"}

    result = response.json()
    report_text = result.get("response", "")

    # Сохраняем отчёт в БД
    _save_report(year, report_text)

    return {
        "year": year,
        "report": report_text,
        "model": MODEL_NAME,
        "anomalies_count": sum(1 for d in data if d["is_anomaly"]),
    }


async def generate_report_stream(year: int):
    """Генерирует отчёт через Ollama со стримингом (SSE)."""
    data = _load_anomaly_data(year)
    if not data:
        yield json.dumps({"error": f"Нет данных анализа за {year} год"})
        return

    prompt = _build_prompt(year, data)
    full_text = []

    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream(
            "POST",
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 4096,
                },
            },
        ) as response:
            async for line in response.aiter_lines():
                if line:
                    chunk = json.loads(line)
                    token = chunk.get("response", "")
                    full_text.append(token)
                    yield token

                    if chunk.get("done", False):
                        break

    # Сохраняем полный отчёт
    report_text = "".join(full_text)
    _save_report(year, report_text)


def _save_report(year: int, content: str):
    """Сохраняет отчёт в таблицу reports (upsert по year)."""
    upsert_sql = text("""
        INSERT INTO reports (year, content) VALUES (:year, :content)
        ON CONFLICT (year) DO UPDATE SET content = EXCLUDED.content, created_at = NOW()
    """)
    with engine.begin() as conn:
        conn.execute(upsert_sql, {"year": year, "content": content})
