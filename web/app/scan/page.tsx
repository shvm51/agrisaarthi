"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  ProgressSteps,
  RiskMeter,
  SectionHeader,
  Sheet,
  Skeleton,
  useT,
} from "@/components/ui";
import type { DiseaseDetectResponse, FarmRiskResponse } from "@/lib/api";
import { getFarmRisk, postDiseaseDetect } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useLang } from "@/lib/i18n";

type Stage = "idle" | "preview" | "analyzing" | "result";

interface ScanRecord {
  ts: number;
  disease: string | null;
  confidence: number;
  severity: string | null;
}

const SCANS_KEY = "agrisaarthi.scans";
const MAX_HISTORY = 20;
const STEP_KEYS = [
  "scan.step.uploading",
  "scan.step.checking",
  "scan.step.analyzing",
  "scan.step.risk",
  "scan.step.recommendation",
];

/** Confidence may arrive as 0–1 or 0–100; normalize for display. */
function pct(c: number): number {
  return Math.round(c <= 1 ? c * 100 : c);
}

function severityTone(s: "MILD" | "MODERATE" | "SEVERE"): "high" | "medium" | "low" {
  return s === "SEVERE" ? "high" : s === "MODERATE" ? "medium" : "low";
}

/** Downscale to max 1024px and re-encode as JPEG before upload. */
function prepImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1024;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
        "image/jpeg",
        0.8,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

export default function ScanPage() {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const { farm } = useSession();

  const [stage, setStage] = useState<Stage>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<DiseaseDetectResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [riskOpen, setRiskOpen] = useState(false);
  const [risk, setRisk] = useState<FarmRiskResponse | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState(false);

  const fileRef = useRef<File | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const steps = STEP_KEYS.map((k) => t(k));

  /* ---------------- scan history (local) ---------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCANS_KEY);
      if (raw) {
        const arr: unknown = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setHistory(
            arr
              .filter((r): r is ScanRecord => !!r && typeof (r as ScanRecord).ts === "number")
              .slice(0, MAX_HISTORY),
          );
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistScan = useCallback((res: DiseaseDetectResponse) => {
    const rec: ScanRecord = {
      ts: Date.now(),
      disease: res.disease,
      confidence: res.confidence,
      severity: res.severity,
    };
    try {
      const raw = localStorage.getItem(SCANS_KEY);
      const arr: unknown = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(arr) ? arr : [];
      const next = [rec, ...list].slice(0, MAX_HISTORY);
      localStorage.setItem(SCANS_KEY, JSON.stringify(next));
      setHistory(
        next.filter((r): r is ScanRecord => !!r && typeof (r as ScanRecord).ts === "number"),
      );
    } catch {
      /* ignore */
    }
  }, []);

  /* ---------------- preview lifecycle ---------------- */
  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  useEffect(() => revokePreview, [revokePreview]);

  function goIdle() {
    revokePreview();
    fileRef.current = null;
    setResult(null);
    setFailed(false);
    setStage("idle");
  }

  function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    fileRef.current = f;
    revokePreview();
    const url = URL.createObjectURL(f);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setFailed(false);
    setResult(null);
    setStage("preview");
  }

  /* ---------------- analysis: progress steps + API call ---------------- */
  useEffect(() => {
    if (stage !== "analyzing") return;
    setStepIdx(0);
    const timer = window.setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEP_KEYS.length - 1));
    }, 900);
    let cancelled = false;
    (async () => {
      try {
        const file = fileRef.current;
        if (!file) throw new Error("No photo selected");
        const blob = await prepImage(file);
        const res = await postDiseaseDetect(blob);
        if (cancelled) return;
        setResult(res);
        if (res.confident) persistScan(res);
        setStepIdx(STEP_KEYS.length - 1);
        setStage("result");
      } catch {
        if (!cancelled) {
          setFailed(true);
          setStage("result");
        }
      }
    })();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [stage, persistScan]);

  /* ---------------- contextual risk sheet ---------------- */
  async function fetchRisk() {
    if (!result) return;
    setRiskLoading(true);
    setRiskError(false);
    try {
      const r = await getFarmRisk({
        disease_probability: result.confidence,
        confidence: result.confidence,
        severity: result.severity ?? undefined,
        crop_stage: farm.crop_stage,
      });
      setRisk(r);
    } catch {
      setRiskError(true);
    } finally {
      setRiskLoading(false);
    }
  }

  function openRisk() {
    setRisk(null);
    setRiskOpen(true);
    void fetchRisk();
  }

  function goExpert(issue: string) {
    router.push(`/expert?issue=${encodeURIComponent(issue)}`);
  }

  function formatTs(ts: number): string {
    const locale = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
    const d = new Date(ts);
    return `${d.toLocaleDateString(locale, { day: "numeric", month: "short" })}, ${d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}`;
  }

  const confident = !!result && result.confident && !!result.disease;
  const lowConfQuality =
    !!result && !confident && /blur|quality/i.test(result.message || "");
  const lowConfTitle = lowConfQuality ? t("scan.qualityTitle") : t("scan.lowConfTitle");
  const lowConfBody = lowConfQuality ? t("scan.qualityBody") : t("scan.lowConfBody");

  return (
    <>
      <main className="px-4 pt-4 pb-6">
        <div key={stage} className="animate-rise">
          {stage === "idle" && (
            <>
              <PageHeader title={t("scan.title")} />
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Icon name="camera" size={22} />
                  {t("scan.takePhoto")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <Icon name="image" size={22} />
                  {t("scan.upload")}
                </Button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={onFileSelected}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={onFileSelected}
              />
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-gold-100/60 dark:bg-gold-500/10 px-4 py-3">
                <Icon name="info" size={18} className="mt-0.5 text-gold-700 dark:text-amber-200" />
                <p className="text-sm text-ink-700 dark:text-night-100">{t("scan.tip")}</p>
              </div>
              <div className="mt-8">
                <SectionHeader title={t("scan.history")} />
                {history.length === 0 ? (
                  <EmptyState
                    icon="scan"
                    title={t("scan.noScans")}
                    body={t("scan.noScansBody")}
                  />
                ) : (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div
                        key={h.ts}
                        className="flex items-center gap-3 rounded-2xl bg-cream-100 border border-cream-200 dark:bg-night-800 dark:border-night-700 px-4 py-2.5 min-h-[56px]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-pine-100 dark:bg-night-700 text-pine-800 dark:text-pine-100 flex items-center justify-center shrink-0">
                          <Icon name="scan" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{h.disease ?? "—"}</div>
                          <div className="text-xs text-ink-500 dark:text-night-400">
                            {formatTs(h.ts)}
                          </div>
                        </div>
                        <span className="tnum text-sm font-bold shrink-0">
                          {pct(h.confidence)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {stage === "preview" && (
            <>
              <PageHeader title={t("scan.preview")} onBack={goIdle} />
              <div className="rounded-2xl overflow-hidden border border-cream-200 dark:border-night-700 bg-ink-900">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={t("scan.preview")}
                    className="w-full max-h-[55dvh] object-contain"
                  />
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="outline" size="lg" fullWidth onClick={goIdle}>
                  {t("scan.retake")}
                </Button>
                <Button variant="primary" size="lg" fullWidth onClick={() => setStage("analyzing")}>
                  {t("scan.usePhoto")}
                </Button>
              </div>
            </>
          )}

          {stage === "analyzing" && (
            <>
              <PageHeader title={t("scan.title")} />
              <div className="viewfinder rounded-2xl overflow-hidden border border-cream-200 dark:border-night-700 bg-ink-900">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="w-full max-h-[45dvh] object-cover opacity-90"
                  />
                ) : null}
              </div>
              <Card className="mt-4">
                <p className="font-bold mb-3">{t("scan.analyzing")}</p>
                <ProgressSteps steps={steps} current={stepIdx} />
              </Card>
            </>
          )}

          {stage === "result" && (
            <>
              <PageHeader title={t("scan.result")} onBack={goIdle} />
              {failed || !result ? (
                <ErrorState
                  title={t("scan.errorTitle")}
                  body={t("scan.errorBody")}
                  onRetry={goIdle}
                />
              ) : confident ? (
                <Card>
                  <h2 className="text-xl font-bold leading-snug">
                    {t("common.probable")} {result.disease}
                  </h2>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{t("scan.confidence")}</span>
                      <span className="tnum font-bold">{pct(result.confidence)}%</span>
                    </div>
                    <div
                      className="mt-1.5 h-2.5 rounded-full bg-cream-200 dark:bg-night-700 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct(result.confidence)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={t("scan.confidence")}
                    >
                      <div
                        className="h-full rounded-full bg-pine-700 dark:bg-pine-600"
                        style={{ width: `${pct(result.confidence)}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {result.severity ? (
                      <span className="text-sm font-semibold text-ink-500 dark:text-night-400">
                        {t("scan.severity")}:
                      </span>
                    ) : null}
                    {result.severity ? (
                      <Badge tone={severityTone(result.severity)} icon="alert">
                        {t(`scan.sev.${result.severity}`)}
                      </Badge>
                    ) : null}
                    <Chip>
                      <Icon name="info" size={14} />
                      {t("scan.model")}: {result.model_version}
                    </Chip>
                  </div>
                  <div className="mt-5 space-y-2.5">
                    <Button variant="primary" fullWidth onClick={openRisk}>
                      <Icon name="shield" size={18} />
                      {t("scan.viewRisk")}
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => goExpert(`${t("scan.title")} — ${result.disease ?? ""}`)}
                    >
                      <Icon name="send" size={18} />
                      {t("scan.expertCta")}
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-risk-100 text-risk-600 dark:bg-risk-500/20 dark:text-orange-300 flex items-center justify-center shrink-0">
                      <Icon name="alert" size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{lowConfTitle}</h2>
                      <p className="mt-1 text-sm text-ink-600 dark:text-night-400">{lowConfBody}</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2.5">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => goExpert(`${t("scan.title")} — ${lowConfTitle}`)}
                    >
                      <Icon name="send" size={18} />
                      {t("scan.expertCta")}
                    </Button>
                    <Button variant="outline" fullWidth onClick={goIdle}>
                      {t("scan.retake")}
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      <Sheet open={riskOpen} onClose={() => setRiskOpen(false)} title={t("scan.viewRisk")}>
        {riskLoading ? (
          <div className="space-y-2" aria-label={t("common.loading")}>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : riskError || !risk ? (
          <ErrorState
            title={t("common.noData")}
            body={t("common.tryAgain")}
            onRetry={() => void fetchRisk()}
          />
        ) : (
          <div className="space-y-5">
            <RiskMeter score={risk.risk_score} level={risk.risk_level} />
            {risk.risk_factors.length > 0 ? (
              <div>
                <h3 className="text-sm font-bold mb-2">{t("irrig.why")}</h3>
                <ul className="space-y-1.5">
                  {risk.risk_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Icon
                        name="info"
                        size={16}
                        className="mt-0.5 text-pine-700 dark:text-pine-200 shrink-0"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="rounded-2xl bg-pine-100 dark:bg-night-700 p-4">
              <div className="text-xs font-bold tracking-wide text-pine-800 dark:text-pine-200 mb-1">
                {t("irrig.recommendation")}
              </div>
              <p className="text-sm font-medium leading-relaxed">{risk.recommended_action}</p>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
