/**
 * AgriSaarthi design-system primitives.
 * Every screen composes these — no one-off styling in pages.
 */
"use client";

import { useEffect, type ReactNode } from "react";
import { useLang, type TKey } from "@/lib/i18n";

/* ---------------- Icons (inline SVG, 24px grid) ---------------- */

const PATHS: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />,
  farm: <path d="M12 21v-8m0 0c0-4 3-7 8-7 0 4-3 7-8 7Zm0 0c0-4-3-7-8-7 0 4 3 7 8 7Z" strokeLinecap="round" strokeLinejoin="round" />,
  scan: <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16" strokeLinecap="round" />,
  ai: <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6.3 6.3l2.8 2.8m8.8 8.8 2.8 2.8m0-15.4-2.8 2.8M9.1 14.9l-2.8 2.8" strokeLinecap="round" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={2.5} strokeLinecap="round" />,
  back: <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />,
  next: <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />,
  alert: <path d="M12 3 2.5 20h19L12 3Zm0 7v4m0 3.5h.01" strokeLinecap="round" strokeLinejoin="round" />,
  check: <path d="m4.5 12.5 5 5 10-11" strokeLinecap="round" strokeLinejoin="round" />,
  rain: <path d="M7 15a5 5 0 1 1 .8-9.93A6 6 0 0 1 19 8a4 4 0 0 1-1 7.87M8 18v2.5M12 18v2.5M16 18v2.5" strokeLinecap="round" />,
  drop: <path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11Z" strokeLinejoin="round" />,
  sun: <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" strokeLinecap="round" />,
  wind: <path d="M3 8h9a3 3 0 1 0-3-3M3 12h13a3 3 0 1 1-3 3M3 16h6" strokeLinecap="round" />,
  x: <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />,
  mic: <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />,
  camera: <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" strokeLinejoin="round" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />,
  info: <path d="M12 8h.01M12 12v5" strokeWidth={2} strokeLinecap="round" />,
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />,
  logout: <path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8M10 12h11m0 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />,
  globe: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />,
  tag: <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Zm7-2h.01" strokeWidth={2} strokeLinecap="round" />,
  leaf: <path d="M5 19C5 9 13 5 20 4c-1 8-5 15-15 15Zm0 0c3-5 7-9 11-11" strokeLinecap="round" strokeLinejoin="round" />,
  trendUp: <path d="M3 17l6-6 4 4 8-8m0 0h-5m5 0v5" strokeLinecap="round" strokeLinejoin="round" />,
  trendDown: <path d="M3 7l6 6 4-4 8 8m0 0h-5m5 0v-5" strokeLinecap="round" strokeLinejoin="round" />,
  send: <path d="M21 3 10 14m11-11-7 18-4-7-7-4 18-7Z" strokeLinecap="round" strokeLinejoin="round" />,
  image: <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm4 12 3.5-4 3 3.5L18 12l3 4M9 8.5h.01" strokeLinecap="round" strokeLinejoin="round" />,
  edit: <path d="M4 20h4L20 8l-4-4L4 16v4Zm11-13 4 4" strokeLinecap="round" strokeLinejoin="round" />,
};

export function Icon({
  name,
  size = 20,
  className = "",
  strokeWidth = 1.8,
}: {
  name: keyof typeof PATHS;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ---------------- Button ---------------- */

type BtnVariant = "primary" | "gold" | "secondary" | "outline" | "danger" | "ghost";

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  disabled,
  onClick,
  type = "button",
  children,
  className = "",
}: {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  children: ReactNode;
  className?: string;
}) {
  const variants: Record<BtnVariant, string> = {
    primary: "bg-pine-900 text-cream-50 hover:bg-pine-800 active:bg-pine-950 dark:bg-pine-700 dark:hover:bg-pine-600",
    gold: "bg-gold-500 text-pine-950 hover:bg-gold-600",
    secondary: "bg-pine-100 text-pine-900 hover:bg-pine-200 dark:bg-night-700 dark:text-night-100",
    outline: "border border-cream-300 text-ink-700 hover:bg-cream-100 dark:border-night-700 dark:text-night-100 dark:hover:bg-night-800",
    danger: "bg-danger-600 text-white hover:bg-danger-500",
    ghost: "text-pine-800 hover:bg-pine-50 dark:text-pine-100 dark:hover:bg-night-800",
  };
  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-12 px-6 text-base",
    lg: "h-14 px-8 text-lg",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none min-h-[48px] ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */

export function Card({
  children,
  className = "",
  accent,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  /** gold left-edge accent for the #1 priority action */
  accent?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`block w-full text-left rounded-2xl bg-cream-100 border border-cream-200 shadow-[var(--shadow-card)] dark:bg-night-800 dark:border-night-700 p-4 ${
        accent ? "border-l-4 border-l-gold-500" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

/* ---------------- Badge (icon + text, never color alone) ---------------- */

type Tone = "high" | "medium" | "low" | "info" | "success" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  high: "bg-danger-100 text-danger-600 dark:bg-danger-600/20 dark:text-red-300",
  medium: "bg-risk-100 text-risk-600 dark:bg-risk-500/20 dark:text-orange-300",
  low: "bg-pine-100 text-pine-800 dark:bg-pine-700/30 dark:text-emerald-200",
  info: "bg-gold-100 text-gold-700 dark:bg-gold-500/20 dark:text-amber-200",
  success: "bg-pine-100 text-pine-700 dark:bg-pine-700/30 dark:text-emerald-200",
  neutral: "bg-cream-200 text-ink-600 dark:bg-night-700 dark:text-night-400",
};

export function Badge({
  tone,
  icon,
  children,
  className = "",
}: {
  tone: Tone;
  icon?: keyof typeof PATHS;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide ${TONE_STYLES[tone]} ${className}`}
    >
      {icon ? <Icon name={icon} size={13} strokeWidth={2.2} /> : null}
      {children}
    </span>
  );
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1.5 text-sm font-medium text-ink-700 dark:bg-night-700 dark:text-night-100 ${className}`}>
      {children}
    </span>
  );
}

/* ---------------- Loading / empty / error ---------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-cream-100 border border-cream-200 dark:bg-night-800 dark:border-night-700 p-4 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "leaf",
  title,
  body,
  action,
}: {
  icon?: keyof typeof PATHS;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-12">
      <div className="w-14 h-14 rounded-2xl bg-pine-100 text-pine-800 flex items-center justify-center dark:bg-night-700 dark:text-pine-100">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-ink-500 dark:text-night-400 max-w-[26ch]">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center text-center px-8 py-12">
      <div className="w-14 h-14 rounded-2xl bg-danger-100 text-danger-600 flex items-center justify-center dark:bg-danger-600/20">
        <Icon name="alert" size={28} />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-ink-500 dark:text-night-400 max-w-[30ch]">{body}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-5">
          <Icon name="refresh" size={16} /> {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}

/* ---------------- Bottom sheet ---------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-backdrop absolute inset-0" onClick={onClose} />
      <div className="sheet-panel relative w-full max-w-[30rem] max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-cream-50 dark:bg-night-800 px-5 pt-3 pb-safe">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-cream-300 dark:bg-night-700" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-200 dark:hover:bg-night-700"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Form fields ---------------- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">{label}</span>
      {children}
      {hint ? <span className="block mt-1 text-xs text-ink-500 dark:text-night-400">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full h-12 rounded-[14px] border border-cream-300 bg-cream-50 px-4 text-base text-ink-900 placeholder:text-ink-400 focus:border-pine-700 dark:bg-night-800 dark:border-night-700 dark:text-night-100";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="number" inputMode="decimal" className={`${inputCls} tnum ${props.className || ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={props.rows || 4}
      className={`w-full rounded-[14px] border border-cream-300 bg-cream-50 px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 focus:border-pine-700 dark:bg-night-800 dark:border-night-700 dark:text-night-100 ${props.className || ""}`}
    />
  );
}

/* ---------------- Sections & stats ---------------- */

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold">{title}</h2>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "bad" | "warn";
}) {
  const tones = {
    neutral: "text-ink-900 dark:text-night-100",
    good: "text-pine-700 dark:text-emerald-300",
    bad: "text-danger-600 dark:text-red-300",
    warn: "text-risk-600 dark:text-orange-300",
  };
  return (
    <div className="rounded-2xl bg-cream-100 border border-cream-200 dark:bg-night-800 dark:border-night-700 p-3.5">
      <div className="text-xs font-medium text-ink-500 dark:text-night-400">{label}</div>
      <div className={`hero-num mt-1 text-2xl ${tones[tone]}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-ink-500 dark:text-night-400">{sub}</div> : null}
    </div>
  );
}

/* ---------------- Progress steps (scan flow) ---------------- */

export function ProgressSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="space-y-2.5" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-3 text-sm">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                done
                  ? "bg-pine-700 text-cream-50"
                  : active
                    ? "bg-gold-500 text-pine-950"
                    : "bg-cream-200 text-ink-500 dark:bg-night-700 dark:text-night-400"
              }`}
            >
              {done ? <Icon name="check" size={13} strokeWidth={2.5} /> : i + 1}
            </span>
            <span className={active || done ? "font-semibold" : "text-ink-500 dark:text-night-400"}>
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Risk meter ---------------- */

export function RiskMeter({ score, level }: { score: number; level: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const tone: Tone = level === "HIGH" ? "high" : level === "MEDIUM" ? "medium" : "low";
  const bar = level === "HIGH" ? "bg-danger-500" : level === "MEDIUM" ? "bg-risk-500" : "bg-pine-600";
  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <span className="hero-num text-5xl tnum">{pct}<span className="text-xl text-ink-400">/100</span></span>
        <Badge tone={tone} icon={level === "HIGH" ? "alert" : level === "MEDIUM" ? "info" : "check"}>
          {level}
        </Badge>
      </div>
      <div
        className="h-2.5 rounded-full bg-cream-200 dark:bg-night-700 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Risk ${pct} of 100, ${level}`}
      >
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------------- Sparkline (tiny SVG trend chart) ---------------- */

export function Sparkline({
  points,
  width = 120,
  height = 36,
  className = "",
}: {
  points: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - 4 - ((p - min) / span) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = points[points.length - 1];
  const first = points[0];
  const up = last >= first;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={up ? "var(--color-pine-700)" : "var(--color-risk-500)"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={Number(coords[coords.length - 1].split(",")[1])}
        r="3.5"
        fill="var(--color-gold-500)"
      />
    </svg>
  );
}

/* ---------------- Segmented control ---------------- */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-[14px] bg-cream-200 p-1 dark:bg-night-700"
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`px-4 h-10 rounded-[10px] text-sm font-semibold transition-colors min-h-[40px] ${
            value === o.value
              ? "bg-cream-50 text-ink-900 shadow-sm dark:bg-night-800 dark:text-night-100"
              : "text-ink-500 dark:text-night-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Screen header ---------------- */

export function PageHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 mb-5">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full hover:bg-cream-200 dark:hover:bg-night-700"
        >
          <Icon name="back" size={22} />
        </button>
      ) : null}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold truncate">{title}</h1>
        {subtitle ? <p className="text-sm text-ink-500 dark:text-night-400 truncate">{subtitle}</p> : null}
      </div>
      {right}
    </header>
  );
}

/** Translate a backend i18n key reference safely. */
export function useT() {
  const { t } = useLang();
  return (key: string, vars?: Record<string, string | number>) => t(key as TKey, vars);
}
