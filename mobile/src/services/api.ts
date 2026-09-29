/**
 * FastAPI backend client.
 * All secrets stay server-side; the app only knows EXPO_PUBLIC_API_URL.
 * Read paths are cached so the app degrades gracefully offline.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const TIMEOUT_MS = 15000;

// ── In-memory cache (AsyncStorage-backed when available) ─────────
type CacheEntry = { value: any; savedAt: number };
const memCache = new Map<string, CacheEntry>();
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null; // Expo Go / web fallback: memory only
}

async function cacheGet(key: string): Promise<CacheEntry | null> {
  if (memCache.has(key)) return memCache.get(key)!;
  if (AsyncStorage) {
    try {
      const raw = await AsyncStorage.getItem(`agrisaarthi:${key}`);
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry;
        memCache.set(key, entry);
        return entry;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function cacheSet(key: string, value: any) {
  const entry: CacheEntry = { value, savedAt: Date.now() };
  memCache.set(key, entry);
  if (AsyncStorage) {
    try {
      await AsyncStorage.setItem(`agrisaarthi:${key}`, JSON.stringify(entry));
    } catch {
      /* ignore */
    }
  }
}

// ── Fetch wrapper ───────────────────────────────────────────────
export class ApiError extends Error {
  status?: number;
  offline: boolean;
  constructor(message: string, status?: number, offline = false) {
    super(message);
    this.status = status;
    this.offline = offline;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status);
    return (await res.json()) as T;
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('network', undefined, true);
  } finally {
    clearTimeout(timer);
  }
}

/** GET with offline cache: fresh data when online, last-saved when offline. */
async function cachedGet<T>(key: string, path: string): Promise<{ data: T; stale: boolean }> {
  try {
    const data = await request<T>(path);
    await cacheSet(key, data);
    return { data, stale: false };
  } catch (e) {
    const cached = await cacheGet(key);
    if (cached) return { data: cached.value as T, stale: true };
    throw e;
  }
}

// ── Types (mirror FastAPI Pydantic schemas) ─────────────────────
export interface TodayAction {
  priority: number;
  category: 'WEATHER' | 'DISEASE' | 'IRRIGATION' | 'MARKET' | 'CROP' | 'SCHEME' | 'INSURANCE' | 'TASK';
  title: string;
  reason: string;
  recommended_action: string;
  timestamp: string;
  status: 'pending' | 'done';
}

export interface DiseaseResult {
  disease: string;
  confidence: number; // 0..1
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | null;
  risk_score: number; // 0..100
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_factors: string[];
  recommended_action: string;
  model_version: string;
}

export interface CropCandidate {
  crop: string;
  suitability: number; // 0..100
  expected_yield_kg_per_acre: number;
  estimated_profit_inr: number;
  factors: string[];
}

export interface ChatReply {
  answer: string;
  language_detected?: string;
}

// ── Farm profile mapping (mobile camelCase → backend snake_case) ──
import type { FarmProfile } from './storage';

/** Backend FarmProfile shape. farmer_id defaults to 'demo' for SIH demo mode. */
export function toBackendFarm(p: FarmProfile) {
  return {
    farmer_id: 'demo',
    farmer_name: p.farmerName,
    location_name: p.location,
    latitude: p.lat ?? 18.5204,
    longitude: p.lng ?? 73.8567,
    land_acres: p.landAcres,
    soil_type: p.soilType,
    water_availability: p.water.toUpperCase(),
    crop: p.crop,
    crop_stage: p.cropStage,
    soil_ph: p.soilPh ?? null,
    soil_n: p.soilN ?? null,
    soil_p: p.soilP ?? null,
    soil_k: p.soilK ?? null,
  };
}

// ── Endpoints (match backend/routers 1:1) ─────────────────────────
export const api = {
  getTodayActions: (p: FarmProfile) => {
    const f = toBackendFarm(p);
    const qs = new URLSearchParams({
      farmer_name: f.farmer_name,
      location_name: f.location_name,
      latitude: String(f.latitude),
      longitude: String(f.longitude),
      land_acres: String(f.land_acres),
      crop: f.crop,
      crop_stage: f.crop_stage,
    }).toString();
    return cachedGet<TodayAction[]>(`today-actions:${f.crop}`, `/today-actions?${qs}`);
  },

  /** Multipart upload: backend validates format/size and runs the quality gate. */
  detectDisease: (imageUri: string, meta: { crop: string; stage: string }) => {
    const form = new FormData();
    // @ts-expect-error React Native FormData file
    form.append('image', { uri: imageUri, name: 'leaf.jpg', type: 'image/jpeg' });
    form.append('crop', meta.crop);
    return request<DiseaseResult>('/disease-detect', { method: 'POST', body: form });
  },

  cropRecommendation: async (input: Record<string, any>) => {
    const r = await request<{ ranked_crops: any[] }>('/crop-recommendation', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    // Normalize backend RankedCrop → mobile CropCandidate.
    const mapped: CropCandidate[] = r.ranked_crops.map((c: any) => ({
      crop: c.crop,
      suitability: c.suitability,
      expected_yield_kg_per_acre: c.expected_yield_per_acre_kg ?? 0,
      estimated_profit_inr: c.estimated_profit_inr ?? 0,
      factors: c.explanation_factors ?? [],
    }));
    return mapped;
  },

  askAssistant: (query: string, language: 'en' | 'hi' | 'mr', p: FarmProfile) =>
    request<{ answer: string; language_detected?: string }>('/assistant', {
      method: 'POST',
      body: JSON.stringify({ query, language, farm: toBackendFarm(p) }),
    }),

  getWeather: (lat: number, lon: number) =>
    cachedGet<any>(`weather:${lat},${lon}`, `/weather?lat=${lat}&lon=${lon}`),

  getFarmRisk: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    ).toString();
    return cachedGet<any>(`farm-risk:${qs}`, `/farm-risk?${qs}`);
  },

  irrigationAdvice: (
    p: FarmProfile,
    input: { soil_moisture_pct?: number; rain_probability_pct: number; temperature_c: number; humidity_pct: number },
  ) =>
    request<any>('/irrigation-advice', {
      method: 'POST',
      body: JSON.stringify({ farm: toBackendFarm(p), ...input }),
    }),

  getMarketPrices: (crop: string) =>
    cachedGet<any>(`market:${crop}`, `/market-prices?crop=${encodeURIComponent(crop)}`),

  profitability: (input: Record<string, any>) =>
    request<any>('/profitability', { method: 'POST', body: JSON.stringify(input) }),

  getSchemes: () => cachedGet<any[]>('schemes', '/schemes'),

  requestExpert: (p: FarmProfile, input: { issue: string; risk_level?: string; disease?: string; confidence?: number }) =>
    request<{ case_id: string; status: string }>('/expert-request', {
      method: 'POST',
      body: JSON.stringify({ farm: toBackendFarm(p), ...input }),
    }),
};

export const API_BASE_URL = BASE_URL;
