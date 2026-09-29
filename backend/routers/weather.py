"""GET /weather — raw weather data + separate AI agri interpretation.

STUB: returns realistic sample data. TODO: wire a real weather provider
(OpenWeather / IMD) using WEATHER_API_KEY from env.
"""
from fastapi import APIRouter, Depends

from core.security import get_current_user
from schemas.schemas import AgriInterpretation, WeatherRaw, WeatherResponse

router = APIRouter()


@router.get("/weather", response_model=WeatherResponse)
def get_weather(lat: float = 18.5204, lon: float = 73.8567,
                user: dict = Depends(get_current_user)):
    raw = WeatherRaw(
        temperature_c=29.0, humidity_pct=88.0, rain_probability_pct=81.0,
        wind_kmh=12.0, condition="Overcast",
        forecast=[
            {"day": "Today", "temp_c": 29, "rain_pct": 40},
            {"day": "Tomorrow", "temp_c": 27, "rain_pct": 81},
            {"day": "Day 3", "temp_c": 28, "rain_pct": 35},
        ],
    )
    interpretation = AgriInterpretation(
        irrigation_advice="Rain expected tomorrow (81%). Delay irrigation — rainfall may satisfy near-term water needs.",
        spraying_advice="Spraying conditions may be unfavorable — rain can wash off treatments.",
        disease_note="High humidity may increase fungal disease risk. Inspect lower leaves.",
    )
    return WeatherResponse(raw=raw, agri_interpretation=interpretation)
