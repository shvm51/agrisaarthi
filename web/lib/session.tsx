/**
 * Session + farm profile state.
 *
 * Demo-first: without Supabase configured, the app runs as the demo farmer
 * (Ramesh Patil) with the profile persisted in localStorage. When Supabase
 * is connected, Supabase Auth owns the session and the farm profile syncs
 * to the `farms` table (RLS: owner-only).
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { FarmProfile } from "./api";
import { DEMO_MODE } from "./api";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export const DEMO_FARM: FarmProfile = {
  farmer_id: "demo-farmer-1",
  farmer_name: "Ramesh Patil",
  location_name: "Pune, Maharashtra",
  latitude: 18.5204,
  longitude: 73.8567,
  land_acres: 2.5,
  soil_type: "Loamy",
  water_availability: "MEDIUM",
  crop: "Tomato",
  crop_stage: "Fruiting",
  soil_ph: 6.5,
  soil_n: 50,
  soil_p: 30,
  soil_k: 40,
};

const FARM_KEY = "agrisaarthi.farm";

interface SessionValue {
  farm: FarmProfile;
  updateFarm: (patch: Partial<FarmProfile>) => void;
  resetFarm: () => void;
  demoMode: boolean;
  userEmail: string | null;
  authReady: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue>({
  farm: DEMO_FARM,
  updateFarm: () => {},
  resetFarm: () => {},
  demoMode: true,
  userEmail: null,
  authReady: false,
  signOut: async () => {},
});

function loadFarm(): FarmProfile {
  try {
    const raw = localStorage.getItem(FARM_KEY);
    if (raw) return { ...DEMO_FARM, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEMO_FARM;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [farm, setFarm] = useState<FarmProfile>(DEMO_FARM);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const demoMode = DEMO_MODE;

  useEffect(() => {
    setFarm(loadFarm());
    const sb = getSupabase();
    if (!sb) {
      setAuthReady(true);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
      setAuthReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const updateFarm = useCallback((patch: Partial<FarmProfile>) => {
    setFarm((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(FARM_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      // When Supabase is connected, the profile also upserts to `farms`
      // (owner-only RLS). Kept best-effort so demo never blocks.
      const sb = getSupabase();
      if (sb && isSupabaseConfigured()) {
        sb.auth.getUser().then(({ data }) => {
          const uid = data.user?.id;
          if (!uid) return;
          sb.from("farms").upsert(
            {
              owner_id: uid,
              farmer_name: next.farmer_name,
              location_name: next.location_name,
              latitude: next.latitude,
              longitude: next.longitude,
              land_acres: next.land_acres,
              soil_type: next.soil_type,
              water_availability: next.water_availability,
              crop: next.crop,
              crop_stage: next.crop_stage,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "owner_id" },
          ).then(() => {});
        });
      }
      return next;
    });
  }, []);

  const resetFarm = useCallback(() => {
    setFarm(DEMO_FARM);
    try {
      localStorage.removeItem(FARM_KEY);
    } catch { /* ignore */ }
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUserEmail(null);
    resetFarm();
  }, [resetFarm]);

  return (
    <SessionContext.Provider
      value={{ farm, updateFarm, resetFarm, demoMode, userEmail, authReady, signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}
