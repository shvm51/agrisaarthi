"""POST /assistant — farm-aware multilingual agriculture assistant.

Pipeline: language detect -> farm context -> tool stubs -> grounded answer.
TODO: wire a real LLM + retrieval (agricultural knowledge base) + tool calling;
LLM_API_KEY stays server-side in env.
"""
import re

from fastapi import APIRouter, Depends

from core.security import get_current_user
from schemas.schemas import AssistantRequest, AssistantResponse

router = APIRouter()


def detect_language(text: str) -> str:
    """Stub: Devanagari -> hi, common Marathi markers -> mr, else en."""
    if re.search(r"[\u0900-\u097F]", text):
        mr_markers = ["माझ्या", "काय", "करावे", "आहे", "माझे"]
        if any(m in text for m in mr_markers):
            return "mr"
        return "hi"
    return "en"


def _tool_farm_summary(farm) -> str:
    if farm is None:
        return "no farm profile on file"
    return f"{farm.crop} at {farm.crop_stage} stage, {farm.land_acres} acres, {farm.location_name}"


def _answer_irrigation(lang: str, farm_ctx: str) -> str:
    t = {
        "en": f"For your {farm_ctx}: if rain is expected in the next 24 hours, delay irrigation — rainfall may cover the crop's needs. Otherwise check topsoil moisture before watering. This is guidance, not a guarantee — confirm with local conditions.",
        "hi": f"आपकी {farm_ctx} फसल के लिए: यदि अगले 24 घंटों में बारिश की संभावना है, तो सिंचाई टाल दें — बारिश फसल की ज़रूरत पूरी कर सकती है। अन्यथा पानी देने से पहले मिट्टी की नमी जांचें। यह मार्गदर्शन है, गारंटी नहीं — स्थानीय स्थिति से पुष्टि करें।",
        "mr": f"तुमच्या {farm_ctx} पिकासाठी: पुढील 24 तासांत पावसाची शक्यता असेल तर सिंचन पुढे ढकला — पाऊस पिकाची गरज भागवू शकतो. अन्यथा पाणी देण्यापूर्वी मातीतील ओलावा तपासा. हे मार्गदर्शन आहे, हमी नाही — स्थानिक परिस्थितीनुसार खात्री करा.",
    }
    return t[lang]


def _answer_generic(lang: str, farm_ctx: str, query: str) -> str:
    t = {
        "en": f"Based on your farm ({farm_ctx}), here's what I can help with: today's actions, irrigation timing, disease checks, market prices and schemes. For '{query}' — please add details (crop stage, symptoms, or market) so I can give specific guidance. When in doubt, consult your local agricultural expert.",
        "hi": f"आपके खेत ({farm_ctx}) के आधार पर, मैं इनमें मदद कर सकता हूँ: आज के कार्य, सिंचाई का समय, रोग जांच, बाज़ार भाव और योजनाएं। '{query}' के लिए — कृपया विवरण जोड़ें ताकि मैं सटीक मार्गदर्शन दे सकूं। संदेह हो तो स्थानीय कृषि विशेषज्ञ से सलाह लें।",
        "mr": f"तुमच्या शेताच्या ({farm_ctx}) आधारे मी यात मदत करू शकतो: आजची कामे, सिंचनाची वेळ, रोग तपासणी, बाजारभाव आणि योजना. '{query}' साठी — कृपया तपशील द्या जेणेकरून मी अचूक मार्गदर्शन देऊ शकेन. शंका असल्यास स्थानिक कृषी तज्ज्ञांचा सल्ला घ्या.",
    }
    return t[lang]


@router.post("/assistant", response_model=AssistantResponse)
def assistant(req: AssistantRequest, user: dict = Depends(get_current_user)):
    lang = req.language or detect_language(req.query)
    farm_ctx = _tool_farm_summary(req.farm)  # tool-calling stub: farm profile lookup

    q = req.query.lower()
    if any(k in q for k in ["irrigat", "सिंचाई", "सिंचन", "पाणी", "water"]):
        answer = _answer_irrigation(lang, farm_ctx)
        sources = ["farm_profile", "irrigation_engine"]
    else:
        answer = _answer_generic(lang, farm_ctx, req.query)
        sources = ["farm_profile", "agri_knowledge_base"]

    return AssistantResponse(answer=answer, language=lang, sources=sources)
