import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { radius, spacing, type } from '../theme/tokens';
import { Badge, Card, FadeIn, SectionTitle } from '../components/ui';
import { DEMO_PROFILE, getFarmProfile, FarmProfile } from '../services/storage';

export default function FarmScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [profile, setProfile] = useState<FarmProfile>(DEMO_PROFILE);

  useEffect(() => {
    getFarmProfile().then((p) => p && setProfile(p));
  }, []);

  const timeline = [
    { key: 'planted', icon: 'sprout', date: '12 Jun' },
    { key: 'fertilizer', icon: 'flask-outline', date: '28 Jun' },
    { key: 'scan', icon: 'scan-helper', date: '15 Jul' },
    { key: 'alert', icon: 'weather-lightning-rainy', date: '02 Aug' },
    { key: 'harvest', icon: 'basket', date: 'Sep' },
  ];

  const stats = [
    { label: t('farm.expenses'), value: '₹48,200', icon: 'cash-minus' },
    { label: t('farm.yield'), value: '9,400 kg', icon: 'scale' },
    { label: t('farm.estimated_profit'), value: '₹1,12,000', icon: 'cash-plus' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { color: theme.text }]}>{t('farm.title')}</Text>

        <FadeIn>
          <Card style={{ marginTop: spacing.lg }}>
            <View style={styles.headRow}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={[type.h2, { color: theme.primaryText }]}>
                  {profile.farmerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[type.h2, { color: theme.text }]}>{profile.farmerName}</Text>
                <View style={styles.locRow}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={theme.primary} />
                  <Text style={[type.small, { color: theme.textMuted, marginLeft: 4 }]}>{profile.location}</Text>
                </View>
              </View>
            </View>
            <View style={styles.chipRow}>
              <Badge icon="🌱" label={profile.crop} tone="neutral" />
              <Badge icon="◐" label={profile.cropStage} tone="neutral" />
              <Badge icon="▦" label={`${profile.landAcres} ${t('common.acres')}`} tone="neutral" />
            </View>
            <View style={[styles.healthRow, { borderTopColor: theme.border, marginTop: spacing.md }]}>
              <Text style={[type.smallStrong, { color: theme.textMuted }]}>{t('farm.health')}</Text>
              <Badge icon="✓" label="82/100" tone="success" />
            </View>
          </Card>
        </FadeIn>

        <SectionTitle title={t('farm.recent_activity')} />
        <View style={styles.statGrid}>
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 60} style={{ flex: 1 }}>
              <Card style={styles.statCard}>
                <MaterialCommunityIcons name={s.icon as any} size={22} color={theme.primary} />
                <Text style={[type.h3, { color: theme.text, marginTop: spacing.sm, ...type.numeric }]}>
                  {s.value}
                </Text>
                <Text style={[type.caption, { color: theme.textMuted, marginTop: 2 }]}>{s.label}</Text>
              </Card>
            </FadeIn>
          ))}
        </View>

        <SectionTitle title={t('farm.timeline')} />
        <Card>
          {timeline.map((ev, i) => (
            <View key={ev.key} style={styles.tlRow}>
              <View style={styles.tlRail}>
                <View style={[styles.tlDot, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
                  <MaterialCommunityIcons name={ev.icon as any} size={13} color={theme.primaryText} />
                </View>
                {i < timeline.length - 1 && <View style={[styles.tlLine, { backgroundColor: theme.border }]} />}
              </View>
              <View style={styles.tlBody}>
                <Text style={[type.bodyStrong, { color: theme.text }]}>{t(`timeline.${ev.key}`)}</Text>
                <Text style={[type.caption, { color: theme.textMuted }]}>{ev.date}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56, height: 56, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  healthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, paddingTop: spacing.md,
  },
  statGrid: { flexDirection: 'row', gap: spacing.md },
  statCard: { alignItems: 'flex-start' },
  tlRow: { flexDirection: 'row' },
  tlRail: { alignItems: 'center', width: 32 },
  tlDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tlLine: { width: 2, flex: 1, minHeight: 20 },
  tlBody: { marginLeft: spacing.md, paddingBottom: spacing.lg, flex: 1 },
});
