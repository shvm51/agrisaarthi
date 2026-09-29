"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodayActions } from "@/lib/api";
import type { TodayAction, ActionCategory } from "@/lib/api";
import { useSession } from "@/lib/session";
import { greetingKey, timeAgo } from "@/lib/format";
import { DemoBadge } from "@/components/app-shell";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Icon,
  LoadingCards,
  SectionHeader,
  TextInput,
  useT,
} from "@/components/ui";

const CATEGORY_ICON: Record<ActionCategory, "rain" | "alert" | "drop" | "tag" | "leaf" | "info" | "globe" | "shield"> = {
  WEATHER: "rain",
  DISEASE: "alert",
  IRRIGATION: "drop",
  MARKET: "tag",
  CROP: "leaf",
  SCHEME: "globe",
  INSURANCE: "shield",
  TASK: "info",
};

function categoryTone(category: ActionCategory, priority: number): "high" | "info" | "neutral" {
  if (category === "MARKET") return "info";
  if ((category === "DISEASE" || category === "WEATHER") && priority <= 2) return "high";
  return "neutral";
}

function ActionCard({
  action,
  expanded,
  onToggle,
}: {
  action: TodayAction;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  return (
    <Card accent={action.priority === 1} onClick={onToggle} className="animate-rise">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={categoryTone(action.category, action.priority)} icon={CATEGORY_ICON[action.category]}>
          {t("cat." + action.category)}
        </Badge>
        <span className="text-xs font-semibold text-ink-500 dark:text-night-400 shrink-0">
          {t("home.priority", { n: action.priority })}
        </span>
      </div>
      <h3 className="mt-2.5 text-base font-semibold leading-snug">{action.title}</h3>
      {expanded ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-ink-600 dark:text-night-300">{action.reason}</p>
          <p className="flex items-start gap-2 text-sm font-medium text-pine-700 dark:text-emerald-300">
            <Icon name="check" size={17} strokeWidth={2.4} className="mt-0.5" />
            <span>{action.recommended_action}</span>
          </p>
        </div>
      ) : null}
      <span className="sr-only">{expanded ? t("common.close") : t("common.viewDetails")}</span>
    </Card>
  );
}

export default function HomePage() {
  const t = useT();
  const router = useRouter();
  const { farm } = useSession();
  const [actions, setActions] = useState<TodayAction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getTodayActions(farm);
      const sorted = [...data].sort((a, b) => a.priority - b.priority).slice(0, 5);
      setActions(sorted);
      setExpandedIdx(sorted.length > 0 ? 0 : null);
      setSyncedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.tryAgain"));
    }
  }, [farm, t]);

  useEffect(() => {
    load();
  }, [load]);

  const submitAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/ai?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="animate-rise px-5 pt-5 pb-4 space-y-6">
      {/* Header */}
      <header>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-ink-500 dark:text-night-400">
            {t(greetingKey(new Date().getHours()))}
          </p>
          <DemoBadge />
        </div>
        <h1 className="mt-1 text-[28px] leading-tight font-bold">{farm.farmer_name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip>
            <Icon name="globe" size={14} />
            {farm.location_name}
          </Chip>
          <Chip>
            <Icon name="leaf" size={14} />
            {farm.crop} · {t("stage." + farm.crop_stage)}
          </Chip>
        </div>
      </header>

      {/* What should I do today? */}
      <section aria-label={t("home.today")}>
        <SectionHeader title={t("home.today")} />
        {error ? (
          <ErrorState title={t("home.today")} body={error} onRetry={load} />
        ) : actions === null ? (
          <LoadingCards count={4} />
        ) : actions.length === 0 ? (
          <EmptyState icon="leaf" title={t("home.empty")} body={t("home.emptyBody")} />
        ) : (
          <div className="space-y-3">
            {actions.map((a, i) => (
              <ActionCard
                key={`${a.category}-${a.priority}-${i}`}
                action={a}
                expanded={expandedIdx === i}
                onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
              />
            ))}
          </div>
        )}
        {syncedAt ? (
          <p className="mt-3 text-center text-xs text-ink-500 dark:text-night-400">
            {t("common.lastSynced")} · <span className="tnum">{timeAgo(syncedAt)}</span>
          </p>
        ) : null}
      </section>

      {/* Ask AgriSaarthi — sticky above bottom nav */}
      <div className="sticky bottom-[92px] z-30">
        <p className="mb-2 px-1 text-sm font-semibold">{t("home.askAi")}</p>
        <form
          onSubmit={submitAsk}
          className="flex items-center gap-2 rounded-2xl border border-cream-200 bg-cream-100 p-2 shadow-[var(--shadow-card)] dark:border-night-700 dark:bg-night-800"
        >
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder={t("home.askPlaceholder")}
            aria-label={t("home.askAi")}
            enterKeyHint="go"
            className="!border-0 !bg-transparent !shadow-none flex-1"
          />
          <Button type="submit" size="sm" disabled={!query.trim()} className="!px-4 shrink-0">
            <Icon name="send" size={18} />
            <span className="sr-only">{t("home.askAi")}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
