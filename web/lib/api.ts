/**
 * AgriSaarthi API client — Next.js PWA -> FastAPI (Railway) -> AI/ML -> Supabase.
 *
 * All farm decision logic lives server-side. This client only transports
 * typed requests/responses and never duplicates intelligence logic.
 *
 * Auth: attaches the Supabase JWT when a session exists. In demo mode
 * (no Supabase configured) requests go without a token and the backend
 * dev fallback applies — never ship that fallback to production.
 */
import { getAccessToken, isSupabaseConfigured } from "./supabase";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://agrisaarthi-production.up.railway.app";

export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE !== "false" || !isSupabaseConfigured();

/* ---------------- Types (mirror backend/schemas/schemas.py) ---------------- */

export interface FarmProfile {
  farmer_id: string;
  farmer_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  land_acres: number;
  soil_type: string;
  water_availability: "LOW" | "MEDIUM" | "HIGH";
  crop: string;
  crop_stage: "Seedling" | "Vegetative" | "Flowering" | "Fruiting" | "Harvest";
  soil_ph?: number | null;
  soil_n?: number | null;
  soil_p?: number | null;
  soil_k?: number | null;
}

export type ActionCategory =
  | "WEATHER" | "DISEASE" | "IRRIGATION" | "MARKET"
  | "CROP" | "SCHEME" | "INSURANCE" | "TASK";

export interface TodayAction {
  priority: number;
  category: ActionCategory;
  title: string;
  reason: string;
  recommended_action: string;
  timestamp: string;
  status: "pending" | "done" | "dismissed";
}

export interface DiseaseDetectResponse {
  disease: string | null;
  confidence: number;
  severity: "MILD" | "MODERATE" | "SEVERE" | null;
  model_version: string;
  confident: boolean;
  message: string;
}

export interface WeatherResponse {
  raw: {
    temperature_c: number;
    humidity_pct: number;
    rain_probability_pct: number;
    wind_kmh: number;
    condition: string;
    forecast: Array<{ day: string; temp_c: number; rain_pct: number }>;
  };
  agri_interpretation: {
    irrigation_advice: string;
    spraying_advice: string;
    disease_note: string;
  };
  disclaimer: string;
}

export interface IrrigationResponse {
  recommendation: "IRRIGATE" | "WAIT" | "CAUTION";
  reason: string;
  data_source: "sensor" | "weather-estimated";
  soil_moisture_pct: number | null;
  crop_water_need_note: string;
}

export interface AssistantResponse {
  answer: string;
  language: "en" | "hi" | "mr";
  sources: string[];
  disclaimer: string;
}

export interface MarketPrice {
  market: string;
  price_per_kg: number;
  distance_km: number;
  transport_cost_per_kg: number;
  trend: "up" | "down" | "stable";
}

export interface ProfitabilityResponse {
  total_cost: number;
  expected_revenue: number;
  estimated_profit: number;
  profit_per_acre: number;
  disclaimer: string;
}

export interface RankedCrop {
  crop: string;
  suitability: number;
  expected_yield_per_acre_kg: number;
  explanation_factors: string[];
}

export interface CropRecommendationResponse {
  ranked_crops: RankedCrop[];
  disclaimer: string;
}

export interface FarmRiskResponse {
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  recommended_action: string;
}

export interface ExpertRequestResponse {
  case_id: string;
  status: "OPEN" | "ASSIGNED" | "RESOLVED";
  message: string;
}

export interface Scheme {
  name?: string;
  title?: string;
  benefits?: string;
  eligibility?: string;
  documents?: string[];
  source_url?: string;
  [k: string]: unknown;
}

/* ---------------- Errors ---------------- */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* ---------------- Core fetch ---------------- */

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    const token = await getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
    /* demo mode: no token */
  }
  return headers;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 20000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { ...(await authHeaders()), ...(init.headers || {}) };
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        detail = body?.detail || body?.message || detail;
      } catch { /* keep default */ }
      throw new ApiError(res.status, detail);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError(0, "Request timed out. Check your connection and retry.");
    }
    throw new ApiError(0, "Network error. Check your connection and retry.");
  } finally {
    clearTimeout(timer);
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ---------------- Endpoints ---------------- */

export function getTodayActions(farm: FarmProfile): Promise<TodayAction[]> {
  return request<TodayAction[]>(
    "/today-actions" +
      qs({
        farmer_name: farm.farmer_name,
        location_name: farm.location_name,
        latitude: farm.latitude,
        longitude: farm.longitude,
        land_acres: farm.land_acres,
        crop: farm.crop,
        crop_stage: farm.crop_stage,
      }),
  );
}

export function getWeather(lat: number, lon: number): Promise<WeatherResponse> {
  return request<WeatherResponse>(`/weather${qs({ lat, lon })}`);
}

export function getFarmRisk(params: {
  disease_probability?: number;
  confidence?: number;
  severity?: string;
  temperature_c?: number;
  humidity_pct?: number;
  rainfall_mm?: number;
  crop_stage?: string;
  regional_reports?: number;
}): Promise<FarmRiskResponse> {
  return request<FarmRiskResponse>(`/farm-risk${qs(params)}`);
}

export async function postDiseaseDetect(image: Blob): Promise<DiseaseDetectResponse> {
  const form = new FormData();
  form.append("image", image, "scan.jpg");
  const headers = await authHeaders();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${API_BASE}/disease-detect`, {
      method: "POST",
      headers,
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = `Scan failed (${res.status})`;
      try {
        const body = await res.json();
        detail = body?.detail || detail;
      } catch { /* keep default */ }
      throw new ApiError(res.status, detail);
    }
    return (await res.json()) as DiseaseDetectResponse;
  } finally {
    clearTimeout(timer);
  }
}

export function postIrrigationAdvice(body: {
  farm: FarmProfile;
  soil_moisture_pct?: number | null;
  rain_probability_pct: number;
  temperature_c: number;
  humidity_pct: number;
}): Promise<IrrigationResponse> {
  return request<IrrigationResponse>("/irrigation-advice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function postAssistant(body: {
  query: string;
  language?: "en" | "hi" | "mr";
  farm?: FarmProfile;
}): Promise<AssistantResponse> {
  return request<AssistantResponse>("/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getMarketPrices(
  crop: string,
  lat: number,
  lon: number,
): Promise<MarketPrice[]> {
  return request<MarketPrice[]>(`/market-prices${qs({ crop, lat, lon })}`);
}

export function postProfitability(body: {
  crop: string;
  land_acres: number;
  seed_cost: number;
  fertilizer_cost: number;
  labor_cost: number;
  irrigation_cost: number;
  transport_cost: number;
  storage_cost: number;
  expected_yield_kg: number;
  market_price_per_kg: number;
}): Promise<ProfitabilityResponse> {
  return request<ProfitabilityResponse>("/profitability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function postCropRecommendation(body: {
  latitude: number;
  longitude: number;
  season: "Kharif" | "Rabi" | "Zaid";
  soil_type: string;
  ph: number;
  n: number;
  p: number;
  k: number;
  land_acres: number;
  water_availability: "LOW" | "MEDIUM" | "HIGH";
  budget_inr?: number;
}): Promise<CropRecommendationResponse> {
  return request<CropRecommendationResponse>("/crop-recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function postExpertRequest(body: {
  farm: FarmProfile;
  image_ref?: string;
  issue: string;
  risk_level?: "LOW" | "MEDIUM" | "HIGH";
  disease?: string;
  confidence?: number;
}): Promise<ExpertRequestResponse> {
  return request<ExpertRequestResponse>("/expert-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getSchemes(): Promise<Scheme[]> {
  return request<Scheme[]>("/schemes");
}

export function getHealth(): Promise<{ status: string; service: string }> {
  return request("/health", {}, 8000);
}
