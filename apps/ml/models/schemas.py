from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class PipelineRequest(BaseModel):
    year: int = 2023


class PipelineResponse(BaseModel):
    status: str
    year: int
    regions_processed: int
    anomalies_found: int


class ShapValue(BaseModel):
    feature: str
    value: float
    impact: str  # "positive" | "negative"


class ShapResponse(BaseModel):
    region_id: str
    year: int
    shap_values: list[ShapValue]
