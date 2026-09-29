/**
 * Local farm-profile persistence.
 * Uses AsyncStorage when installed, otherwise an in-memory fallback.
 * (Supabase is the source of truth server-side; this is the offline copy.)
 */

export interface FarmProfile {
  farmerName: string;
  location: string;
  lat?: number;
  lng?: number;
  landAcres: number;
  soilType: string;
  water: 'low' | 'medium' | 'high';
  crop: string;
  cropStage: string;
  soilPh?: number;
  soilN?: number;
  soilP?: number;
  soilK?: number;
  onboarded: boolean;
  updatedAt: string;
}

const KEY = 'farm-profile';
const mem = new Map<string, string>();

let AsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null;
}

async function getItem(k: string): Promise<string | null> {
  if (mem.has(k)) return mem.get(k)!;
  if (AsyncStorage) {
    try {
      return await AsyncStorage.getItem(`agrisaarthi:${k}`);
    } catch {
      return null;
    }
  }
  return null;
}

async function setItem(k: string, v: string) {
  mem.set(k, v);
  if (AsyncStorage) {
    try {
      await AsyncStorage.setItem(`agrisaarthi:${k}`, v);
    } catch {
      /* ignore */
    }
  }
}

export async function saveFarmProfile(p: FarmProfile): Promise<void> {
  await setItem(KEY, JSON.stringify({ ...p, updatedAt: new Date().toISOString() }));
  // TODO: POST /farm-profile → Supabase (profiles + farms + soil_data tables)
}

export async function getFarmProfile(): Promise<FarmProfile | null> {
  const raw = await getItem(KEY);
  return raw ? (JSON.parse(raw) as FarmProfile) : null;
}

export async function clearFarmProfile(): Promise<void> {
  mem.delete(KEY);
  if (AsyncStorage) {
    try {
      await AsyncStorage.removeItem(`agrisaarthi:${KEY}`);
    } catch {
      /* ignore */
    }
  }
}

/** Demo farmer for SIH judging — pre-seeded when nothing is saved. */
export const DEMO_PROFILE: FarmProfile = {
  farmerName: 'Ramesh Patil',
  location: 'Pune, Maharashtra',
  lat: 18.5204,
  lng: 73.8567,
  landAcres: 2.5,
  soilType: 'black',
  water: 'medium',
  crop: 'Tomato',
  cropStage: 'Fruiting',
  soilPh: 6.8,
  soilN: 42,
  soilP: 28,
  soilK: 160,
  onboarded: true,
  updatedAt: new Date().toISOString(),
};
