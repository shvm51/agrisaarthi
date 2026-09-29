"""Agricultural Risk Engine — combines detection + context into a risk score.

Weights are configurable via RISK_WEIGHTS. Keeps the detection model separate
from the final risk decision.
"""
from typing import Any, Optional

RISK_WEIGHTS = {
    "disease_probability": 0.30,
    "confidence": 0.15,
    "severity": 0.20,
    "weather": 0.15,        # humidity + rainfall favor disease
    "crop_stage": 0.10,     # flowering/fruiting more vulnerable
    "regional_reports": 0.10,
}

SEVERITY_SCORE = {"MILD": 25, "MODERATE": 55, "SEVERE": 90}
VULNERABLE_STAGES = {"Flowering": 70, "Fruiting": 80}
RISK_THRESHOLDS = {"HIGH": 70, "MEDIUM": 40}


def _risk_level(score: float) -> str:
    if score >= RISK_THRESHOLDS["HIGH"]:
        return "HIGH"
    if score >= RISK_THRESHOLDS["MEDIUM"]:
        return "MEDIUM"
    return "LOW"


def compute_risk(
    disease_probability: float = 0.0,
    confidence: float = 0.0,
    severity: Optional[str] = None,
    temperature_c: float = 30.0,
    humidity_pct: float = 60.0,
    rainfall_mm: float = 0.0,
    crop_stage: str = "Vegetative",
    regional_reports: int = 0,
    weights: Optional[dict[str, float]] = None,
) -> dict[str, Any]:
    w = weights or RISK_WEIGHTS

    severity_score = SEVERITY_SCORE.get((severity or "").upper(), 0)
    weather_score = min(100.0, humidity_pct * 0.7 + min(rainfall_mm, 50) * 0.6)
    stage_score = VULNERABLE_STAGES.get(crop_stage, 30)
    regional_score = min(100.0, regional_reports * 25.0)

    components = {
        "disease_probability": disease_probability * 100,
        "confidence": confidence * 100,
        "severity": severity_score,
        "weather": weather_score,
        "crop_stage": stage_score,
        "regional_reports": regional_score,
    }
    risk_score = round(sum(components[k] * w[k] for k in components), 1)
    level = _risk_level(risk_score)

    factors: list[str] = []
    if humidity_pct >= 75:
        factors.append("High humidity")
    if rainfall_mm >= 10:
        factors.append("Recent rainfall")
    if crop_stage in VULNERABLE_STAGES:
        factors.append(f"{crop_stage} stage (vulnerable)")
    if disease_probability >= 0.5:
        factors.append("Disease detected")
    if regional_reports >= 2:
        factors.append("Elevated regional risk")
    if temperature_c >= 28 and humidity_pct >= 70:
        factors.append("Warm + humid conditions favor fungal spread")

    if level == "HIGH":
        action = "Isolate affected plants, avoid overhead watering, and contact an agricultural expert."
    elif level == "MEDIUM":
        action = "Monitor closely for 48 hours and improve air circulation around plants."
    else:
        action = "Continue routine inspection; no immediate action needed."

    return {
        "risk_score": risk_score,
        "risk_level": level,
        "risk_factors": factors,
        "recommended_action": action,
        "components": components,
    }


if __name__ == "__main__":
    r = compute_risk(
        disease_probability=0.92, confidence=0.92, severity="SEVERE",
        temperature_c=29, humidity_pct=88, rainfall_mm=15,
        crop_stage="Fruiting", regional_reports=3,
    )
    assert r["risk_level"] == "HIGH", r
    assert 0 <= r["risk_score"] <= 100
    assert "High humidity" in r["risk_factors"]
    low = compute_risk(disease_probability=0.1, confidence=0.3, severity="MILD",
                       temperature_c=28, humidity_pct=40, crop_stage="Vegetative")
    assert low["risk_level"] in ("LOW", "MEDIUM")
    print(f"OK: risk HIGH example -> {r['risk_score']}, LOW example -> {low['risk_score']}")
