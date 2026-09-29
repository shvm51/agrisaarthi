"""POST /disease-detect — image -> disease, confidence, severity."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from core.config import get_settings
from core.security import get_current_user
from ml.disease_detection.inference import get_model
from ml.disease_detection.preprocessing import QualityTooLow, preprocess
from schemas.schemas import DiseaseDetectResponse

router = APIRouter()


@router.post("/disease-detect", response_model=DiseaseDetectResponse)
async def disease_detect(image: UploadFile = File(...), user: dict = Depends(get_current_user)):
    settings = get_settings()
    raw = await image.read()

    try:
        processed = preprocess(raw, max_bytes=settings.MAX_IMAGE_BYTES)
    except QualityTooLow as e:
        # Never produce an unreliable diagnosis just to show a result.
        return DiseaseDetectResponse(
            confidence=0.0, confident=False,
            model_version=settings.DISEASE_MODEL_VERSION,
            message=f"{e.user_message} You can also contact an agricultural expert.",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    pred = get_model().predict(processed)
    confidence = float(pred["confidence"])

    if confidence >= settings.DISEASE_CONFIDENCE_HIGH:
        confident, message = True, f"Probable {pred['disease']}."
    elif confidence >= settings.DISEASE_CONFIDENCE_MEDIUM:
        confident, message = True, f"Possible {pred['disease']} — confidence is moderate."
    else:
        # Low confidence: never present as certain.
        return DiseaseDetectResponse(
            confidence=confidence, confident=False,
            model_version=settings.DISEASE_MODEL_VERSION,
            message="Unable to confidently identify the condition. "
                    "Please try another image or contact an agricultural expert.",
        )

    return DiseaseDetectResponse(
        disease=pred["disease"], confidence=confidence,
        severity=pred.get("severity"), confident=confident,
        model_version=pred.get("model_version", settings.DISEASE_MODEL_VERSION),
        message=message,
    )
