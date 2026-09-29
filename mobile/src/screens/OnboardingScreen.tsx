import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { MIN_TOUCH, radius, spacing, type } from '../theme/tokens';
import { Button, Card, Chip, SectionTitle } from '../components/ui';
import { FarmProfile, saveFarmProfile } from '../services/storage';

const SOILS = ['sandy', 'loam', 'clay', 'black', 'red', 'alluvial'] as const;
const CROPS = ['tomato', 'onion', 'soybean', 'cotton', 'maize', 'wheat', 'sugarcane', 'rice'] as const;
const STAGES = ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'] as const;
const TOTAL = 7;

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [land, setLand] = useState('2.5');
  const [soil, setSoil] = useState<string>('black');
  const [water, setWater] = useState<'low' | 'medium' | 'high'>('medium');
  const [crop, setCrop] = useState<string>('tomato');
  const [stage, setStage] = useState<string>('fruiting');
  const [ph, setPh] = useState('');
  const [n, setN] = useState('');
  const [p, setP] = useState('');
  const [k, setK] = useState('');

  const useGps = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        return; // user can type manually instead
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      const rev = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const r = rev[0];
      if (r) setLocation([r.city, r.region].filter(Boolean).join(', '));
    } catch {
      /* manual entry fallback */
    } finally {
      setLocating(false);
    }
  };

  const canNext = () => {
    switch (step) {
      case 0:
        return name.trim().length > 0 && location.trim().length > 0;
      case 1:
        return parseFloat(land) > 0;
      default:
        return true;
    }
  };

  const finish = async () => {
    setSaving(true);
    const profile: FarmProfile = {
      farmerName: name.trim(),
      location: location.trim(),
      lat: coords?.lat,
      lng: coords?.lng,
      landAcres: parseFloat(land) || 0,
      soilType: soil,
      water,
      crop: t(`crops.${crop}`),
      cropStage: t(`onboarding.stage_${stage}`),
      soilPh: ph ? parseFloat(ph) : undefined,
      soilN: n ? parseFloat(n) : undefined,
      soilP: p ? parseFloat(p) : undefined,
      soilK: k ? parseFloat(k) : undefined,
      onboarded: true,
      updatedAt: new Date().toISOString(),
    };
    await saveFarmProfile(profile); // local now; Supabase POST wired server-side
    setSaving(false);
    onDone();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={[type.h2, { color: theme.text }]}>{t('onboarding.location_label')}</Text>
            <Text style={[type.body, { color: theme.textMuted, marginTop: spacing.sm }]}>
              {t('onboarding.location_subtitle')}
            </Text>
            <Text style={[type.smallStrong, { color: theme.text, marginTop: spacing.lg }]}>
              {t('onboarding.name_label')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('onboarding.name_placeholder')}
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              accessibilityLabel={t('onboarding.name_label')}
            />
            <View style={styles.row}>
              <Button
                title={locating ? t('common.loading') : t('onboarding.use_gps')}
                onPress={useGps}
                variant="secondary"
                accessibilityLabel={t('onboarding.use_gps')}
              />
            </View>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={t('onboarding.location_manual_placeholder')}
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              accessibilityLabel={t('onboarding.location_label')}
            />
          </View>
        );
      case 1:
        return (
          <View>
            <Text style={[type.h2, { color: theme.text }]}>{t('onboarding.land_label')}</Text>
            <View style={[styles.landRow, { marginTop: spacing.xl }]}>
              <Pressable
                onPress={() => setLand((v) => String(Math.max(0.5, (parseFloat(v) || 0) - 0.5)))}
                accessibilityRole="button"
                accessibilityLabel="−"
                style={[styles.stepper, { borderColor: theme.border }]}>
                <Text style={[type.h2, { color: theme.primary }]}>−</Text>
              </Pressable>
              <View style={styles.landValue}>
                <TextInput
                  value={land}
                  onChangeText={(v) => setLand(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  style={[type.display, styles.landInput, { color: theme.text }]}
                  accessibilityLabel={t('onboarding.land_label')}
                />
                <Text style={[type.body, { color: theme.textMuted }]}>{t('onboarding.land_unit')}</Text>
              </View>
              <Pressable
                onPress={() => setLand((v) => String((parseFloat(v) || 0) + 0.5))}
                accessibilityRole="button"
                accessibilityLabel="+"
                style={[styles.stepper, { borderColor: theme.border }]}>
                <Text style={[type.h2, { color: theme.primary }]}>+</Text>
              </Pressable>
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={[type.h2, { color: theme.text }]}>{t('onboarding.soil_label')}</Text>
            <View style={[styles.grid, { marginTop: spacing.lg }]}>
              {SOILS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSoil(s)}
                  accessibilityRole="button"
                  accessibilityLabel={t(`soil.${s}`)}
                  accessibilityState={{ selected: soil === s }}
                  style={[
                    styles.soilCard,
                    {
                      backgroundColor: soil === s ? theme.primary : theme.surface,
                      borderColor: soil === s ? theme.primary : theme.border,
                    },
                  ]}>
                  <Text style={[type.h1, { textAlign: 'center' }]}>
                    {s === 'sandy' ? '🏜' : s === 'loam' ? '🌱' : s === 'clay' ? '🟤' : s === 'black' ? '⬛' : s === 'red' ? '🟥' : '🌊'}
                  </Text>
                  <Text
                    style={[
                      type.smallStrong,
                      { color: soil === s ? theme.primaryText : theme.text, textAlign: 'center', marginTop: spacing.sm },
                    ]}>
                    {t(`soil.${s}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={[type.h2, { color: theme.text }]}>{t('onboarding.water_label')}</Text>
            <View style={{ marginTop: spacing.lg }}>
              {(['low', 'medium', 'high'] as const).map((w) => (
                <Pressable
                  key={w}
                  onPress={() => setWater(w)}
                  accessibilityRole="button"
                  accessibilityLabel={t(`onboarding.water_${w}`)}
                  accessibilityState={{ selected: water === w }}
                  style={[
                    styles.waterRow,
                    { backgroundColor: water === w ? theme.primary : theme.surface, borderColor: theme.border },
                  ]}>
                  <Text style={[type.h2]}>{w === 'low' ? '💧' : w === 'medium' ? '💧💧' : '💧💧💧'}</Text>
                  <Text style={[type.bodyStrong, { color: water === w ? theme.primaryText : theme.text, marginLeft: spacing.md }]}>
                    {t(`onboarding.water_${w}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={[type.h2, { color: theme.text }]}>{t('onboarding.crop_label')}</Text>
            <View style={[styles.chipWrap, { marginTop: spacing.lg }]}>
              {CROPS.map((c) => (
                <Chip key={c} label={t(`crops.${c}`)} selected={crop === c} onPress={() => setCrop(c)} />
              ))}
            </View>
          </View>
        );
      case 5:
        return (
          <View>
            <Text style={[type.h2, { color: theme.text }]}>{t('onboarding.crop_stage_label')}</Text>
            <View style={{ marginTop: spacing.lg }}>
              {STAGES.map((s, i) => (
                <Pressable
                  key={s}
                  onPress={() => setStage(s)}
                  accessibilityRole="button"
                  accessibilityLabel={t(`onboarding.stage_${s}`)}
                  accessibilityState={{ selected: stage === s }}
                  style={[
                    styles.stageRow,
                    { backgroundColor: stage === s ? theme.primary : theme.surface, borderColor: theme.border },
                  ]}>
                  <View style={[styles.stageDot, { backgroundColor: stage === s ? theme.accent : theme.border }]}>
                    <Text style={[type.caption, { color: stage === s ? theme.primary : theme.textMuted }]}>{i + 1}</Text>
                  </View>
                  <Text style={[type.bodyStrong, { color: stage === s ? theme.primaryText : theme.text, marginLeft: spacing.md }]}>
                    {t(`onboarding.stage_${s}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      default:
        return (
          <View>
            <Text style={[type.h2, { color: theme.text }]}>
              {t('onboarding.soil_optional_label')}
            </Text>
            {[
              { k: 'ph', label: t('onboarding.soil_ph'), val: ph, set: setPh },
              { k: 'n', label: t('onboarding.soil_n'), val: n, set: setN },
              { k: 'p', label: t('onboarding.soil_p'), val: p, set: setP },
              { k: 'k', label: t('onboarding.soil_k'), val: k, set: setK },
            ].map((f) => (
              <View key={f.k} style={styles.soilRow}>
                <Text style={[type.bodyStrong, { color: theme.text, flex: 1 }]}>{f.label}</Text>
                <TextInput
                  value={f.val}
                  onChangeText={(v) => f.set(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.soilInput, type.body, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                  accessibilityLabel={f.label}
                />
              </View>
            ))}
            <Card style={{ marginTop: spacing.xl }}>
              <Text style={[type.h3, { color: theme.success }]}>✓ {t('onboarding.done_message')}</Text>
            </Card>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.progress}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                { backgroundColor: i <= step ? theme.primary : theme.border },
              ]}
            />
          ))}
        </View>
        <Text style={[type.caption, { color: theme.textMuted, marginTop: spacing.sm }]}>
          {t('onboarding.step_of', { current: step + 1, total: TOTAL })}
        </Text>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled">
          {renderStep()}
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          {step > 0 ? (
            <Button title={t('common.back')} onPress={() => setStep(step - 1)} variant="ghost" />
          ) : (
            <View />
          )}
          {step === TOTAL - 1 ? (
            <Button
              title={t('onboarding.done_message').split('.')[0] || t('common.done')}
              onPress={finish}
              loading={saving}
              accessibilityLabel={t('onboarding.done_message')}
            />
          ) : (
            <Button
              title={step === TOTAL - 2 ? t('common.skip') : t('common.next')}
              onPress={() => (step === TOTAL - 2 ? finish() : setStep(step + 1))}
              disabled={!canNext()}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    fontSize: 16,
  },
  row: { marginTop: spacing.md, alignSelf: 'flex-start' },
  landRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  stepper: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landValue: { alignItems: 'center', minWidth: 120 },
  landInput: { textAlign: 'center', minWidth: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  soilCard: {
    width: '31%',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: MIN_TOUCH + 16,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    minHeight: MIN_TOUCH + 8,
  },
  stageDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  soilRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  soilInput: {
    width: 110,
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderRadius: radius.md,
    textAlign: 'center',
  },
});
