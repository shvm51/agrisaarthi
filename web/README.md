# AgriSaarthi Web — the PWA product

Mobile-first, installable Next.js PWA for farmers. This is **the** farmer product
(it replaces the Expo app). It consumes the live FastAPI backend and is
demo-first on Supabase: it runs fully without any backend keys.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
`@supabase/supabase-js` · Service Worker PWA

**Architecture**

```
Next.js PWA (Vercel) → FastAPI (Railway) → AI/ML + Supabase + external APIs
```

The PWA never talks to Supabase directly for farm intelligence — all
intelligence flows through the FastAPI contract in `../backend`. The browser
only holds the public Supabase URL + publishable key (never service-role keys).

## Getting started

```bash
cd web
npm install
cp .env.example .env.local   # edit values as needed
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build (typecheck + lint + prerender) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Environment variables

See `.env.example`. The two that matter most:

- `NEXT_PUBLIC_API_URL` — FastAPI base (default: the live Railway deployment).
- `NEXT_PUBLIC_DEMO_MODE=true` — run as the demo farmer (Ramesh Patil, Pune,
  2.5 acres, Tomato/Fruiting) with no sign-in.

Supabase is optional until you provide the project URL + publishable key;
set `NEXT_PUBLIC_DEMO_MODE=false` once connected to require sign-in.

## Project structure

```
app/            Routes: / (Home), /farm, /scan, /ai, /weather, /irrigation,
                /market, /profit, /recommend, /expert, /more, /settings,
                /login, /offline
components/     ui.tsx (design-system primitives), nav.tsx (bottom tabs),
                app-shell.tsx (providers, offline banner, SW registration)
lib/            api.ts (typed FastAPI client), i18n.tsx (en/hi/mr),
                session.tsx (farm profile + auth-ready session),
                supabase.ts (lazy client), format.ts (INR/dates)
public/         manifest.webmanifest, sw.js, icons/
```

## Design contract

Visual language is locked in `../DESIGN.md`: warm off-white surfaces, deep
pine green, olive, harvest gold; Fraunces display + Inter/Noto Sans Devanagari
body; farmer-first hierarchy ("What should I do today?"); bottom tabs
HOME / MY FARM / SCAN / AI / MORE. Never present predictions as guarantees —
copy uses "Probable", "Estimated", "Recommended based on available inputs".

## PWA

- `public/manifest.webmanifest` + generated icons (`public/icons/`) —
  installable, standalone display, maskable icon included.
- `public/sw.js` — network-first for navigations/API with an offline fallback
  page; cache-first for static assets. Registered only in production builds.
  Authenticated API responses are never cached.
- Offline banner + `/offline` route; every data screen has explicit
  loading / error-with-retry / empty states.

## Internationalization

English, Hindi and Marathi are first-class (`lib/i18n.tsx`). Language is
persisted, `<html lang>` follows the selection, and Devanagari uses
Noto Sans Devanagari. Never hardcode UI copy — add keys to the dictionary.

## Supabase

Demo-first and structurally integrated from day one. `lib/supabase.ts` creates
a lazy client only when both public env vars are set; `lib/session.tsx` is
ready to upsert the `farms` table on sign-in. Schema lives in
`../backend/schema.sql` (RLS enabled). Service-role keys must never appear in
this codebase.

## Deploying to Vercel

1. Import the `shvm51/agrisaarthi` repo in Vercel.
2. Set **Root Directory** to `web` (Framework preset: Next.js).
3. Add environment variables (Production + Preview):
   - `NEXT_PUBLIC_API_URL=https://agrisaarthi-production.up.railway.app`
   - `NEXT_PUBLIC_DEMO_MODE=true`
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (when ready)
4. Deploy. `vercel.json` pins the build; `next.config.ts` adds security
   headers and a no-cache rule for `sw.js`.

No Vercel credentials live in this repo — deployment is configured, not
authenticated, from here.

## API contract

The PWA is a thin client over the FastAPI backend. Endpoint shapes are typed
in `lib/api.ts`; the server contract is documented in `../backend/README.md`
(or `main.py`). Do not rewrite the backend unless a specific endpoint needs
improvement — fix the client to match the contract.
