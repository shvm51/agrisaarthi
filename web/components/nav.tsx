"use client";

import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./ui";
import { useLang, type TKey } from "@/lib/i18n";

type TabIcon = "home" | "farm" | "scan" | "ai" | "more";

const TABS: Array<{ href: string; key: TKey; icon: TabIcon; center?: boolean }> = [
  { href: "/", key: "nav.home", icon: "home" },
  { href: "/farm", key: "nav.farm", icon: "farm" },
  { href: "/scan", key: "nav.scan", icon: "scan", center: true },
  { href: "/ai", key: "nav.ai", icon: "ai" },
  { href: "/more", key: "nav.more", icon: "more" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 bg-cream-50/95 backdrop-blur border-t border-cream-200 dark:bg-night-900/95 dark:border-night-700"
    >
      <div className="app-frame">
        <div className="grid grid-cols-5 px-2 pt-1.5 pb-safe">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            if (tab.center) {
              return (
                <button
                  key={tab.href}
                  onClick={() => router.push(tab.href)}
                  aria-label={t(tab.key)}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-col items-center -mt-5"
                >
                  <span
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                      active ? "bg-gold-500 text-pine-950" : "bg-pine-900 text-cream-50 dark:bg-pine-700"
                    }`}
                  >
                    <Icon name={tab.icon} size={26} />
                  </span>
                  <span className={`mt-1 text-[11px] font-semibold ${active ? "text-pine-900 dark:text-pine-100" : "text-ink-500 dark:text-night-400"}`}>
                    {t(tab.key)}
                  </span>
                </button>
              );
            }
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                aria-label={t(tab.key)}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 py-1.5 min-h-[56px]"
              >
                <Icon
                  name={tab.icon}
                  size={23}
                  className={active ? "text-pine-900 dark:text-gold-500" : "text-ink-400 dark:text-night-400"}
                />
                <span className={`text-[11px] font-semibold ${active ? "text-pine-900 dark:text-gold-500" : "text-ink-500 dark:text-night-400"}`}>
                  {t(tab.key)}
                </span>
                <span className={`h-1 w-1 rounded-full ${active ? "bg-gold-500" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
