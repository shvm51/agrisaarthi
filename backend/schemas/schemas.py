"""Pydantic schemas for the AgriSaarthi API."""
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# ---------- Shared ----------

class FarmProfile(BaseModel):
    farmer_id: str
    farmer_name: str = "Farmer"
    location_name: str = "Pune, Maharashtra"
    latitude: float = 18.5204
    longitude: float = 73.8567
    land_acres: float = 2.5
    soil_type: str = "Loamy"
    water_availability: Literal["LOW", "MEDIUM", "HIGH"] = "MEDIUM"
    crop: str = "Tomato"
    crop_stage: Literal["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"] = "Fruiting"
    soil_ph: Optional[float] = None
    soil_n: Optional[float] = None
    soil_p: Optional[float] = None
    soil_k: Optional[float] = None


class TodayAction(BaseModel):
    priority: int = Field(ge=1, le=5)
    category: Literal["WEATHER", "DISEASE", "IRRIGATION", "MARKET", "CROP", "SCHEME", "INSURANCE", "TASK"]
    title: str
    reason: str
    recommended_action: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Literal["pending", "done", "dismissed"] = "pending"


# ---------- Crop recommendation ----------

class CropRecommendationRequest(BaseModel):
    latitude: float = 18.5204  # ponytail: Pune default so demo works without GPS
    longitude: float = 73.8567
    season: Literal["Kharif", "Rabi", "Zaid"] = "Kharif"
    soil_type: str = "Loamy"
    ph: float = 6.5
    n: float = 50
    p: float = 30
    k: float = 40
    land_acres: float = 2.5
    water_availability: Literal["LOW", "MEDIUM", "HIGH"] = "MEDIUM"
    budget_inr: Optional[float] = None


class RankedCrop(BaseModel):
    crop: str
    suitability: float  # 0-100
    expected_yield_per_acre_kg: float
    explanation_factors: list[str]


class CropRecommendationResponse(BaseModel):
    ranked_crops: list[RankedCrop]
    disclaimer: str = "Recommended based on available inputs — verify with local agricultural guidance before sowing."


# ---------- Disease detection ----------

class DiseaseDetectResponse(BaseModel):
    disease: Optional[str] = None
    confidence: float = 0.0
    severity: Optional[Literal["MILD", "MODERATE", "SEVERE"]] = None
    model_version: str = "v1"
    confident: bool
    message: str


# ---------- Weather ----------

class WeatherRaw(BaseModel):
    temperature_c: float
    humidity_pct: float
    rain_probability_pct: float
    wind_kmh: float
    condition: str
    forecast: list[dict[str, Any]] = []


class AgriInterpretation(BaseModel):
    irrigation_advice: str
    spraying_advice: str
    disease_note: str


class WeatherResponse(BaseModel):
    raw: WeatherRaw
    agri_interpretation: AgriInterpretation
    disclaimer: str = "Forecast-based guidance, not guaranteed weather."


# ---------- Irrigation ----------

class IrrigationRequest(BaseModel):
    farm: FarmProfile
    soil_moisture_pct: Optional[float] = None  # None => weather-estimated
    rain_probability_pct: float = 0.0
    temperature_c: float = 30.0
    humidity_pct: float = 60.0


class IrrigationResponse(BaseModel):
    recommendation: Literal["IRRIGATE", "WAIT", "CAUTION"]
    reason: str
    data_source: Literal["sensor", "weather-estimated"]
    soil_moisture_pct: Optional[float] = None
    crop_water_need_note: str


# ---------- Assistant ----------

class AssistantRequest(BaseModel):
    query: str
    language: Optional[Literal["en", "hi", "mr"]] = None
    farm: Optional[FarmProfile] = None
    image_ref: Optional[str] = None


class AssistantResponse(BaseModel):
    answer: str
    language: Literal["en", "hi", "mr"]
    sources: list[str] = []
    disclaimer: str = "General guidance — consult a local agricultural expert for critical decisions."


# ---------- Profitability / market ----------

class MarketPrice(BaseModel):
    market: str
    price_per_kg: float
    distance_km: float
    transport_cost_per_kg: float = 0.5
    trend: Literal["up", "down", "stable"] = "stable"


class ProfitabilityRequest(BaseModel):
    crop: str
    land_acres: float
    seed_cost: float = 0
    fertilizer_cost: float = 0
    labor_cost: float = 0
    irrigation_cost: float = 0
    transport_cost: float = 0
    storage_cost: float = 0
    expected_yield_kg: float = 0
    market_price_per_kg: float = 0


class ProfitabilityResponse(BaseModel):
    total_cost: float
    expected_revenue: float
    estimated_profit: float
    profit_per_acre: float
    disclaimer: str = "Deterministic estimate from your inputs — market prices may vary."


# ---------- Expert escalation ----------

class ExpertRequest(BaseModel):
    farm: FarmProfile
    image_ref: Optional[str] = None
    issue: str
    risk_level: Optional[Literal["LOW", "MEDIUM", "HIGH"]] = None
    disease: Optional[str] = None
    confidence: Optional[float] = None


class ExpertRequestResponse(BaseModel):
    case_id: str
    status: Literal["OPEN", "ASSIGNED", "RESOLVED"] = "OPEN"
    message: str = "Your request has been recorded. An agricultural expert will review it."
