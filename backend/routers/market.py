"""GET /market-prices + POST /profitability (deterministic financial math).

Market data is STUB sample data. TODO: wire a real mandi feed (eNAM/Agmarknet).
Never present trends as guaranteed prices.
"""
from fastapi import APIRouter, Depends

from core.security import get_current_user
from schemas.schemas import MarketPrice, ProfitabilityRequest, ProfitabilityResponse

router = APIRouter()

_SAMPLE_PRICES = [
    {"market": "Pune APMC", "price_per_kg": 24.0, "distance_km": 12, "transport_cost_per_kg": 0.6, "trend": "up"},
    {"market": "Nashik APMC", "price_per_kg": 22.5, "distance_km": 180, "transport_cost_per_kg": 1.8, "trend": "stable"},
    {"market": "Mumbai Vashi", "price_per_kg": 26.0, "distance_km": 150, "transport_cost_per_kg": 1.5, "trend": "up"},
]


@router.get("/market-prices", response_model=list[MarketPrice])
def market_prices(crop: str = "Tomato", lat: float = 18.5204, lon: float = 73.8567,
                  user: dict = Depends(get_current_user)):
    return [MarketPrice(**p) for p in _SAMPLE_PRICES]


@router.post("/profitability", response_model=ProfitabilityResponse)
def profitability(req: ProfitabilityRequest, user: dict = Depends(get_current_user)):
    total_cost = (req.seed_cost + req.fertilizer_cost + req.labor_cost
                  + req.irrigation_cost + req.transport_cost + req.storage_cost)
    revenue = round(req.expected_yield_kg * req.market_price_per_kg, 2)
    profit = round(revenue - total_cost, 2)
    per_acre = round(profit / req.land_acres, 2) if req.land_acres else 0.0
    return ProfitabilityResponse(
        total_cost=round(total_cost, 2), expected_revenue=revenue,
        estimated_profit=profit, profit_per_acre=per_acre,
    )
