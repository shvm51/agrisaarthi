"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LangProvider, useLang } from "@/lib/i18n";
import { SessionProvider, useSession } from "@/lib/session";
import { BottomNav } from "./nav";
import { Icon } from "./ui";

export type Theme = "light" | "dark" | "system";
export const THEME_KEY = "agrisaarthi.theme";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#12140F" : "#1B4332");
}

function ThemeInit() {
  useEffect(() => {
    try {
      const saved = (localStorage.getItem(THEME_KEY) as Theme) || "system";
      applyTheme(saved);
    } catch {
      applyTheme("system");
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      try {
        if (((localStorage.getItem(THEME_KEY) as Theme) || "system") === "system") {
          applyTheme("system");
        }
      } catch { /* ignore */ }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return null;
}

/** Keep <html lang> in sync with the selected language. */
function LangSync() {
  const { lang } = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}

function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is best-effort */
      });
    }
  }, []);
  return null;
}

function OfflineBanner() {
  const { t } = useLang();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="status"
      className="bg-pine-950 text-cream-50 dark:bg-gold-500 dark:text-pine-950 px-4 py-2.5 flex items-start gap-2.5 text-sm"
    >
      <Icon name="alert" size={18} className="mt-0.5" />
      <div>
        <div className="font-bold">{t("common.offline")}</div>
        <div className="text-[13px] opacity-90">{t("common.offlineDesc")}</div>
      </div>
    </div>
  );
}

function DemoBadge() {
  const { t } = useLang();
  const { demoMode } = useSession();
  if (!demoMode) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-gold-100 text-gold-700 dark:bg-gold-500/20 dark:text-amber-200 px-2 py-0.5 text-[10px] font-bold tracking-widest">
      {t("common.demo")}
    </span>
  );
}

/** Screens that render their own chrome (no bottom nav). */
const CHROMELESS = ["/login"];

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const chromeless = CHROMELESS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <div className="app-frame flex flex-col min-h-dvh">
      <OfflineBanner />
      <main className={`flex-1 ${chromeless ? "" : "pb-32"}`}>{children}</main>
      {!chromeless && <BottomNav />}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <SessionProvider>
        <ThemeInit />
        <LangSync />
        <ServiceWorkerRegister />
        <Shell>{children}</Shell>
      </SessionProvider>
    </LangProvider>
  );
}

export { DemoBadge };
