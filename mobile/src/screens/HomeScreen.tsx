import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { MIN_TOUCH, radius, shadow, spacing, type } from '../theme/tokens';
import { Badge, Card, ErrorState, FadeIn, SectionTitle, Skeleton } from '../components/ui';
import { api, TodayAction } from '../services/api';
import { DEMO_PROFILE, getFarmProfile, FarmProfile } from '../services/storage';

const CATEGORY_ICON: Record<TodayAction['category'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  WEATHER: 'weather-rainy',
  DISEASE: 'virus',
  IRRIGATION: 'water',
  MARKET: 'trending-up',
  CROP: 'sprout',
  SCHEME: 'bank',
  INSURANCE: 'shield-check',
  TASK: 'check-circle-outline',
};

function greetingKey(hour: number) {
  return hour < 12 ? 'home.good_morning' : hour < 17 ? 'home.good_afternoon' : 'home.good_evening';
}

function demoActions(t: (k: string) => string): TodayAction[] {
  const now = new Date().toISOString();
  return [
    {
      priority: 1, category: 'WEATHER',
      title: t('demo.action1_title'), reason: t('demo.action1_reason'),
      recommended_action: t('demo.action1_action'), timestamp: now, status: 'pending',
    },
    {
      priority: 2, category: 'DISEASE',
      title: t('demo.action2_title'), reason: t('demo.action2_reason'),
      recommended_action: t('demo.action2_action'), timestamp: now, status: 'pending',
    },
    {
      priority: 3, category: 'MARKET',
      title: t('demo.action3_title'), reason: t('demo.action3_reason'),
      recommended_action: t('demo.action3_action'), timestamp: now, status: 'pending',
    },
    {
      priority: 4, category: 'CROP',
      title: t('demo.action4_title'), reason: t('demo.action4_reason'),
      recommended_action: t('demo.action4_action'), timestamp: now, status: 'pending',
    },
  ];
}

function ActionCard({
  action,
  index,
  onDone,
}: {
  action: TodayAction;
  index: number;
  onDone: () => void;
}) {
  const { theme } = useTheme();
  const { t, locale } = useI18n();
  const tone = action.priority <= 1 ? 'danger' : action.priority === 2 ? 'warning' : 'info';
  const pLabel =
    action.priority <= 1 ? t('actions.priority_high')
    : action.priority === 2 ? t('actions.priority_medium')
    : t('actions.priority_info');
  const ts = new Date(action.timestamp).toLocaleString(locale === 'hi' ? 'hi-IN' : locale === 'mr' ? 'mr-IN' : 'en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });

  return (
    <FadeIn delay={index * 70}>
      <Card
        style={[styles.actionCard, action.status === 'done' && { opacity: 0.6 }]}
        accessibilityLabel={`${pLabel}. ${action.title}`}>
        <View style={styles.badgeRow}>
          <Badge
            icon={action.priority <= 1 ? '!' : action.priority === 2 ? '▲' : 'i'}
            label={pLabel}
            tone={tone}
          />
          <Badge
            icon={
              <MaterialCommunityIcons name={CATEGORY_ICON[action.category] ?? 'circle'} size={12} color={theme.textMuted} />
            }
            label={t(`actions.category_${action.category.toLowerCase()}`)}
            tone="neutral"
          />
        </View>
        <Text style={[type.h3, { color: theme.text, marginTop: spacing.sm }]}>{action.title}</Text>
        <Text style={[type.body, { color: theme.textMuted, marginTop: spacing.xs }]}>{action.reason}</Text>
        <View style={[styles.recBox, { backgroundColor: theme.surfaceAlt, marginTop: spacing.md }]}>
          <Text style={[type.caption, { color: theme.primary, fontWeight: '700' }]}>→</Text>
          <Text style={[type.bodyStrong, { color: theme.text, flex: 1 }]}>{action.recommended_action}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={[type.caption, { color: theme.textMuted }]}>{ts}</Text>
          {action.status === 'done' ? (
            <Badge icon="✓" label={t('actions.status_done')} tone="success" />
          ) : (
            <Pressable
              onPress={onDone}
              accessibilityRole="button"
              accessibilityLabel={t('actions.mark_done')}
              style={[styles.doneBtn, { borderColor: theme.border }]}>
              <Text style={[type.smallStrong, { color: theme.primary }]}>{t('actions.mark_done')}</Text>
            </Pressable>
          )}
        </View>
      </Card>
    </FadeIn>
  );
}

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [profile, setProfile] = useState<FarmProfile>(DEMO_PROFILE);
  const [actions, setActions] = useState<TodayAction[] | null>(null);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    const p = (await getFarmProfile()) ?? DEMO_PROFILE;
    setProfile(p);
    try {
      const { data, stale: isStale } = await api.getTodayActions(p);
      setActions(data);
      setStale(isStale);
    } catch {
      // Backend unreachable → clearly-labeled demo seed so the SIH story still runs.
      setActions(demoActions(t));
      setStale(true);
      setError(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const markDone = (i: number) =>
    setActions((a) => (a ? a.map((x, j) => (j === i ? { ...x, status: 'done' as const } : x)) : a));

  const ask = () => {
    if (!query.trim()) return;
    navigation.navigate('AI', { q: query.trim() });
    setQuery('');
  };

  const hour = new Date().getHours();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[type.body, { color: theme.textMuted }]}>{t(greetingKey(hour))},</Text>
        <Text style={[type.h1, { color: theme.text }]}>{profile.farmerName}</Text>
        <View style={styles.locRow}>
          <MaterialCommunityIcons name="map-marker" size={15} color={theme.primary} />
          <Text style={[type.small, { color: theme.textMuted, marginLeft: 4 }]}>{profile.location}</Text>
        </View>
        <View style={styles.chipRow}>
          <Badge icon="🌱" label={profile.crop} tone="neutral" />
          <Badge icon="◐" label={profile.cropStage} tone="neutral" />
          <Badge
            icon="▦"
            label={`${profile.landAcres} ${t('common.acres')}`}
            tone="neutral"
          />
        </View>

        {/* WHAT SHOULD I DO TODAY? */}
        <SectionTitle title={t('home.what_should_i_do_today')} />
        {stale && (
          <View style={[styles.staleBar, { backgroundColor: theme.surfaceAlt }]}>
            <MaterialCommunityIcons name="wifi-off" size={14} color={theme.warning} />
            <Text style={[type.caption, { color: theme.textMuted, marginLeft: spacing.sm }]}>
              {t('home.stale_note')}
            </Text>
          </View>
        )}
        {actions === null ? (
          <View>
            <Skeleton height={120} style={{ marginBottom: spacing.md }} />
            <Skeleton height={120} style={{ marginBottom: spacing.md }} />
            <Skeleton height={120} />
          </View>
        ) : error ? (
          <ErrorState title={t('errors.api_error')} onRetry={load} />
        ) : (
          actions.slice(0, 5).map((a, i) => (
            <ActionCard key={`${a.title}-${i}`} action={a} index={i} onDone={() => markDone(i)} />
          ))
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* ASK AGRISAARTHI — text, voice, camera */}
      <View style={[styles.askBar, shadow.raised, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Pressable
          onPress={() => navigation.navigate('Scan')}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.camera_button')}
          style={[styles.askIcon, { backgroundColor: theme.surfaceAlt }]}>
          <MaterialCommunityIcons name="camera" size={22} color={theme.primary} />
        </Pressable>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.ask_agrisaarthi')}
          placeholderTextColor={theme.textMuted}
          style={[styles.askInput, type.body, { color: theme.text, backgroundColor: theme.surfaceAlt }]}
          accessibilityLabel={t('home.ask_agrisaarthi')}
          returnKeyType="send"
          onSubmitEditing={ask}
        />
        <Pressable
          onPress={() => {
            setListening(true);
            setTimeout(() => setListening(false), 1500); // voice input wiring point
          }}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.mic_button')}
          style={[styles.askIcon, { backgroundColor: listening ? theme.primary : theme.surfaceAlt }]}>
          <MaterialCommunityIcons
            name={listening ? 'microphone' : 'microphone-outline'}
            size={22}
            color={listening ? theme.primaryText : theme.primary}
          />
        </Pressable>
        <Pressable
          onPress={ask}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.send_button')}
          style={[styles.askSend, { backgroundColor: theme.primary }]}>
          <MaterialCommunityIcons name="send" size={20} color={theme.primaryText} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: spacing.lg, paddingBottom: spacing.md },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  staleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  actionCard: { marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  recBox: { flexDirection: 'row', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  doneBtn: {
    minHeight: MIN_TOUCH - 12,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  askInput: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
  },
  askIcon: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askSend: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
