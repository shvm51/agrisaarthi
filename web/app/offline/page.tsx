"use client";

import { useRouter } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";
import { useLang } from "@/lib/i18n";

export default function OfflinePage() {
  const router = useRouter();
  const { t } = useLang();

  return (
    <div className="px-5 pt-16">
      <EmptyState
        icon="alert"
        title={t("common.offline")}
        body={t("common.offlineDesc")}
        action={
          <Button variant="primary" onClick={() => router.push("/")}>
            {t("common.back")}
          </Button>
        }
      />
    </div>
  );
}
