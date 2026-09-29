"""GET /farm-risk — Agricultural Risk Engine as an endpoint."""
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from services.risk_engine import compute_risk

router = APIRouter()


class FarmRiskResponse(BaseModel):
    risk_score: float
    risk_level: str
    risk_factors: list[str]
    recommended_action: str


@router.get("/farm-risk", response_model=FarmRiskResponse)
def farm_risk(
    disease_probability: float = 0.0,
    confidence: float = 0.0,
    severity: Optional[str] = None,
    temperature_c: float = 30.0,
    humidity_pct: float = 60.0,
    rainfall_mm: float = 0.0,
    crop_stage: str = "Vegetative",
    regional_reports: int = 0,
):
    r = compute_risk(
        disease_probability=disease_probability,
        confidence=confidence,
        severity=severity,
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
        rainfall_mm=rainfall_mm,
        crop_stage=crop_stage,
        regional_reports=regional_reports,
    )
    return FarmRiskResponse(
        risk_score=r["risk_score"],
        risk_level=r["risk_level"],
        risk_factors=r["risk_factors"],
        recommended_action=r["recommended_action"],
    )
