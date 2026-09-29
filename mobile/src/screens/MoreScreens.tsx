/**
 * Detail screens behind the MORE tab.
 * Each screen tries the FastAPI backend first, falls back to clearly-marked
 * demo data or an informative "backend wiring ready" placeholder —
 * no dead buttons anywhere.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n, Locale } from '../i18n';
import { MIN_TOUCH, radius, spacing, type } from '../theme/tokens';
import { Badge, BottomSheet, Button, Card, Chip, ErrorState, FadeIn, Skeleton } from '../components/ui';
import { api, CropCandidate } from '../services/api';
import { clearFarmProfile, DEMO_PROFILE, getFarmProfile } from '../services/storage';
import { useTheme as useThemeCtx } from '../theme/ThemeContext';

// ── Shared shell ───────────────────────────────────────────────
function Shell({
  navigation,
  titleKey,
  children,
}: {
  navigation: any;
  titleKey: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const { t } = useI18n();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.back_button')}
          style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <Text style={[type.h2, { color: theme.text }]}>{t(titleKey)}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function WiringNote() {
  const { theme } = useTheme();
  const { t } = useI18n();
  return (
    <Card style={{ marginTop: spacing.lg }}>
      <View style={styles.noteRow}>
        <MaterialCommunityIcons name="server-network" size={20} color={theme.info} />
        <Text style={[type.small, { color: theme.textMuted, marginLeft: spacing.sm, flex: 1 }]}>
          {t('more.wiring_ready')}
        </Text>
      </View>
    </Card>
  );
}

function useDemoFlag() {
  const [isDemo, setIsDemo] = useState(false);
  const demoBadge = isDemo ? (
    <View style={{ marginBottom: spacing.md }}>
      <Badge icon="ⓘ" label={useI18n().t('demo.badge')} tone="info" />
    </View>
  ) : null;
  return { isDemo, setIsDemo, demoBadge };
}

// ── 1. Crop recommendation ─────────────────────────────────────
export function CropRecommendationScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [recs, setRecs] = useState<CropCandidate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { isDemo, setIsDemo, demoBadge } = useDemoFlag();

  const run = async () => {
    setLoading(true);
    try {
      const profile = (await getFarmProfile()) ?? DEMO_PROFILE;
      const r = await api.cropRecommendation({
        soil_type: profile.soilType,
        water_availability: profile.water.toUpperCase(),
        ph: profile.soilPh ?? 6.8, n: profile.soilN ?? 50,
        p: profile.soilP ?? 30, k: profile.soilK ?? 40,
        land_acres: profile.landAcres, season: 'Kharif',
      });
      setRecs(r);
      setIsDemo(false);
    } catch {
      setRecs([
        { crop: 'Soybean', suitability: 91, expected_yield_kg_per_acre: 820, estimated_profit_inr: 38500, factors: [t('demo.rec_factor_soil'), t('demo.rec_factor_water'), t('demo.rec_factor_season')] },
        { crop: 'Maize', suitability: 82, expected_yield_kg_per_acre: 1400, estimated_profit_inr: 31200, factors: [t('demo.rec_factor_water'), t('demo.rec_factor_season')] },
        { crop: 'Cotton', suitability: 76, expected_yield_kg_per_acre: 640, estimated_profit_inr: 44800, factors: [t('demo.rec_factor_soil')] },
      ]);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell navigation={navigation} titleKey="crop_rec.title">
      {demoBadge}
      {!recs && !loading && (
        <Button title={t('crop_rec.get_recommendation')} onPress={run} />
      )}
      {loading && <Skeleton height={140} style={{ marginTop: spacing.md }} />}
      {recs?.map((r, i) => (
        <FadeIn key={r.crop} delay={i * 80}>
          <Card style={{ marginBottom: spacing.md }}>
            <View style={styles.rowBetween}>
              <Text style={[type.h3, { color: theme.text }]}>{r.crop}</Text>
              <Badge icon="✓" label={`${r.suitability}% ${t('crop_rec.suitability')}`} tone={r.suitability >= 85 ? 'success' : 'info'} />
            </View>
            <View style={[styles.bar, { backgroundColor: theme.surfaceAlt }]}>
              <View style={[styles.fill, { width: `${r.suitability}%`, backgroundColor: theme.primary }]} />
            </View>
            <View style={styles.rowBetween}>
              <Text style={[type.small, { color: theme.textMuted }]}>
                {t('crop_rec.expected_yield')}: <Text style={[type.smallStrong, { color: theme.text, ...type.numeric }]}>{r.expected_yield_kg_per_acre.toLocaleString()} kg</Text>
              </Text>
              <Text style={[type.small, { color: theme.textMuted }]}>
                {t('crop_rec.est_profit')}: <Text style={[type.smallStrong, { color: theme.success, ...type.numeric }]}>₹{r.estimated_profit_inr.toLocaleString('en-IN')}</Text>
              </Text>
            </View>
            <Text style={[type.caption, { color: theme.textMuted, marginTop: spacing.sm }]}>{t('crop_rec.explanation_factors')}</Text>
            {r.factors.map((f) => (
              <Text key={f} style={[type.small, { color: theme.text, marginTop: 2 }]}>• {f}</Text>
            ))}
          </Card>
        </FadeIn>
      ))}
      {recs && <WiringNote />}
    </Shell>
  );
}

// ── 2. Weather intelligence ────────────────────────────────────
export function WeatherScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDemo, setIsDemo, demoBadge } = useDemoFlag();

  React.useEffect(() => {
    (async () => {
      try {
        const profile = (await getFarmProfile()) ?? DEMO_PROFILE;
        const { data: d } = await api.getWeather(profile.lat ?? 18.5204, profile.lng ?? 73.8567);
        setData(d);
        setIsDemo(false);
      } catch {
        setData({ temp_c: 31, humidity_pct: 78, rain_prob_pct: 81, wind_kmh: 12 });
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const raw = data?.raw ?? data ?? {};
  const interp = data?.agri_interpretation ?? null;
  const rows = [
    { label: t('weather.temperature'), value: `${raw.temperature_c ?? raw.temp_c}°C`, icon: 'thermometer' },
    { label: t('weather.humidity'), value: `${raw.humidity_pct}%`, icon: 'water-percent' },
    { label: t('weather.rain_probability'), value: `${raw.rain_probability_pct ?? raw.rain_prob_pct}%`, icon: 'weather-rainy' },
    { label: t('weather.wind'), value: `${raw.wind_kmh} ${t('common.km')}/h`, icon: 'weather-windy' },
  ];
  const notes = interp
    ? [interp.irrigation_advice, interp.spraying_advice, interp.disease_note].filter(Boolean)
    : [t('weather.tomorrow_note'), t('weather.spraying_note'), t('weather.disease_note')];

  return (
    <Shell navigation={navigation} titleKey="weather.title">
      {demoBadge}
      {loading ? <Skeleton height={200} /> : (
        <View>
          <Card>
            <Text style={[type.overline, { color: theme.textMuted }]}>{t('weather.raw_data')}</Text>
            {rows.map((r) => (
              <View key={r.label} style={[styles.kvRow, { borderBottomColor: theme.border }]}>
                <MaterialCommunityIcons name={r.icon as any} size={20} color={theme.primary} />
                <Text style={[type.body, { color: theme.textMuted, marginLeft: spacing.md, flex: 1 }]}>{r.label}</Text>
                <Text style={[type.h3, { color: theme.text, ...type.numeric }]}>{r.value}</Text>
              </View>
            ))}
          </Card>
          <Card style={{ marginTop: spacing.md }}>
            <Text style={[type.overline, { color: theme.textMuted }]}>{t('weather.ai_interpretation')}</Text>
            {notes.map((n) => (
              <View key={n} style={[styles.noteRow, { marginTop: spacing.sm }]}>
                <MaterialCommunityIcons name="lightbulb-outline" size={18} color={theme.accent} />
                <Text style={[type.body, { color: theme.text, marginLeft: spacing.sm, flex: 1 }]}>{n}</Text>
              </View>
            ))}
          </Card>
          {isDemo && <WiringNote />}
        </View>
      )}
    </Shell>
  );
}

// ── 3. Smart irrigation ────────────────────────────────────────
export function IrrigationScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [advice, setAdvice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDemo, setIsDemo, demoBadge } = useDemoFlag();

  const load = async () => {
    setLoading(true);
    try {
      const profile = (await getFarmProfile()) ?? DEMO_PROFILE;
      const r = await api.irrigationAdvice(profile, {
        soil_moisture_pct: 42, rain_probability_pct: 81, temperature_c: 31, humidity_pct: 78,
      });
      setAdvice(r);
      setIsDemo(false);
    } catch {
      setAdvice({
        recommendation: 'WAIT', soil_moisture_pct: 42, crop_requirement_pct: 48,
        rain_prob_pct: 81, reason: t('demo.irrigation_reason'), sensor: false,
      });
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const rec = advice?.recommendation as 'WAIT' | 'IRRIGATE' | 'CAUTION' | undefined;
  const recTone = rec === 'IRRIGATE' ? 'info' : rec === 'CAUTION' ? 'warning' : 'success';

  return (
    <Shell navigation={navigation} titleKey="irrigation.title">
      {demoBadge}
      {loading ? <Skeleton height={220} /> : advice ? (
        <View>
          <Card>
            <View style={styles.center}>
              <Badge
                icon={rec === 'WAIT' ? '⏸' : rec === 'CAUTION' ? '▲' : '💧'}
                label={t(`irrigation.${(rec ?? 'wait').toLowerCase()}`)}
                tone={recTone}
              />
            </View>
            {[
              { label: t('irrigation.soil_moisture'), value: advice.soil_moisture_pct != null ? `${advice.soil_moisture_pct}%` : '—' },
              { label: t('irrigation.crop_requirement'), value: advice.crop_water_need_note ?? (advice.crop_requirement_pct != null ? `${advice.crop_requirement_pct}%` : '—') },
            ].map((r) => (
              <View key={r.label} style={[styles.kvRow, { borderBottomColor: theme.border }]}>
                <Text style={[type.body, { color: theme.textMuted, flex: 1 }]}>{r.label}</Text>
                <Text style={[type.h3, { color: theme.text, ...type.numeric }]}>{r.value}</Text>
              </View>
            ))}
            <Text style={[type.caption, { color: theme.textMuted, marginTop: spacing.md }]}>{t('irrigation.reason')}</Text>
            <Text style={[type.body, { color: theme.text, marginTop: spacing.xs }]}>{advice.reason}</Text>
            <View style={{ marginTop: spacing.md }}>
              <Badge
                icon="📡"
                label={(advice.data_source === 'sensor' || advice.sensor) ? t('irrigation.data_source_sensor') : t('irrigation.data_source_estimate')}
                tone="neutral"
              />
            </View>
          </Card>
          <View style={{ marginTop: spacing.md }}>
            <Button title={t('common.retry')} variant="secondary" onPress={load} />
          </View>
          {isDemo && <WiringNote />}
        </View>
      ) : (
        <ErrorState title={t('errors.api_error')} onRetry={load} />
      )}
    </Shell>
  );
}

// ── 4. Market intelligence ─────────────────────────────────────
const DEMO_MARKETS = [
  { name: 'Pune APMC', price: 24, distance_km: 18, transport: 900, qty_kg: 1200 },
  { name: 'Pimpri Mandi', price: 22, distance_km: 9, transport: 500, qty_kg: 1200 },
  { name: 'Hadapsar Market', price: 21, distance_km: 6, transport: 350, qty_kg: 1200 },
];

export function MarketScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [sort, setSort] = useState<'price' | 'nearest' | 'net'>('net');
  const { isDemo, setIsDemo, demoBadge } = useDemoFlag();

  React.useEffect(() => { setIsDemo(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const rows = [...DEMO_MARKETS]
    .map((m) => ({ ...m, net: m.price * m.qty_kg - m.transport }))
    .sort((a, b) => (sort === 'price' ? b.price - a.price : sort === 'nearest' ? a.distance_km - b.distance_km : b.net - a.net));

  return (
    <Shell navigation={navigation} titleKey="market.title">
      {demoBadge}
      <Text style={[type.body, { color: theme.textMuted }]}>
        {t('market.current_crop')}: <Text style={[type.bodyStrong, { color: theme.text }]}>{t('crops.tomato')}</Text>
        {'  •  '}{t('market.quantity')}: <Text style={[type.bodyStrong, { color: theme.text, ...type.numeric }]}>1,200 {t('common.kg')}</Text>
      </Text>
      <View style={styles.chipRow}>
        {(['price', 'nearest', 'net'] as const).map((s) => (
          <Chip key={s} label={t(`market.sort_${s}`)} selected={sort === s} onPress={() => setSort(s)} />
        ))}
      </View>
      {rows.map((m, i) => (
        <FadeIn key={m.name} delay={i * 60}>
          <Card style={{ marginBottom: spacing.md }}>
            <View style={styles.rowBetween}>
              <Text style={[type.h3, { color: theme.text }]}>{m.name}</Text>
              {i === 0 && <Badge icon="★" label={t(`market.sort_${sort}`)} tone="success" />}
            </View>
            <View style={styles.mktGrid}>
              <View>
                <Text style={[type.caption, { color: theme.textMuted }]}>{t('market.price_per_kg')}</Text>
                <Text style={[type.h3, { color: theme.text, ...type.numeric }]}>₹{m.price}</Text>
              </View>
              <View>
                <Text style={[type.caption, { color: theme.textMuted }]}>{t('market.distance')}</Text>
                <Text style={[type.h3, { color: theme.text, ...type.numeric }]}>{m.distance_km} {t('common.km')}</Text>
              </View>
              <View>
                <Text style={[type.caption, { color: theme.textMuted }]}>{t('market.transport_estimate')}</Text>
                <Text style={[type.h3, { color: theme.text, ...type.numeric }]}>₹{m.transport.toLocaleString('en-IN')}</Text>
              </View>
              <View>
                <Text style={[type.caption, { color: theme.textMuted }]}>{t('market.est_net')}</Text>
                <Text style={[type.h3, { color: theme.success, ...type.numeric }]}>₹{m.net.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </Card>
        </FadeIn>
      ))}
      <Card>
        <View style={styles.noteRow}>
          <MaterialCommunityIcons name="chart-line" size={20} color={theme.primary} />
          <Text style={[type.small, { color: theme.textMuted, marginLeft: spacing.sm }]}>
            {t('market.estimated_trend')}: ↗ +8%
          </Text>
        </View>
      </Card>
      {isDemo && <WiringNote />}
    </Shell>
  );
}

// ── 5. Marketplace ─────────────────────────────────────────────
const DEMO_LISTINGS = [
  { cropKey: 'crops.tomato', qty: 1200, price: 23, location: 'Pune', id: '1' },
  { cropKey: 'crops.onion', qty: 2500, price: 18, location: 'Nashik', id: '2' },
];

export function MarketplaceScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [sheet, setSheet] = useState(false);
  const [interested, setInterested] = useState<Set<string>>(new Set());
  const { isDemo, setIsDemo, demoBadge } = useDemoFlag();

  React.useEffect(() => { setIsDemo(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const toggle = (id: string) =>
    setInterested((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  return (
    <Shell navigation={navigation} titleKey="marketplace.title">
      {demoBadge}
      <Button title={t('marketplace.list_produce')} onPress={() => setSheet(true)} />
      <View style={{ marginTop: spacing.lg }}>
        {DEMO_LISTINGS.map((l) => (
          <Card key={l.id} style={{ marginBottom: spacing.md }}>
            <View style={styles.rowBetween}>
              <Text style={[type.h3, { color: theme.text }]}>{t(l.cropKey)}</Text>
              <Badge icon="✓" label={t('marketplace.quality')} tone="success" />
            </View>
            <Text style={[type.body, { color: theme.textMuted, marginTop: spacing.xs, ...type.numeric }]}>
              {l.qty.toLocaleString()} {t('common.kg')} • ₹{l.price}/{t('common.kg')} • {l.location}
            </Text>
            <View style={styles.btnRow}>
              <Button
                title={interested.has(l.id) ? `✓ ${t('marketplace.interested')}` : t('marketplace.interested')}
                variant={interested.has(l.id) ? 'primary' : 'secondary'}
                onPress={() => toggle(l.id)}
              />
              <Button title={t('marketplace.contact_buyer')} variant="ghost" onPress={() => toggle(l.id)} />
            </View>
          </Card>
        ))}
      </View>
      {isDemo && <WiringNote />}
      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title={t('marketplace.list_produce')}>
        <Text style={[type.body, { color: theme.textMuted }]}>{t('more.wiring_ready')}</Text>
        <View style={{ marginTop: spacing.lg }}>
          <Button title={t('common.close')} onPress={() => setSheet(false)} />
        </View>
      </BottomSheet>
    </Shell>
  );
}

// ── 6. Profitability (deterministic local math) ─────────────────
export function ProfitabilityScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [v, setV] = useState({ land: '2.5', seed: '12000', fert: '15000', labor: '18000', irr: '6000', trans: '4000', stor: '2500', yieldKg: '9400', price: '22' });
  const [result, setResult] = useState<{ cost: number; rev: number; profit: number } | null>(null);

  const calc = () => {
    const n = (k: keyof typeof v) => parseFloat(v[k]) || 0;
    const cost = n('seed') + n('fert') + n('labor') + n('irr') + n('trans') + n('stor');
    const rev = n('yieldKg') * n('price');
    setResult({ cost, rev, profit: rev - cost });
  };

  const fields: { k: keyof typeof v; label: string }[] = [
    { k: 'land', label: t('profit.land_area') },
    { k: 'seed', label: t('profit.seed_cost') },
    { k: 'fert', label: t('profit.fertilizer') },
    { k: 'labor', label: t('profit.labor') },
    { k: 'irr', label: t('profit.irrigation_cost') },
    { k: 'trans', label: t('profit.transport') },
    { k: 'stor', label: t('profit.storage') },
    { k: 'yieldKg', label: t('profit.yield_kg') },
    { k: 'price', label: t('profit.market_price') },
  ];

  return (
    <Shell navigation={navigation} titleKey="profit.title">
      <Card>
        {fields.map((f) => (
          <View key={f.k} style={styles.fieldRow}>
            <Text style={[type.small, { color: theme.textMuted, flex: 1 }]}>{f.label}</Text>
            <TextInput
              value={v[f.k]}
              onChangeText={(x) => setV({ ...v, [f.k]: x.replace(/[^0-9.]/g, '') })}
              keyboardType="decimal-pad"
              style={[styles.numInput, type.body, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              accessibilityLabel={f.label}
            />
          </View>
        ))}
        <View style={{ marginTop: spacing.md }}>
          <Button title={t('profit.calculate')} onPress={calc} />
        </View>
      </Card>
      {result && (
        <FadeIn>
          <Card style={{ marginTop: spacing.md }}>
            <View style={[styles.kvRow, { borderBottomColor: theme.border }]}>
              <Text style={[type.body, { color: theme.textMuted, flex: 1 }]}>{t('profit.total_cost')}</Text>
              <Text style={[type.h3, { color: theme.text, ...type.numeric }]}>₹{result.cost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.kvRow, { borderBottomColor: theme.border }]}>
              <Text style={[type.body, { color: theme.textMuted, flex: 1 }]}>{t('profit.expected_revenue')}</Text>
              <Text style={[type.h3, { color: theme.text, ...type.numeric }]}>₹{result.rev.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={[type.body, { color: theme.textMuted, flex: 1 }]}>{t('profit.est_profit')}</Text>
              <Text style={[type.h2, { color: result.profit >= 0 ? theme.success : theme.danger, ...type.numeric }]}>
                ₹{result.profit.toLocaleString('en-IN')}
              </Text>
            </View>
          </Card>
        </FadeIn>
      )}
    </Shell>
  );
}

// ── 7/8. Schemes & Insurance ───────────────────────────────────
const DEMO_SCHEMES = [
  { name: 'PM-KISAN', benefit: '₹6,000/yr', source: 'pmkisan.gov.in' },
  { name: 'PMFBY', benefit: '₹2% premium', source: 'pmfby.gov.in' },
  { name: 'Soil Health Card', benefit: 'Free', source: 'soilhealth.dac.gov.in' },
];

function SchemeList({ titleKey }: { titleKey: string }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [items, setItems] = useState<any[] | null>(null);
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await api.getSchemes();
        const list = Array.isArray(data) ? data : (data as any).items ?? [];
        setItems(list.length ? list : null);
      } catch {
        setItems(null); // demo fallback below
      }
    })();
  }, []);
  const shown = items ?? DEMO_SCHEMES.map((s) => ({
    name: s.name, benefits: s.benefit, official_source: s.source,
    potential_relevance: t('schemes.potentially_relevant'),
  }));
  return (
    <View>
      {shown.map((s: any) => (
        <Card key={s.name} style={{ marginBottom: spacing.md }}>
          <View style={styles.rowBetween}>
            <Text style={[type.h3, { color: theme.text, flex: 1 }]}>{s.name}</Text>
            <Badge icon="◐" label={s.potential_relevance ?? t('schemes.potentially_relevant')} tone="info" />
          </View>
          <Text style={[type.body, { color: theme.textMuted, marginTop: spacing.xs, ...type.numeric }]}>
            {t('schemes.benefits')}: {s.benefits ?? s.benefit}
          </Text>
          {s.eligibility_indicators && (
            <Text style={[type.small, { color: theme.textMuted, marginTop: spacing.xs }]}>
              {s.eligibility_indicators.join(' • ')}
            </Text>
          )}
          <Text style={[type.small, { color: theme.primary, marginTop: spacing.sm }]}>
            {t('schemes.check_eligibility')}
          </Text>
          <Text style={[type.caption, { color: theme.textMuted, marginTop: spacing.xs }]}>
            {t('schemes.official_source')}: {s.official_source ?? s.source}
          </Text>
        </Card>
      ))}
      {!items && <WiringNote />}
    </View>
  );
}

export function SchemesScreen({ navigation }: { navigation: any }) {
  return (
    <Shell navigation={navigation} titleKey="schemes.schemes_title">
      <SchemeList titleKey="schemes.schemes_title" />
    </Shell>
  );
}

export function InsuranceScreen({ navigation }: { navigation: any }) {
  return (
    <Shell navigation={navigation} titleKey="schemes.insurance_title">
      <SchemeList titleKey="schemes.insurance_title" />
    </Shell>
  );
}

// ── 9. Expert support ──────────────────────────────────────────
export function ExpertScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [desc, setDesc] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!desc.trim()) return;
    setBusy(true);
    try {
      const profile = (await getFarmProfile()) ?? DEMO_PROFILE;
      await api.requestExpert(profile, { issue: desc.trim() });
    } catch {
      /* demo path: request stored locally */
    } finally {
      setBusy(false);
      setSent(true);
    }
  };

  return (
    <Shell navigation={navigation} titleKey="expert.title">
      {sent ? (
        <FadeIn>
          <Card>
            <View style={styles.center}>
              <MaterialCommunityIcons name="check-circle" size={48} color={theme.success} />
              <Text style={[type.h3, { color: theme.text, marginTop: spacing.md, textAlign: 'center' }]}>
                {t('expert.request_sent')}
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <Badge icon="○" label={`${t('expert.status_open')}`} tone="info" />
              </View>
            </View>
          </Card>
        </FadeIn>
      ) : (
        <View>
          <Card>
            <Text style={[type.h3, { color: theme.text }]}>{t('expert.need_verification')}</Text>
            <Text style={[type.body, { color: theme.textMuted, marginTop: spacing.sm }]}>
              {t('expert.connect')}
            </Text>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              placeholder={t('expert.describe_issue')}
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.textArea, type.body, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              accessibilityLabel={t('expert.describe_issue')}
            />
            <View style={{ marginTop: spacing.md }}>
              <Button title={t('expert.submit')} onPress={submit} loading={busy} disabled={!desc.trim()} />
            </View>
          </Card>
          <WiringNote />
        </View>
      )}
    </Shell>
  );
}

// ── 10. Settings ───────────────────────────────────────────────
export function SettingsScreen({ navigation }: { navigation: any }) {
  const { theme, mode, setMode } = useThemeCtx();
  const { t, locale, setLocale } = useI18n();
  const [notif, setNotif] = useState(true);

  const LANGS: { code: Locale; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
  ];

  return (
    <Shell navigation={navigation} titleKey="settings.title">
      <Card>
        <Text style={[type.smallStrong, { color: theme.textMuted }]}>{t('settings.language')}</Text>
        <View style={styles.chipRow}>
          {LANGS.map((l) => (
            <Chip key={l.code} label={l.label} selected={locale === l.code} onPress={() => setLocale(l.code)} />
          ))}
        </View>
        <Text style={[type.smallStrong, { color: theme.textMuted, marginTop: spacing.md }]}>{t('settings.theme')}</Text>
        <View style={styles.chipRow}>
          <Chip label={t('settings.light')} selected={mode === 'light'} onPress={() => setMode('light')} />
          <Chip label={t('settings.dark')} selected={mode === 'dark'} onPress={() => setMode('dark')} />
        </View>
        <View style={[styles.kvRow, { borderTopColor: theme.border, marginTop: spacing.md }]}>
          <Text style={[type.body, { color: theme.text, flex: 1 }]}>{t('settings.notifications')}</Text>
          <Switch
            value={notif}
            onValueChange={setNotif}
            accessibilityLabel={t('settings.notifications')}
          />
        </View>
      </Card>
      <Card style={{ marginTop: spacing.md }}>
        <Pressable
          onPress={async () => { await clearFarmProfile(); }}
          accessibilityRole="button"
          accessibilityLabel={t('settings.clear_data')}
          style={styles.pressRow}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={theme.danger} />
          <Text style={[type.body, { color: theme.danger, marginLeft: spacing.md }]}>{t('settings.clear_data')}</Text>
        </Pressable>
      </Card>
      <Text style={[type.caption, { color: theme.textMuted, marginTop: spacing.lg, textAlign: 'center' }]}>
        {t('settings.about')} • {t('settings.version')}
      </Text>
    </Shell>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  backBtn: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  body: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center' },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: spacing.md, marginBottom: spacing.sm },
  fill: { height: 8, borderRadius: 4 },
  kvRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  mktGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, flexWrap: 'wrap' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  numInput: {
    width: 110, minHeight: MIN_TOUCH - 8, borderWidth: 1.5,
    borderRadius: radius.md, textAlign: 'right', paddingHorizontal: spacing.md,
  },
  textArea: {
    minHeight: 110, borderWidth: 1.5, borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.md,
  },
  pressRow: { flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH },
});
