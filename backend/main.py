"""AgriSaarthi FastAPI backend — farmer mobile API + admin support.

Run:  cd ~/workspace/agri-saarthi/backend && uvicorn main:app --reload --port 8000
"""
import os
import sys

# Make `core`, `routers`, `services`, `schemas`, `ml` importable from anywhere.
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
for _p in (_BACKEND_DIR, _PROJECT_ROOT):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings

app = FastAPI(title="AgriSaarthi API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO(PROD): restrict to app domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import assistant, crop, disease, expert, irrigation, market, risk, schemes, today, weather  # noqa: E402

app.include_router(today.router)
app.include_router(crop.router)
app.include_router(disease.router)
app.include_router(weather.router)
app.include_router(irrigation.router)
app.include_router(assistant.router)
app.include_router(market.router)
app.include_router(risk.router)
app.include_router(schemes.router)
app.include_router(expert.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "agrisaarthi-api"}


@app.on_event("startup")
def _startup():
    settings = get_settings()
    print(f"[AgriSaarthi] API starting — env={settings.ENV}, demo_mode={settings.DEMO_MODE}")
