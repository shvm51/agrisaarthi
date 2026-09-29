"use client";

import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Card,
  Icon,
  PageHeader,
  useT,
} from "@/components/ui";

type IconName = ComponentProps<typeof Icon>["name"];

interface RowDef {
  labelKey: string;
  icon: IconName;
  href?: string;
  disabled?: boolean;
}

const ROWS: RowDef[] = [
  { labelKey: "more.cropRec", icon: "leaf", href: "/recommend" },
  { labelKey: "more.weather", icon: "rain", href: "/weather" },
  { labelKey: "more.irrigation", icon: "drop", href: "/irrigation" },
  { labelKey: "more.market", icon: "tag", href: "/market" },
  { labelKey: "more.marketplace", icon: "image", disabled: true },
  { labelKey: "more.profitability", icon: "trendUp", href: "/profit" },
  { labelKey: "more.schemes", icon: "globe", disabled: true },
  { labelKey: "more.insurance", icon: "info", disabled: true },
  { labelKey: "more.expert", icon: "shield", href: "/expert" },
  { labelKey: "more.settings", icon: "more", href: "/settings" },
];

function Row({ row }: { row: RowDef }) {
  const t = useT();
  const router = useRouter();

  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pine-100 text-pine-800 dark:bg-night-700 dark:text-gold-500">
        <Icon name={row.icon} size={22} />
      </span>
      <span className="flex-1 text-base font-semibold">{t(row.labelKey)}</span>
      {row.disabled ? (
        <Badge tone="neutral">{t("more.comingSoon")}</Badge>
      ) : (
        <Icon name="next" size={20} className="text-ink-400 dark:text-night-400" />
      )}
    </>
  );

  const cls =
    "flex w-full items-center gap-3 px-4 py-2.5 min-h-[60px] text-left";

  if (row.disabled) {
    return (
      <div className={`${cls} opacity-60`} aria-disabled="true">
        {inner}
      </div>
    );
  }
  return (
    <button
      onClick={() => row.href && router.push(row.href)}
      className={`${cls} transition-colors active:bg-cream-200/70 dark:active:bg-night-700/70`}
    >
      {inner}
    </button>
  );
}

export default function MorePage() {
  const t = useT();
  return (
    <div className="animate-rise px-5 pt-5 pb-8">
      <PageHeader title={t("more.title")} />
      <Card className="!p-0 overflow-hidden divide-y divide-cream-200 dark:divide-night-700">
        {ROWS.map((r) => (
          <Row key={r.labelKey} row={r} />
        ))}
      </Card>
    </div>
  );
}
