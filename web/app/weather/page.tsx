"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  ErrorState,
  Icon,
  LoadingCards,
  PageHeader,
  SectionHeader,
  useT,
} from "@/components/ui";
import { useSession } from "@/lib/session";
import { getWeather } from "@/lib/api";
import type { WeatherResponse } from "@/lib/api";
import { pct } from "@/lib/format";

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: "drop" | "rain" | "wind";
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-cream-200/70 dark:bg-night-700/70 px-2 py-3 text-center">
      <Icon name={icon} size={18} className="mx-auto text-pine-700 dark:text-pine-200" />
      <div className="mt-1.5 text-[11px] font-medium leading-tight text-ink-500 dark:text-night-400">
        {label}
      </div>
      <div className="tnum mt-0.5 text-base font-bold text-ink-900 dark:text-night-100">
        {value}
      </div>
    </div>
  );
}

function InsightRow({
  icon,
  label,
  text,
}: {
  icon: "drop" | "wind" | "alert";
  label: string;
  text: string;
}) {
  return (
    <Card>
      <div className="flex gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-pine-100 text-pine-800 dark:bg-night-700 dark:text-pine-100 flex items-center justify-center">
          <Icon name={icon} size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold">{label}</div>
          <p className="mt-0.5 text-sm text-ink-600 dark:text-night-300">{text}</p>
        </div>
      </div>
    </Card>
  );
}

export default function WeatherPage() {
  const router = useRouter();
  const t = useT();
  const { farm } = useSession();
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getWeather(farm.latitude, farm.longitude));
    } catch (e) {
      setError(e instanceof Error ? e.message : "");
    } finally {
      setLoading(false);
    }
  }, [farm.latitude, farm.longitude]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="px-5 pt-6 max-w-md mx-auto animate-rise">
      <PageHeader
        title={t("weather.title")}
        subtitle={farm.location_name}
        onBack={() => router.back()}
      />

      {loading ? (
        <LoadingCards count={3} />
      ) : error !== null || !data ? (
        <ErrorState
          title={t("common.noData")}
          body={error || t("common.tryAgain")}
          onRetry={load}
        />
      ) : (
        <>
          <Card>
            <div className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-night-400">
              {t("weather.now")}
            </div>
            <div className="hero-num tnum mt-1 text-6xl text-ink-900 dark:text-night-100">
              {Math.round(data.raw.temperature_c)}
              <span className="text-3xl text-ink-400 dark:text-night-500">°C</span>
            </div>
            <div className="mt-1 text-base font-medium">{data.raw.condition}</div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <MiniStat
                icon="drop"
                label={t("weather.humidity")}
                value={pct(data.raw.humidity_pct)}
              />
              <MiniStat
                icon="rain"
                label={t("weather.rain")}
                value={pct(data.raw.rain_probability_pct)}
              />
              <MiniStat
                icon="wind"
                label={t("weather.wind")}
                value={`${Math.round(data.raw.wind_kmh)} km/h`}
              />
            </div>
          </Card>

          <div className="mt-6">
            <SectionHeader title={t("weather.forecast")} />
            <div className="grid grid-cols-3 gap-2.5">
              {data.raw.forecast.slice(0, 3).map((f, i) => (
                <Card key={`${f.day}-${i}`} className="text-center">
                  <div className="text-xs font-semibold text-ink-500 dark:text-night-400">
                    {f.day}
                  </div>
                  <div className="hero-num tnum mt-1 text-2xl text-ink-900 dark:text-night-100">
                    {Math.round(f.temp_c)}°
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-xs text-ink-500 dark:text-night-400">
                    <Icon
                      name="drop"
                      size={13}
                      className="text-pine-700 dark:text-pine-200"
                    />
                    <span className="tnum">{pct(f.rain_pct)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <SectionHeader title={t("weather.interpretation")} />
            <div className="space-y-3">
              <InsightRow
                icon="drop"
                label={t("weather.irrigation")}
                text={data.agri_interpretation.irrigation_advice}
              />
              <InsightRow
                icon="wind"
                label={t("weather.spraying")}
                text={data.agri_interpretation.spraying_advice}
              />
              <InsightRow
                icon="alert"
                label={t("weather.disease")}
                text={data.agri_interpretation.disease_note}
              />
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-ink-400 dark:text-night-500">
            {t("weather.disclaimer")}
          </p>
        </>
      )}
    </div>
  );
}
