"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang, LANG_OPTIONS } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { applyTheme, THEME_KEY } from "@/components/app-shell";
import type { Theme } from "@/components/app-shell";
import {
  Button,
  Card,
  Icon,
  PageHeader,
  SectionHeader,
  SegmentedControl,
  useT,
} from "@/components/ui";

export default function SettingsPage() {
  const t = useT();
  const router = useRouter();
  const { lang, setLang } = useLang();
  const { demoMode, signOut } = useSession();
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const changeTheme = (v: Theme) => {
    setThemeState(v);
    try {
      localStorage.setItem(THEME_KEY, v);
    } catch {
      /* ignore */
    }
    applyTheme(v);
  };

  return (
    <div className="animate-rise px-5 pt-5 pb-8 space-y-5">
      <PageHeader title={t("settings.title")} onBack={() => router.back()} />

      {/* Language */}
      <Card>
        <SectionHeader title={t("settings.language")} />
        <SegmentedControl<Lang>
          ariaLabel={t("settings.language")}
          value={lang}
          onChange={setLang}
          options={LANG_OPTIONS.map((o) => ({ value: o.code, label: o.label }))}
        />
      </Card>

      {/* Theme */}
      <Card>
        <SectionHeader title={t("settings.theme")} />
        <SegmentedControl<Theme>
          ariaLabel={t("settings.theme")}
          value={theme}
          onChange={changeTheme}
          options={[
            { value: "light", label: t("settings.light") },
            { value: "dark", label: t("settings.dark") },
            { value: "system", label: t("settings.system") },
          ]}
        />
      </Card>

      {/* Demo mode */}
      {demoMode ? (
        <Card>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700 dark:bg-gold-500/20 dark:text-amber-200">
              <Icon name="info" size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold">{t("settings.demoMode")}</h2>
              <p className="mt-0.5 text-sm text-ink-500 dark:text-night-400">
                {t("settings.demoModeBody")}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* About */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-100 text-pine-800 dark:bg-night-700 dark:text-pine-100">
            <Icon name="leaf" size={20} />
          </span>
          <div>
            <h2 className="text-base font-bold">{t("settings.about")}</h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-night-400">
              {t("settings.aboutBody")}
            </p>
          </div>
        </div>
      </Card>

      {/* Sign out */}
      {!demoMode ? (
        <Button
          variant="outline"
          fullWidth
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
        >
          <Icon name="logout" size={18} /> {t("settings.signOut")}
        </Button>
      ) : null}
    </div>
  );
}
