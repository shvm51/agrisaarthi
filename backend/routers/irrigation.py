"""POST /irrigation-advice — IRRIGATE / WAIT / CAUTION."""
from fastapi import APIRouter, Depends

from core.security import get_current_user
from schemas.schemas import IrrigationRequest, IrrigationResponse

router = APIRouter()

# Typical soil-moisture comfort bands (% volumetric) per crop.
CROP_MOISTURE_NEED = {"Tomato": 45, "Soybean": 40, "Maize": 42, "Cotton": 38, "Wheat": 40, "Groundnut": 35}
DEFAULT_NEED = 42


@router.post("/irrigation-advice", response_model=IrrigationResponse)
def irrigation_advice(req: IrrigationRequest, user: dict = Depends(get_current_user)):
    need = CROP_MOISTURE_NEED.get(req.farm.crop, DEFAULT_NEED)
    source = "sensor" if req.soil_moisture_pct is not None else "weather-estimated"
    moisture = req.soil_moisture_pct if req.soil_moisture_pct is not None else 42.0

    if req.rain_probability_pct >= 60:
        rec, reason = "WAIT", (
            f"Rain probability is {req.rain_probability_pct}%. "
            "Expected rainfall may satisfy near-term water requirements."
        )
    elif moisture < need - 8:
        rec, reason = "IRRIGATE", (
            f"Soil moisture ({moisture}%) is below the {need}% need for "
            f"{req.farm.crop} at {req.farm.crop_stage} stage."
        )
    elif moisture < need:
        rec, reason = "CAUTION", (
            f"Soil moisture ({moisture}%) is near the lower band for {req.farm.crop}. "
            "Recheck in 24 hours; irrigate if it drops further."
        )
    else:
        rec, reason = "WAIT", (
            f"Soil moisture ({moisture}%) meets {req.farm.crop} needs at {req.farm.crop_stage} stage."
        )

    return IrrigationResponse(
        recommendation=rec, reason=reason, data_source=source,
        soil_moisture_pct=req.soil_moisture_pct,
        crop_water_need_note=f"{req.farm.crop} at {req.farm.crop_stage} stage prefers ~{need}% soil moisture.",
    )
