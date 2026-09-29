"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postCropRecommendation } from "@/lib/api";
import type { CropRecommendationResponse } from "@/lib/api";
import { useSession } from "@/lib/session";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  LoadingCards,
  NumberInput,
  PageHeader,
  SegmentedControl,
  Select,
  useT,
} from "@/components/ui";

type Season = "Kharif" | "Rabi" | "Zaid";
type Water = "LOW" | "MEDIUM" | "HIGH";

const SOIL_TYPES = ["Loamy", "Sandy", "Clay", "Black", "Silty"];

function toNum(v: string, fallback: number): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function RecommendPage() {
  const t = useT();
  const router = useRouter();
  const { farm } = useSession();

  const [soilType, setSoilType] = useState(farm.soil_type);
  const [ph, setPh] = useState(farm.soil_ph != null ? String(farm.soil_ph) : "");
  const [n, setN] = useState(farm.soil_n != null ? String(farm.soil_n) : "");
  const [p, setP] = useState(farm.soil_p != null ? String(farm.soil_p) : "");
  const [k, setK] = useState(farm.soil_k != null ? String(farm.soil_k) : "");
  const [season, setSeason] = useState<Season>("Kharif");
  const [water, setWater] = useState<Water>(farm.water_availability);
  const [land, setLand] = useState(String(farm.land_acres));
  const [budget, setBudget] = useState("");

  const [result, setResult] = useState<CropRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = {
        latitude: farm.latitude,
        longitude: farm.longitude,
        season,
        soil_type: soilType,
        ph: toNum(ph, 6.5),
        n: toNum(n, 0),
        p: toNum(p, 0),
        k: toNum(k, 0),
        land_acres: toNum(land, farm.land_acres),
        water_availability: water,
      };
      const b = parseFloat(budget);
      const res = await postCropRecommendation(
        Number.isFinite(b) && b > 0 ? { ...body, budget_inr: b } : body,
      );
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.tryAgain"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-rise px-5 pt-5 pb-8 space-y-6">
      <PageHeader title={t("rec.title")} onBack={() => router.back()} />

      {/* Input form */}
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("rec.soilType")}>
              <Select value={soilType} onChange={(e) => setSoilType(e.currentTarget.value)}>
                {SOIL_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("rec.ph")}>
              <NumberInput
                value={ph}
                min={0}
                max={14}
                step={0.1}
                placeholder="6.5"
                onChange={(e) => setPh(e.currentTarget.value)}
              />
            </Field>
            <Field label={t("rec.n")}>
              <NumberInput
                value={n}
                min={0}
                onChange={(e) => setN(e.currentTarget.value)}
              />
            </Field>
            <Field label={t("rec.p")}>
              <NumberInput
                value={p}
                min={0}
                onChange={(e) => setP(e.currentTarget.value)}
              />
            </Field>
            <Field label={t("rec.k")}>
              <NumberInput
                value={k}
                min={0}
                onChange={(e) => setK(e.currentTarget.value)}
              />
            </Field>
            <Field label={`${t("rec.landAcres")}`}>
              <NumberInput
                value={land}
                min={0.1}
                step={0.1}
                onChange={(e) => setLand(e.currentTarget.value)}
              />
            </Field>
          </div>
          <Field label={t("rec.season")}>
            <SegmentedControl<Season>
              ariaLabel={t("rec.season")}
              value={season}
              onChange={setSeason}
              options={[
                { value: "Kharif", label: t("rec.kharif") },
                { value: "Rabi", label: t("rec.rabi") },
                { value: "Zaid", label: t("rec.zaid") },
              ]}
            />
          </Field>
          <Field label={t("rec.water")}>
            <SegmentedControl<Water>
              ariaLabel={t("rec.water")}
              value={water}
              onChange={setWater}
              options={[
                { value: "LOW", label: t("farm.low") },
                { value: "MEDIUM", label: t("farm.medium") },
                { value: "HIGH", label: t("farm.high") },
              ]}
            />
          </Field>
          <Field label={t("rec.budget")} hint={t("common.optional")}>
            <NumberInput
              value={budget}
              min={0}
              placeholder="₹"
              onChange={(e) => setBudget(e.currentTarget.value)}
            />
          </Field>
          <Button fullWidth onClick={run} disabled={loading}>
            <Icon name="leaf" size={18} /> {t("rec.get")}
          </Button>
        </div>
      </Card>

      {/* Results */}
      <section aria-label={t("rec.title")}>
        {loading ? (
          <LoadingCards count={3} />
        ) : error ? (
          <ErrorState title={t("rec.title")} body={error} onRetry={run} />
        ) : result && result.ranked_crops.length > 0 ? (
          <div className="space-y-3">
            {result.ranked_crops.map((c, i) => {
              const suitability = Math.max(0, Math.min(100, Math.round(c.suitability)));
              return (
                <Card key={`${c.crop}-${i}`} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="tnum hero-num text-2xl text-pine-800 dark:text-pine-100 w-8 shrink-0">
                      {i + 1}
                    </span>
                    <h3 className="flex-1 text-base font-bold">{c.crop}</h3>
                    <span className="tnum text-base font-bold text-pine-800 dark:text-emerald-300">
                      {suitability}% <span className="text-xs font-medium">{t("rec.suitability")}</span>
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-night-700"
                    role="progressbar"
                    aria-valuenow={suitability}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${c.crop} ${t("rec.suitability")}`}
                  >
                    <div className="h-full rounded-full bg-pine-700" style={{ width: `${suitability}%` }} />
                  </div>
                  <p className="text-sm text-ink-600 dark:text-night-300">
                    {t("rec.expYield")}:{" "}
                    <span className="tnum font-semibold text-ink-900 dark:text-night-100">
                      {Math.round(c.expected_yield_per_acre_kg).toLocaleString("en-IN")} kg/acre
                    </span>
                  </p>
                  {c.explanation_factors.length > 0 ? (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-ink-500 dark:text-night-400">
                        {t("rec.why")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {c.explanation_factors.map((f, j) => (
                          <Chip key={j}>{f}</Chip>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </Card>
              );
            })}
            <p className="px-1 text-xs leading-relaxed text-ink-500 dark:text-night-400">
              {result.disclaimer || t("rec.disclaimer")}
            </p>
          </div>
        ) : (
          <EmptyState icon="leaf" title={t("rec.title")} body={t("rec.disclaimer")} />
        )}
      </section>
    </div>
  );
}
