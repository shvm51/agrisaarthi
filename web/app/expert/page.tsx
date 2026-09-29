"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Field,
  Icon,
  PageHeader,
  SegmentedControl,
  TextArea,
  useT,
} from "@/components/ui";
import { useSession } from "@/lib/session";
import { postExpertRequest } from "@/lib/api";
import type { ExpertRequestResponse } from "@/lib/api";
import { pct } from "@/lib/format";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface StoredScan {
  disease?: string | null;
  confidence?: number;
  imageRef?: string;
  timestamp?: string;
}

export default function ExpertPage() {
  const router = useRouter();
  const t = useT();
  const { farm } = useSession();

  const [issue, setIssue] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("MEDIUM");
  const [scan, setScan] = useState<StoredScan | null>(null);
  const [attach, setAttach] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ExpertRequestResponse | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("agrisaarthi.scans");
      if (raw) {
        const arr: unknown = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          setScan(arr[0] as StoredScan);
        }
      }
    } catch {
      /* no usable scan history */
    }
    try {
      const q = new URLSearchParams(window.location.search).get("issue");
      if (q) setIssue(q);
    } catch {
      /* ignore */
    }
  }, []);

  const submit = async () => {
    if (busy || !issue.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload: {
        farm: typeof farm;
        issue: string;
        risk_level: RiskLevel;
        disease?: string;
        confidence?: number;
      } = {
        farm,
        issue: issue.trim(),
        risk_level: riskLevel,
      };
      if (attach && scan?.disease) {
        payload.disease = scan.disease;
        payload.confidence = scan.confidence ?? 0;
      }
      setSuccess(await postExpertRequest(payload));
    } catch (e) {
      setError(e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-5 pt-6 max-w-md mx-auto animate-rise">
      <PageHeader title={t("expert.title")} onBack={() => router.back()} />

      {success ? (
        <Card className="animate-rise py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-100 text-pine-800 dark:bg-night-700 dark:text-pine-100">
            <Icon name="check" size={28} />
          </div>
          <h2 className="mt-4 text-lg font-bold">{t("expert.success")}</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-night-400">
            {t("expert.successBody")}
          </p>
          <p className="mt-2 font-mono text-sm font-semibold text-pine-800 dark:text-pine-100">
            {success.case_id}
          </p>
          <Button
            variant="primary"
            fullWidth
            size="lg"
            className="mt-6"
            onClick={() => router.push("/")}
          >
            {t("nav.home")}
          </Button>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-100 text-pine-800 dark:bg-night-700 dark:text-pine-100">
                <Icon name="shield" size={20} />
              </div>
              <p className="text-sm text-ink-600 dark:text-night-300">
                {t("expert.when")}
              </p>
            </div>
          </Card>

          <Field label={t("expert.issue")}>
            <TextArea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder={t("expert.issuePh")}
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-semibold">
              {t("expert.riskLevel")}
            </span>
            <SegmentedControl<RiskLevel>
              ariaLabel={t("expert.riskLevel")}
              value={riskLevel}
              onChange={setRiskLevel}
              options={[
                { value: "LOW", label: t("common.low") },
                { value: "MEDIUM", label: t("common.medium") },
                { value: "HIGH", label: t("common.high") },
              ]}
            />
          </div>

          {scan?.disease ? (
            <div className="space-y-3 rounded-2xl border border-cream-200 bg-cream-100 p-4 dark:border-night-700 dark:bg-night-800">
              <Chip>
                <Icon name="scan" size={16} />
                <span className="font-semibold">{scan.disease}</span>
                <span className="tnum text-ink-500 dark:text-night-400">
                  {pct(scan.confidence ?? 0)}
                </span>
              </Chip>
              <label className="flex min-h-[48px] cursor-pointer select-none items-center gap-3">
                <input
                  type="checkbox"
                  checked={attach}
                  onChange={(e) => setAttach(e.target.checked)}
                  className="h-6 w-6 shrink-0 rounded accent-pine-700"
                />
                <span className="text-sm font-medium">{t("expert.attachScan")}</span>
              </label>
            </div>
          ) : null}

          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={busy || !issue.trim()}
            onClick={submit}
          >
            {busy ? t("common.loading") : t("expert.submit")}
          </Button>

          {error !== null ? (
            <ErrorState
              title={t("common.noData")}
              body={error || t("common.tryAgain")}
              onRetry={submit}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
