"""POST /expert-request — escalate a case to an agricultural expert.

TODO: persist to Supabase `expert_requests` table (server-side service role)
instead of the in-memory list used here.
"""
import uuid

from fastapi import APIRouter, Depends

from core.security import get_current_user
from schemas.schemas import ExpertRequest, ExpertRequestResponse

router = APIRouter()

_cases: list[dict] = []  # in-memory stub; replace with Supabase insert


@router.post("/expert-request", response_model=ExpertRequestResponse)
def expert_request(req: ExpertRequest, user: dict = Depends(get_current_user)):
    case_id = str(uuid.uuid4())[:8]
    _cases.append({
        "case_id": case_id,
        "farmer_id": user["sub"],
        "crop": req.farm.crop,
        "issue": req.issue,
        "risk_level": req.risk_level,
        "disease": req.disease,
        "confidence": req.confidence,
        "location": req.farm.location_name,
        "image_ref": req.image_ref,
        "status": "OPEN",
    })
    return ExpertRequestResponse(case_id=case_id)
