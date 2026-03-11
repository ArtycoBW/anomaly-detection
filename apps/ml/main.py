from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.pipeline import router as pipeline_router
from routers.shap_router import router as shap_router

app = FastAPI(
    title="iData ML Service",
    description="Сервис детекции аномалий в социально-экономических показателях",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline_router)
app.include_router(shap_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml"}
