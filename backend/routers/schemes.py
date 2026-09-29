"""GET /schemes — government schemes & crop insurance info.

Language is deliberately cautious: "Potentially relevant", "Check official
eligibility". Data is a curated STUB — TODO: sync from official sources
(agriwelfare.gov.in, pmfby.gov.in) and keep dates current.
"""
from fastapi import APIRouter, Depends

from core.security import get_current_user

router = APIRouter()

SCHEMES = [
    {
        "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "type": "insurance",
        "potential_relevance": "Potentially relevant for crop loss protection",
        "benefits": "Financial support in case of crop failure due to natural calamities",
        "eligibility_indicators": ["Land-owning or tenant farmer", "Notified crop in notified area"],
        "documents": ["Aadhaar", "Land records / tenancy proof", "Bank account details", "Sowing certificate"],
        "important_dates": "Check official portal for current enrolment window",
        "official_source": "https://pmfby.gov.in",
    },
    {
        "name": "PM-KISAN Samman Nidhi",
        "type": "scheme",
        "potential_relevance": "Potentially relevant income support",
        "benefits": "₹6,000 per year in three instalments to eligible farmer families",
        "eligibility_indicators": ["Land-holding farmer family", "Valid land records"],
        "documents": ["Aadhaar", "Land records", "Bank account details"],
        "important_dates": "Ongoing — check official portal",
        "official_source": "https://pmkisan.gov.in",
    },
    {
        "name": "Soil Health Card Scheme",
        "type": "scheme",
        "potential_relevance": "Potentially relevant for soil testing",
        "benefits": "Free soil testing with nutrient recommendations every 2 years",
        "eligibility_indicators": ["Any farmer with agricultural land"],
        "documents": ["Land details", "Aadhaar (where required)"],
        "important_dates": "Ongoing — contact local agriculture office",
        "official_source": "https://soilhealth.dac.gov.in",
    },
]


@router.get("/schemes")
def schemes(user: dict = Depends(get_current_user)):
    return {
        "items": SCHEMES,
        "disclaimer": "Potentially relevant — check official eligibility on the linked government portals before applying.",
    }
