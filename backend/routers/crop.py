"""POST /crop-recommendation — ranked, explainable crop suggestions."""
from fastapi import APIRouter, Depends

from core.security import get_current_user
from ml.crop_recommendation.inference import rank_crops
from schemas.schemas import CropRecommendationRequest, CropRecommendationResponse, RankedCrop

router = APIRouter()


@router.post("/crop-recommendation", response_model=CropRecommendationResponse)
def crop_recommendation(req: CropRecommendationRequest, user: dict = Depends(get_current_user)):
    inputs = {
        "ph": req.ph, "n": req.n, "p": req.p, "k": req.k,
        "soil_type": req.soil_type,
        "water_availability": req.water_availability,
        "season": req.season,
    }
    ranked = rank_crops(inputs)
    return CropRecommendationResponse(ranked_crops=[RankedCrop(**r) for r in ranked])
