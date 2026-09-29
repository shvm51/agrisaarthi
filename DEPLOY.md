# Deploying AgriSaarthi online

Two parts: the API goes on a public host, the app becomes an installable APK.

## 1. API → Render (free, ~10 min)

1. Push `agri-saarthi/` to a GitHub repo.
2. Go to render.com → sign up (free) → **New → Blueprint** → select the repo.
3. Render reads `render.yaml` + `Dockerfile` and builds. Health check: `/health`.
4. When live, copy your URL: `https://agrisaarthi-api.onrender.com`
5. (Later) add `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `WEATHER_API_KEY` under
   Render → Environment. The API runs in demo mode without them.

Free-tier note: the service sleeps after 15 min idle; first request wakes it (~30 s).

## 2. App → installable APK via EAS (~20 min build)

1. `cd mobile && npm install`
2. `npm install -g eas-cli` then `eas login` (free Expo account).
3. Bake in the API URL and build:
   ```
   eas build --platform android --profile preview \
     --env EXPO_PUBLIC_API_URL=https://agrisaarthi-api.onrender.com
   ```
4. Download the APK from the EAS dashboard link, install on any Android phone.
   No dev server, no same-Wi-Fi needed — it talks to your Render API.

For the SIH demo this is the recommended setup: public API + preview APK.

## 3. Quick local alternative (same Wi-Fi only)

Backend on laptop + `EXPO_PUBLIC_API_URL=http://<laptop-IP>:8000` + Expo Go.
See README.md.
