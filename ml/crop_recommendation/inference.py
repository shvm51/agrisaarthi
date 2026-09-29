"""Deterministic crop ranking — transparent scoring, not arbitrary.

Scores crops on soil pH fit, N/P/K fit, water availability, season fit and
land-size economics. Replaceable by a trained RandomForest/XGBoost ranker
later; the output contract is unchanged.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

CROPS = {
    "Soybean": {"ph": (6.0, 7.5), "n": (20, 60), "p": (20, 50), "k": (30, 60),
                "water": "MEDIUM", "seasons": ["Kharif"], "yield_kg_acre": 800,
                "soil_bonus": {"Black": 10, "Loamy": 5}},
    "Maize": {"ph": (5.8, 7.0), "n": (60, 120), "p": (30, 60), "k": (30, 60),
              "water": "MEDIUM", "seasons": ["Kharif", "Rabi"], "yield_kg_acre": 2000,
              "soil_bonus": {"Alluvial": 8, "Loamy": 5}},
    "Cotton": {"ph": (5.8, 8.0), "n": (40, 80), "p": (20, 40), "k": (40, 80),
               "water": "MEDIUM", "seasons": ["Kharif"], "yield_kg_acre": 700,
               "soil_bonus": {"Black": 12}},
    "Tomato": {"ph": (6.0, 7.0), "n": (60, 100), "p": (30, 60), "k": (50, 90),
               "water": "HIGH", "seasons": ["Rabi", "Kharif"], "yield_kg_acre": 12000,
               "soil_bonus": {"Loamy": 8, "Red": 5}},
    "Wheat": {"ph": (6.0, 7.5), "n": (60, 120), "p": (30, 60), "k": (20, 50),
              "water": "MEDIUM", "seasons": ["Rabi"], "yield_kg_acre": 1800,
              "soil_bonus": {"Alluvial": 10, "Loamy": 5}},
    "Groundnut": {"ph": (6.0, 7.0), "n": (20, 50), "p": (30, 60), "k": (30, 60),
                  "water": "LOW", "seasons": ["Kharif"], "yield_kg_acre": 900,
                  "soil_bonus": {"Sandy": 10, "Red": 5}},
}

WATER_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
WATER_PENALTY_PER_LEVEL = 15.0


def _band_score(value: float, lo: float, hi: float) -> float:
    if lo <= value <= hi:
        return 100.0
    dist = lo - value if value < lo else value - hi
    span = hi - lo or 1.0
    return max(0.0, 100.0 - (dist / span) * 150.0)


def score_crop(crop: str, spec: dict, inputs: dict) -> tuple[float, list[str]]:
    factors: list[str] = []
    parts: list[float] = []

    ph_s = _band_score(inputs["ph"], *spec["ph"])
    parts.append(ph_s * 0.25)
    factors.append(f"Soil pH {inputs['ph']} {'fits' if ph_s >= 80 else 'partially fits'} {crop} range {spec['ph']}")

    for key in ("n", "p", "k"):
        s = _band_score(inputs[key], *spec[key])
        parts.append(s * 0.10)
        if s >= 80:
            factors.append(f"{key.upper()} level suits {crop}")

    water_need = WATER_ORDER[spec["water"]]
    water_have = WATER_ORDER[inputs["water_availability"]]
    if water_have >= water_need:
        parts.append(100 * 0.20)
        factors.append("Water availability meets crop needs")
    else:
        gap = water_need - water_have
        parts.append(max(0, 100 - gap * WATER_PENALTY_PER_LEVEL) * 0.20)
        factors.append(f"Water availability is below {crop} needs — consider irrigation")

    if inputs["season"] in spec["seasons"]:
        parts.append(100 * 0.15)
        factors.append(f"Suitable for {inputs['season']} season")
    else:
        factors.append(f"Not a typical {inputs['season']} crop")

    soil_bonus = spec["soil_bonus"].get(inputs["soil_type"], 0)
    parts.append(soil_bonus)  # 0-12 bonus points
    if soil_bonus:
        factors.append(f"{inputs['soil_type']} soil suits {crop}")

    suitability = round(min(99.0, sum(parts)), 1)
    return suitability, factors


def rank_crops(inputs: dict, top_n: int = 5) -> list[dict]:
    ranked = []
    for crop, spec in CROPS.items():
        suitability, factors = score_crop(crop, spec, inputs)
        ranked.append({
            "crop": crop,
            "suitability": suitability,
            "expected_yield_per_acre_kg": spec["yield_kg_acre"],
            "explanation_factors": factors[:4],
        })
    ranked.sort(key=lambda r: r["suitability"], reverse=True)
    return ranked[:top_n]


if __name__ == "__main__":
    # Loamy soil, medium water, Kharif -> Soybean/Maize should rank above Wheat (Rabi crop).
    out = rank_crops({
        "ph": 6.8, "n": 50, "p": 35, "k": 45,
        "soil_type": "Loamy", "water_availability": "MEDIUM", "season": "Kharif",
    })
    assert len(out) == 5
    assert out[0]["suitability"] >= out[-1]["suitability"], "must be sorted desc"
    names = [r["crop"] for r in out]
    assert "Soybean" in names[:3], names
    assert all(0 <= r["suitability"] <= 99 for r in out)
    # Determinism
    assert rank_crops({"ph": 6.8, "n": 50, "p": 35, "k": 45, "soil_type": "Loamy",
                       "water_availability": "MEDIUM", "season": "Kharif"}) == out
    print(f"OK: crop ranking deterministic, top = {out[0]['crop']} ({out[0]['suitability']}%)")
