# AgriSaarthi — AI-Powered Farming Companion

Smart India Hackathon 2026. Mobile-first farmer app (React Native + Expo), Python FastAPI backend, Supabase (PostgreSQL + Auth + Storage), PyTorch/scikit-learn ML.

Philosophy: DATA → INTELLIGENCE → ACTION. The core screen answers **"What should I do today?"**

## Monorepo

```
agri-saarthi/
  mobile/     Expo + TypeScript farmer app (PRIMARY PRODUCT)
  backend/    FastAPI API + Agriculture Intelligence Engine
  ml/         Disease detection + crop recommendation (training separate from inference)
  supabase/   schema.sql with RLS
  web-admin/  Expert/admin dashboard (web-only, separate)
  DESIGN.md   Brand contract
  DEMO.md     SIH demo script
```

## Quick start

### Mobile (Expo Go compatible)
```bash
cd mobile
npm install
npx expo start
# Set EXPO_PUBLIC_API_URL to your backend URL
```
Demo login: use **Demo Mode** → Ramesh Patil, Pune, Tomato (Fruiting).

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# GET http://localhost:8000/today-actions?farmer_id=demo
```

### Supabase
Run `supabase/schema.sql` in the Supabase SQL editor. Set env:
`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `WEATHER_API_KEY` (server only — never in the app).

## API (core)
- `GET /today-actions` — prioritized 3–5 farm actions (Home screen consumes this)
- `POST /crop-recommendation` — ranked crops with suitability % + factors
- `POST /disease-detect` — image → disease, confidence, severity (quality-gated)
- `GET /weather` — raw weather + AI agri interpretation (separated)
- `POST /irrigation-advice` — IRRIGATE / WAIT / CAUTION
- `POST /assistant` — farm-aware multilingual assistant (en/hi/mr)
- `GET /market-prices` / `POST /profitability`
- `GET /schemes` / `POST /expert-request`

## Responsible AI
Disease: "Probable …". Market: "Estimated trend". Schemes: "Potentially relevant — check official eligibility." Low confidence → retake or expert. No unsafe pesticide prescriptions.

## Security
Secrets server-side only. Supabase Auth + RLS: farmers see only their own records; experts see assigned cases; admins see authorized aggregates.

## MVP priority (built first)
1. Farm profile 2. Today actions 3. Crop recommendation 4. Disease detection + risk
5. Weather intelligence 6. Irrigation 7. AI assistant 8. Market 9. Profitability
10. Buyer matching 11. Farm record → then schemes, insurance, expert escalation, admin.
