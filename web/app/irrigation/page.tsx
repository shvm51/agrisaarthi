"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Icon,
  NumberInput,
  PageHeader,
  useT,
} from "@/components/ui";
import { useSession } from "@/lib/session";
import { getWeather, postIrrigationAdvice } from "@/lib/api";
import type { IrrigationResponse } from "@/lib/api";
import { pct } from "@/lib/format";

const REC_TONE = {
  IRRIGATE: "info",
  WAIT: "low",
  CAUTION: "medium",
} as const;

const REC_ICON = {
  IRRIGATE: "drop",
  WAIT: "check",
  CAUTION: "alert",
} as const;

export default function IrrigationPage() {
  const router = useRouter();
  const t = useT();
  const { farm } = useSession();
  const [moisture, setMoisture] = useState("45");
  const [unknown, setUnknown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IrrigationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const w = await getWeather(farm.latitude, farm.longitude);
      const r = await postIrrigationAdvice({
        farm,
        soil_moisture_pct: unknown ? null : Number(moisture),
        rain_probability_pct: w.raw.rain_probability_pct,
        temperature_c: w.raw.temperature_c,
        humidity_pct: w.raw.humidity_pct,
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-5 pt-6 max-w-md mx-auto animate-rise">
      <PageHeader
        title={t("irrig.title")}
        subtitle={`${farm.crop} · ${farm.location_name}`}
        onBack={() => router.back()}
      />

      <div className="space-y-5">
        <Field label={t("irrig.soilMoisture")}>
          <NumberInput
            value={moisture}
            onChange={(e) => setMoisture(e.target.value)}
            min={0}
            max={100}
            disabled={unknown}
            placeholder="40"
            aria-label={t("irrig.soilMoisture")}
          />
        </Field>

        <label className="flex min-h-[48px] cursor-pointer select-none items-center gap-3">
          <input
            type="checkbox"
            checked={unknown}
            onChange={(e) => setUnknown(e.target.checked)}
            className="h-6 w-6 shrink-0 rounded accent-pine-700"
          />
          <span className="text-sm font-medium">{t("irrig.unknown")}</span>
        </label>

        <Button variant="primary" fullWidth size="lg" disabled={busy} onClick={submit}>
          {busy ? t("common.loading") : t("irrig.getAdvice")}
        </Button>
      </div>

      {error !== null ? (
        <div className="mt-4">
          <ErrorState
            title={t("common.noData")}
            body={error || t("common.tryAgain")}
            onRetry={submit}
          />
        </div>
      ) : null}

      {result ? (
        <Card className="mt-6 animate-rise">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-night-400">
            {t("irrig.recommendation")}
          </div>
          <div className="mt-2">
            <Badge
              tone={REC_TONE[result.recommendation]}
              icon={REC_ICON[result.recommendation]}
              className="px-4 py-2 text-sm"
            >
              {t(`irrig.${result.recommendation}`)}
            </Badge>
          </div>

          {result.soil_moisture_pct !== null ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-ink-500 dark:text-night-400">
                {t("irrig.soilMoisture")}
              </span>
              <span className="tnum font-bold text-ink-900 dark:text-night-100">
                {pct(result.soil_moisture_pct)}
              </span>
            </div>
          ) : null}

          <div className="mt-4">
            <div className="text-sm font-semibold">{t("irrig.why")}</div>
            <p className="mt-1 text-sm text-ink-600 dark:text-night-300">
              {result.reason}
            </p>
          </div>

          {result.crop_water_need_note ? (
            <p className="mt-3 text-sm text-ink-600 dark:text-night-300">
              {result.crop_water_need_note}
            </p>
          ) : null}

          <div className="mt-4 border-t border-cream-200 dark:border-night-700 pt-3">
            <div className="text-sm font-semibold">{t("irrig.source")}</div>
            <p className="mt-1 flex items-start gap-2 text-sm text-ink-600 dark:text-night-300">
              <Icon
                name="info"
                size={16}
                className="mt-0.5 shrink-0 text-pine-700 dark:text-pine-200"
              />
              {result.data_source === "sensor"
                ? t("irrig.sensorNote")
                : t("irrig.weatherNote")}
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
