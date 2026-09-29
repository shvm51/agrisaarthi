import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { MIN_TOUCH, radius, spacing, type } from '../theme/tokens';
import { SectionTitle } from '../components/ui';

const GROUPS: { group: string | null; items: { route: string; labelKey: string; icon: string }[] }[] = [
  {
    group: 'more.group_grow',
    items: [{ route: 'CropRecommendation', labelKey: 'more.item_crop_rec', icon: 'sprout' }],
  },
  {
    group: 'more.group_manage',
    items: [
      { route: 'Weather', labelKey: 'more.item_weather', icon: 'weather-partly-cloudy' },
      { route: 'Irrigation', labelKey: 'more.item_irrigation', icon: 'water' },
    ],
  },
  {
    group: 'more.group_sell',
    items: [
      { route: 'Market', labelKey: 'more.item_market', icon: 'trending-up' },
      { route: 'Marketplace', labelKey: 'more.item_marketplace', icon: 'store' },
      { route: 'Profitability', labelKey: 'more.item_profit', icon: 'calculator' },
    ],
  },
  {
    group: 'more.group_protect',
    items: [
      { route: 'Schemes', labelKey: 'more.item_schemes', icon: 'bank' },
      { route: 'Insurance', labelKey: 'more.item_insurance', icon: 'shield-check' },
      { route: 'Expert', labelKey: 'more.item_expert', icon: 'account-tie' },
    ],
  },
  {
    group: null,
    items: [{ route: 'Settings', labelKey: 'more.item_settings', icon: 'cog' }],
  },
];

export default function MoreScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { color: theme.text }]}>{t('more.title')}</Text>
        {GROUPS.map((g, gi) => (
          <View key={`${g.group}-${gi}`}>
            {g.group && <SectionTitle title={t(g.group)} />}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {g.items.map((item, ii) => (
                <Pressable
                  key={item.route}
                  onPress={() => navigation.navigate(item.route)}
                  accessibilityRole="button"
                  accessibilityLabel={t(item.labelKey)}
                  style={({ pressed }) => [
                    styles.row,
                    ii > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                    { opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <View style={[styles.iconBox, { backgroundColor: theme.surfaceAlt }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={22} color={theme.primary} />
                  </View>
                  <Text style={[type.bodyStrong, { color: theme.text, flex: 1, marginLeft: spacing.md }]}>
                    {t(item.labelKey)}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: MIN_TOUCH + 16,
  },
  iconBox: {
    width: MIN_TOUCH - 8,
    height: MIN_TOUCH - 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
