"""Agriculture Intelligence Engine — pure, deterministic, testable.

Inputs: farm profile, weather, disease risk, market, pending tasks.
Output: top 3-5 prioritized TODAY actions (priority 1 = most urgent).
"""
from datetime import datetime, timezone
from typing import Any, Optional

from schemas.schemas import FarmProfile, TodayAction


def _now() -> datetime:
    return datetime.now(timezone.utc)


def generate_today_actions(
    farm: FarmProfile,
    weather: Optional[dict[str, Any]] = None,
    disease_risk: Optional[dict[str, Any]] = None,
    market: Optional[dict[str, Any]] = None,
    tasks: Optional[list[str]] = None,
) -> list[TodayAction]:
    weather = weather or {}
    disease_risk = disease_risk or {}
    market = market or {}
    tasks = tasks or []

    actions: list[tuple[int, TodayAction]] = []

    # 1) Rain expected -> delay irrigation
    rain_prob = weather.get("rain_probability_pct", 0)
    if rain_prob >= 60:
        actions.append((
            1,
            TodayAction(
                priority=1, category="WEATHER",
                title="Rain expected — delay irrigation",
                reason=f"{rain_prob}% chance of rain in the next 24 hours.",
                recommended_action="Delay irrigation. Expected rainfall may satisfy near-term water requirements.",
                timestamp=_now(),
            ),
        ))

    # 2) Elevated disease risk -> inspect crop
    risk_level = (disease_risk.get("risk_level") or "").upper()
    if risk_level == "HIGH":
        actions.append((
            1 if not actions else 2,
            TodayAction(
                priority=1 if not actions else 2, category="DISEASE",
                title="Disease risk elevated — inspect crop",
                reason=disease_risk.get("reason", "High humidity and favorable conditions for fungal disease."),
                recommended_action=f"Inspect lower leaves of your {farm.crop} crop and watch for early symptoms.",
                timestamp=_now(),
            ),
        ))

    # 3) Irrigation advice when no rain and moisture unknown/low
    if rain_prob < 60 and weather.get("temperature_c", 30) >= 32:
        actions.append((
            3,
            TodayAction(
                priority=3, category="IRRIGATION",
                title="Check soil moisture",
                reason="High temperature and no rain expected increases water demand.",
                recommended_action=f"Check soil moisture for your {farm.crop} ({farm.crop_stage} stage); irrigate if the topsoil is dry.",
                timestamp=_now(),
            ),
        ))

    # 4) Market uptrend for current crop
    if (market.get("trend") or "").lower() == "up":
        actions.append((
            4,
            TodayAction(
                priority=4, category="MARKET",
                title=f"{farm.crop} prices trending upward",
                reason=market.get("reason", "Mandi prices for your crop are rising in nearby markets."),
                recommended_action="Compare nearby markets before selling to get a better net return.",
                timestamp=_now(),
            ),
        ))

    # 5) Pending farm tasks
    if tasks:
        actions.append((
            5,
            TodayAction(
                priority=5, category="TASK",
                title="Pending farm task",
                reason=f"You have {len(tasks)} task(s) recorded.",
                recommended_action=f"Complete: {tasks[0]}",
                timestamp=_now(),
            ),
        ))
    else:
        # Default crop-health check keeps the list useful even with no alerts.
        actions.append((
            5,
            TodayAction(
                priority=5, category="CROP",
                title="Crop health check",
                reason=f"Regular inspection helps catch issues early in the {farm.crop_stage} stage.",
                recommended_action="Walk your field and check overall crop health.",
                timestamp=_now(),
            ),
        ))

    # Sort by priority, fix sequence to 1..n, cap at 5
    actions.sort(key=lambda a: a[0])
    result: list[TodayAction] = []
    for i, (_, action) in enumerate(actions[:5], start=1):
        action.priority = i
        result.append(action)
    return result


if __name__ == "__main__":
    # Demo: Ramesh Patil — Tomato, Fruiting, Pune. Rain expected, high humidity.
    demo_farm = FarmProfile(
        farmer_id="demo-farmer-1",
        farmer_name="Ramesh Patil",
        location_name="Pune, Maharashtra",
        land_acres=2.5,
        crop="Tomato",
        crop_stage="Fruiting",
    )
    acts = generate_today_actions(
        demo_farm,
        weather={"rain_probability_pct": 81, "temperature_c": 29, "humidity_pct": 88},
        disease_risk={"risk_level": "HIGH", "reason": "High humidity + elevated fungal risk"},
        market={"trend": "up", "reason": "Tomato prices are trending upward in nearby mandis."},
        tasks=[],
    )
    assert 3 <= len(acts) <= 5, "must return 3-5 actions"
    assert acts[0].priority == 1
    assert acts[0].category == "WEATHER" and "delay irrigation" in acts[0].title.lower()
    assert any(a.category == "DISEASE" and "inspect lower leaves" in a.recommended_action.lower() for a in acts)
    assert any(a.category == "MARKET" and "compare" in a.recommended_action.lower() for a in acts)
    print(f"OK: {len(acts)} demo actions generated")
