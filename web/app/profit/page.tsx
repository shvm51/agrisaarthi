"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ErrorState,
  Field,
  NumberInput,
  PageHeader,
  SectionHeader,
  Stat,
  TextInput,
  useT,
} from "@/components/ui";
import { useSession } from "@/lib/session";
import { postProfitability } from "@/lib/api";
import type { ProfitabilityResponse } from "@/lib/api";
import { inr } from "@/lib/format";

const num = (s: string): number => {
  const v = Number(s);
  return Number.isFinite(v) ? v : 0;
};

export default function ProfitPage() {
  const router = useRouter();
  const t = useT();
  const { farm } = useSession();

  const [crop, setCrop] = useState(farm.crop);
  const [land, setLand] = useState(String(farm.land_acres));
  const [seed, setSeed] = useState("8000");
  const [fertilizer, setFertilizer] = useState("12000");
  const [labor, setLabor] = useState("15000");
  const [irrigation, setIrrigation] = useState("5000");
  const [transport, setTransport] = useState("3000");
  const [storage, setStorage] = useState("2000");
  const [yieldKg, setYieldKg] = useState("8000");
  const [price, setPrice] = useState("24");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProfitabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setResult(
        await postProfitability({
          crop: crop.trim(),
          land_acres: num(land),
          seed_cost: num(seed),
          fertilizer_cost: num(fertilizer),
          labor_cost: num(labor),
          irrigation_cost: num(irrigation),
          transport_cost: num(transport),
          storage_cost: num(storage),
          expected_yield_kg: num(yieldKg),
          market_price_per_kg: num(price),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  };

  const costFields = [
    { key: "profit.seed", value: seed, set: setSeed },
    { key: "profit.fertilizer", value: fertilizer, set: setFertilizer },
    { key: "profit.labor", value: labor, set: setLabor },
    { key: "profit.irrigation", value: irrigation, set: setIrrigation },
    { key: "profit.transport", value: transport, set: setTransport },
    { key: "profit.storage", value: storage, set: setStorage },
  ] as const;

  return (
    <div className="px-5 pt-6 max-w-md mx-auto animate-rise">
      <PageHeader title={t("profit.title")} onBack={() => router.back()} />

      <div className="space-y-5">
        <Field label={t("profit.crop")}>
          <TextInput value={crop} onChange={(e) => setCrop(e.target.value)} />
        </Field>

        <Field label={t("profit.landAcres")}>
          <NumberInput value={land} onChange={(e) => setLand(e.target.value)} min={0} />
        </Field>

        <div>
          <SectionHeader title={t("profit.costs")} />
          <div className="grid grid-cols-2 gap-3">
            {costFields.map((f) => (
              <Field key={f.key} label={t(f.key)}>
                <NumberInput
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  min={0}
                />
              </Field>
            ))}
          </div>
        </div>

        <Field label={t("profit.expectedYield")}>
          <NumberInput value={yieldKg} onChange={(e) => setYieldKg(e.target.value)} min={0} />
        </Field>

        <Field label={t("profit.price")}>
          <NumberInput value={price} onChange={(e) => setPrice(e.target.value)} min={0} />
        </Field>

        <Button variant="primary" fullWidth size="lg" disabled={busy} onClick={calculate}>
          {busy ? t("common.loading") : t("profit.calculate")}
        </Button>
      </div>

      {error !== null ? (
        <div className="mt-4">
          <ErrorState
            title={t("common.noData")}
            body={error || t("common.tryAgain")}
            onRetry={calculate}
          />
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 animate-rise">
          <div className="grid grid-cols-2 gap-3">
            <Stat label={t("profit.totalCost")} value={inr(result.total_cost)} />
            <Stat label={t("profit.revenue")} value={inr(result.expected_revenue)} />
            <Stat
              label={t("profit.profit")}
              value={inr(result.estimated_profit)}
              tone={result.estimated_profit >= 0 ? "good" : "bad"}
            />
            <Stat label={t("profit.perAcre")} value={inr(result.profit_per_acre)} />
          </div>
          <p className="mt-4 text-center text-xs text-ink-400 dark:text-night-500">
            {t("profit.disclaimer")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
