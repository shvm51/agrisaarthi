"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingCards,
  PageHeader,
  useT,
} from "@/components/ui";
import type { TKey } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { getMarketPrices } from "@/lib/api";
import type { MarketPrice } from "@/lib/api";
import { inr2 } from "@/lib/format";

interface PricedMarket extends MarketPrice {
  net: number;
}

const TRENDS: Record<
  MarketPrice["trend"],
  { tone: "low" | "high" | "neutral"; icon?: "trendUp" | "trendDown"; label: TKey }
> = {
  up: { tone: "low", icon: "trendUp", label: "market.trendUp" },
  down: { tone: "high", icon: "trendDown", label: "market.trendDown" },
  stable: { tone: "neutral", label: "market.trendStable" },
};

export default function MarketPage() {
  const router = useRouter();
  const t = useT();
  const { farm } = useSession();
  const [prices, setPrices] = useState<MarketPrice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPrices(await getMarketPrices(farm.crop, farm.latitude, farm.longitude));
    } catch (e) {
      setError(e instanceof Error ? e.message : "");
    } finally {
      setLoading(false);
    }
  }, [farm.crop, farm.latitude, farm.longitude]);

  useEffect(() => {
    load();
  }, [load]);

  const ranked: PricedMarket[] = useMemo(
    () =>
      (prices ?? [])
        .map((m) => ({ ...m, net: m.price_per_kg - m.transport_cost_per_kg }))
        .sort((a, b) => b.net - a.net),
    [prices],
  );

  return (
    <div className="px-5 pt-6 max-w-md mx-auto animate-rise">
      <PageHeader
        title={t("market.title")}
        subtitle={`${farm.crop} · ${farm.location_name}`}
        onBack={() => router.back()}
      />

      {loading ? (
        <LoadingCards count={3} />
      ) : error !== null ? (
        <ErrorState
          title={t("common.noData")}
          body={error || t("common.tryAgain")}
          onRetry={load}
        />
      ) : ranked.length === 0 ? (
        <EmptyState
          icon="tag"
          title={t("market.noMarkets")}
          body={t("market.noMarketsBody")}
        />
      ) : (
        <div className="space-y-3">
          {ranked.map((m, i) => {
            const trend = TRENDS[m.trend];
            const isBest = i === 0;
            return (
              <Card key={m.market} accent={isBest} className="animate-rise">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-ink-900 dark:text-night-100">
                      {m.market}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500 dark:text-night-400">
                      {t("market.away", { n: m.distance_km })}
                    </div>
                  </div>
                  {isBest ? (
                    <Badge tone="info" icon="check">
                      {t("market.best")}
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <span className="hero-num tnum text-3xl text-ink-900 dark:text-night-100">
                      {inr2(m.price_per_kg)}
                    </span>
                    <span className="ml-1 text-sm text-ink-500 dark:text-night-400">
                      {t("market.perKg")}
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge tone={trend.tone} icon={trend.icon}>
                      {t(trend.label)}
                    </Badge>
                    <div className="mt-1 text-[10px] font-medium tracking-wide text-ink-400 dark:text-night-500">
                      {t("common.estimatedTrend")}
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-cream-200 dark:border-night-700 pt-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-500 dark:text-night-400">
                      {t("market.net")}
                    </span>
                    <span className="tnum font-bold text-ink-900 dark:text-night-100">
                      {inr2(m.net)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-ink-500 dark:text-night-400">
                      {t("market.transport")}
                    </span>
                    <span className="tnum text-ink-700 dark:text-night-300">
                      {inr2(m.transport_cost_per_kg)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
