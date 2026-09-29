"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import type { FarmProfile } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Icon,
  NumberInput,
  PageHeader,
  SectionHeader,
  SegmentedControl,
  Select,
  Sheet,
  Stat,
  TextInput,
  useT,
} from "@/components/ui";

const STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"] as const;
const SOIL_TYPES = ["Loamy", "Sandy", "Clay", "Black", "Silty"];

interface Draft {
  farmerName: string;
  location: string;
  land: string;
  crop: string;
  stage: FarmProfile["crop_stage"];
  soilType: string;
  water: FarmProfile["water_availability"];
}

const daysAgoIso = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

const TIMELINE = [
  { key: "tl.planted", days: 45 },
  { key: "tl.fertilizer", days: 20 },
  { key: "tl.scan", days: 3 },
  { key: "tl.alert", days: 1 },
  { key: "tl.irrigation", days: 0 },
] as const;

export default function FarmPage() {
  const t = useT();
  const { farm, updateFarm } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  const openEdit = () => {
    setDraft({
      farmerName: farm.farmer_name,
      location: farm.location_name,
      land: String(farm.land_acres),
      crop: farm.crop,
      stage: farm.crop_stage,
      soilType: farm.soil_type,
      water: farm.water_availability,
    });
    setSheetOpen(true);
  };

  const setField = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () => {
    if (!draft) return;
    const land = parseFloat(draft.land);
    updateFarm({
      farmer_name: draft.farmerName.trim() || farm.farmer_name,
      location_name: draft.location.trim() || farm.location_name,
      land_acres: Number.isFinite(land) && land > 0 ? land : farm.land_acres,
      crop: draft.crop.trim() || farm.crop,
      crop_stage: draft.stage,
      soil_type: draft.soilType,
      water_availability: draft.water,
    });
    setSheetOpen(false);
  };

  const soilStats: Array<{ label: string; value: string }> = [];
  if (farm.soil_ph != null) soilStats.push({ label: t("rec.ph"), value: String(farm.soil_ph) });
  if (farm.soil_n != null) soilStats.push({ label: t("rec.n"), value: String(farm.soil_n) });
  if (farm.soil_p != null) soilStats.push({ label: t("rec.p"), value: String(farm.soil_p) });
  if (farm.soil_k != null) soilStats.push({ label: t("rec.k"), value: String(farm.soil_k) });

  return (
    <div className="animate-rise px-5 pt-5 pb-8 space-y-6">
      <PageHeader
        title={t("farm.title")}
        right={
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Icon name="edit" size={16} /> {t("farm.edit")}
          </Button>
        }
      />

      {/* Profile */}
      <section aria-label={t("farm.profile")}>
        <Card>
          <h2 className="text-lg font-bold">{farm.farmer_name}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500 dark:text-night-400">
            <Icon name="globe" size={14} />
            {farm.location_name}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip>
              <span className="tnum font-bold">{farm.land_acres}</span>&nbsp;{t("farm.acres")}
            </Chip>
            <Chip>
              <Icon name="leaf" size={14} />
              {farm.crop}
            </Chip>
            <Badge tone="low" icon="check">
              {t("stage." + farm.crop_stage)}
            </Badge>
          </div>
        </Card>
      </section>

      {/* Crop cycle */}
      <section aria-label={t("farm.cropCycle")}>
        <SectionHeader title={t("farm.cropCycle")} />
        {farm.crop ? (
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">{farm.crop}</span>
              <Badge tone="low" icon="check">
                {t("stage." + farm.crop_stage)}
              </Badge>
            </div>
            <p className="text-sm text-ink-500 dark:text-night-400">
              {t("tl.planted")} · <span className="tnum">{timeAgo(daysAgoIso(45))}</span>
            </p>
          </Card>
        ) : (
          <EmptyState icon="leaf" title={t("farm.emptyCrop")} body={t("farm.emptyCropBody")} />
        )}
      </section>

      {/* Soil */}
      <section aria-label={t("farm.soil")}>
        <SectionHeader title={t("farm.soil")} />
        <div className="grid grid-cols-2 gap-3">
          <Stat label={t("farm.soilType")} value={farm.soil_type || t("common.noData")} />
          {soilStats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section aria-label={t("farm.timeline")}>
        <SectionHeader title={t("farm.timeline")} />
        <ol className="ml-2 space-y-5 border-l-2 border-cream-200 pl-5 dark:border-night-700">
          {TIMELINE.map((e) => (
            <li key={e.key} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-gold-500 ring-4 ring-cream-50 dark:ring-night-900"
              />
              <p className="text-sm font-semibold">{t(e.key)}</p>
              <p className="tnum text-xs text-ink-500 dark:text-night-400">
                {e.days === 0 ? t("common.today") : timeAgo(daysAgoIso(e.days))}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Edit sheet */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t("farm.edit")}>
        {draft ? (
          <div className="space-y-4 pb-2">
            <Field label={t("farm.farmerName")}>
              <TextInput
                value={draft.farmerName}
                onChange={(e) => setField("farmerName", e.currentTarget.value)}
                autoComplete="name"
              />
            </Field>
            <Field label={t("farm.location")}>
              <TextInput
                value={draft.location}
                onChange={(e) => setField("location", e.currentTarget.value)}
                autoComplete="address-level2"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`${t("farm.land")} (${t("farm.acres")})`}>
                <NumberInput
                  value={draft.land}
                  min={0.1}
                  step={0.1}
                  onChange={(e) => setField("land", e.currentTarget.value)}
                />
              </Field>
              <Field label={t("farm.crop")}>
                <TextInput
                  value={draft.crop}
                  onChange={(e) => setField("crop", e.currentTarget.value)}
                />
              </Field>
            </div>
            <Field label={t("farm.stage")}>
              <Select
                value={draft.stage}
                onChange={(e) => setField("stage", e.currentTarget.value as Draft["stage"])}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {t("stage." + s)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("farm.soilType")}>
              <Select
                value={draft.soilType}
                onChange={(e) => setField("soilType", e.currentTarget.value)}
              >
                {SOIL_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("farm.water")}>
              <SegmentedControl<FarmProfile["water_availability"]>
                ariaLabel={t("farm.water")}
                value={draft.water}
                onChange={(v) => setField("water", v)}
                options={[
                  { value: "LOW", label: t("farm.low") },
                  { value: "MEDIUM", label: t("farm.medium") },
                  { value: "HIGH", label: t("farm.high") },
                ]}
              />
            </Field>
            <Button fullWidth onClick={save}>
              <Icon name="check" size={18} /> {t("farm.save")}
            </Button>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
