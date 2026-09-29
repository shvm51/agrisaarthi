"""GET /today-actions — the home screen feed."""
from fastapi import APIRouter, Depends

from core.security import get_current_user
from schemas.schemas import FarmProfile, TodayAction
from services.intelligence import generate_today_actions

router = APIRouter()


@router.get("/today-actions", response_model=list[TodayAction])
def today_actions(
    farmer_name: str = "Ramesh Patil",
    location_name: str = "Pune, Maharashtra",
    latitude: float = 18.5204,
    longitude: float = 73.8567,
    land_acres: float = 2.5,
    crop: str = "Tomato",
    crop_stage: str = "Fruiting",
    rain_probability_pct: float = 81.0,
    temperature_c: float = 29.0,
    humidity_pct: float = 88.0,
    disease_risk_level: str = "HIGH",
    market_trend: str = "up",
    user: dict = Depends(get_current_user),
):
    farm = FarmProfile(
        farmer_id=user["sub"], farmer_name=farmer_name, location_name=location_name,
        latitude=latitude, longitude=longitude, land_acres=land_acres,
        crop=crop, crop_stage=crop_stage,
    )
    return generate_today_actions(
        farm,
        weather={"rain_probability_pct": rain_probability_pct,
                 "temperature_c": temperature_c, "humidity_pct": humidity_pct},
        disease_risk={"risk_level": disease_risk_level,
                      "reason": "High humidity + elevated fungal risk"},
        market={"trend": market_trend,
                "reason": f"{crop} prices are trending upward in nearby mandis."},
        tasks=[],
    )
