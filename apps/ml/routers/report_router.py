from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from services.report_generator import generate_report, generate_report_stream

router = APIRouter()


@router.post("/report")
async def create_report(year: int = Query(default=2023)):
    """Генерация полного аналитического отчёта через Ollama (синхронно)."""
    result = await generate_report(year)
    if error := result.get("error"):
        status_code = 502 if "Ollama" in error else 404
        raise HTTPException(status_code=status_code, detail=error)
    return result


@router.get("/report/stream")
async def stream_report(year: int = Query(default=2023)):
    """Генерация отчёта со стримингом токенов (SSE)."""
    return StreamingResponse(
        generate_report_stream(year),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
