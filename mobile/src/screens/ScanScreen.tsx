import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { radius, spacing, type } from '../theme/tokens';
import { Badge, Button, Card, ErrorState, FadeIn, Skeleton } from '../components/ui';
import { api, DiseaseResult } from '../services/api';
import { DEMO_PROFILE, getFarmProfile } from '../services/storage';

const CONFIDENCE_THRESHOLD = 0.6; // below this: never present as certain
const MAX_BASE64_BYTES = 8 * 1024 * 1024;

function demoResult(t: (k: string) => string): DiseaseResult {
  return {
    disease: 'Tomato Early Blight',
    confidence: 0.92,
    severity: 'SEVERE',
    risk_score: 87,
    risk_level: 'HIGH',
    risk_factors: [t('demo.factor1'), t('demo.factor2'), t('demo.factor3'), t('demo.factor4')],
    recommended_action: t('demo.scan_recommendation'),
    model_version: 'demo-v1',
  };
}

export default function ScanScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (camera: boolean) => {
    setError(null);
    setResult(null);
    try {
      const perm = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = camera
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      // Validation: size + minimum resolution (real blur detection runs server-side).
      const approxBytes = asset.base64 ? Math.ceil((asset.base64.length * 3) / 4) : 0;
      if (approxBytes > MAX_BASE64_BYTES) {
        setError(t('errors.image_too_blurry'));
        return;
      }
      if ((asset.width ?? 0) < 400 || (asset.height ?? 0) < 400) {
        setError(t('errors.image_too_blurry'));
        return;
      }
      setImageUri(asset.uri);
      analyze(asset.uri);
    } catch {
      setError(t('errors.api_error'));
    }
  };

  const analyze = async (imageUri: string) => {
    setAnalyzing(true);
    setIsDemo(false);
    try {
      const profile = (await getFarmProfile()) ?? DEMO_PROFILE;
      const d = await api.detectDisease(imageUri, { crop: profile.crop, stage: profile.cropStage });
      // Risk engine: disease + weather + crop stage → overall risk (spec: detection is not the final risk).
      let risk = { risk_score: 0, risk_level: 'LOW' as const, risk_factors: [] as string[], recommended_action: '' };
      try {
        const { data } = await api.getFarmRisk({
          disease_probability: d.confidence,
          confidence: d.confidence,
          severity: d.severity ?? '',
          crop_stage: profile.cropStage,
          temperature_c: 31,
          humidity_pct: 78,
          rainfall_mm: 5,
        });
        risk = data;
      } catch {
        // Detection result still shown; risk section falls back to defaults.
      }
      setResult({ ...d, ...risk });
    } catch {
      setError(t('errors.api_error'));
    } finally {
      setAnalyzing(false);
    }
  };

  const runDemo = () => {
    setError(null);
    setIsDemo(true);
    setResult(demoResult(t));
  };

  const lowConfidence = result !== null && result.confidence < CONFIDENCE_THRESHOLD;
  const severityTone = result?.severity === 'SEVERE' ? 'danger' : result?.severity === 'MODERATE' ? 'warning' : 'success';
  const riskTone = result?.risk_level === 'HIGH' ? 'danger' : result?.risk_level === 'MEDIUM' ? 'warning' : 'success';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { color: theme.text }]}>{t('scan.title')}</Text>

        {!result && !analyzing && (
          <View>
            <View style={styles.btnRow}>
              <Button
                title={t('scan.take_photo')}
                onPress={() => pick(true)}
                accessibilityLabel={t('scan.take_photo')}
              />
              <Button
                title={t('scan.upload_image')}
                onPress={() => pick(false)}
                variant="secondary"
                accessibilityLabel={t('scan.upload_image')}
              />
            </View>
            {error && (
              <View style={{ marginTop: spacing.lg }}>
                <ErrorState title={error} body={t('errors.image_too_blurry') === error ? undefined : t('errors.try_again')} />
                <View style={{ marginTop: spacing.md }}>
                  <Button title={`${t('demo.badge')}: ${t('scan.analyzing')}`} onPress={runDemo} variant="ghost" />
                </View>
              </View>
            )}
          </View>
        )}

        {imageUri && !result && !analyzing && !error && (
          <Card style={{ marginTop: spacing.lg }}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          </Card>
        )}

        {analyzing && (
          <View style={{ marginTop: spacing.lg }}>
            <Skeleton height={180} style={{ borderRadius: radius.lg }} />
            <Text style={[type.body, { color: theme.textMuted, marginTop: spacing.md, textAlign: 'center' }]}>
              {t('scan.analyzing')}
            </Text>
          </View>
        )}

        {result && (
          <FadeIn>
            <View style={{ marginTop: spacing.lg }}>
              {isDemo && (
                <View style={{ marginBottom: spacing.md }}>
                  <Badge icon="ⓘ" label={t('demo.badge')} tone="info" />
                </View>
              )}
              {lowConfidence ? (
                <Card>
                  <View style={styles.centerRow}>
                    <MaterialCommunityIcons name="help-circle-outline" size={40} color={theme.warning} />
                  </View>
                  <Text style={[type.h2, { color: theme.text, textAlign: 'center', marginTop: spacing.md }]}>
                    {t('errors.low_confidence')}
                  </Text>
                  <Text style={[type.body, { color: theme.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
                    {t('errors.image_too_blurry')}
                  </Text>
                  <View style={styles.btnRow}>
                    <Button title={t('scan.try_another')} onPress={() => { setResult(null); setImageUri(null); }} />
                    <Button
                      title={t('scan.contact_expert')}
                      variant="secondary"
                      onPress={() => navigation.navigate('More', { screen: 'Expert' })}
                    />
                  </View>
                </Card>
              ) : (
                <View>
                  <Card>
                    <Text style={[type.overline, { color: theme.textMuted }]}>{t('scan.disease_found')}</Text>
                    <Text style={[type.h2, { color: theme.text, marginTop: spacing.xs }]}>
                      {t('scan.probable_prefix')} {result.disease}
                    </Text>
                    <View style={[styles.confBar, { backgroundColor: theme.surfaceAlt, marginTop: spacing.md }]}>
                      <View
                        style={[
                          styles.confFill,
                          { width: `${Math.round(result.confidence * 100)}%`, backgroundColor: theme.primary },
                        ]}
                      />
                    </View>
                    <Text style={[type.small, { color: theme.textMuted, marginTop: spacing.xs }]}>
                      {t('scan.confidence')}: <Text style={[type.smallStrong, { color: theme.text, ...type.numeric }]}>
                        {Math.round(result.confidence * 100)}%
                      </Text>
                    </Text>
                    <View style={styles.badgeRow}>
                      {result.severity && (
                        <Badge
                          icon={result.severity === 'SEVERE' ? '!' : result.severity === 'MODERATE' ? '▲' : '✓'}
                          label={`${t('scan.severity')}: ${t(`scan.severity_${result.severity.toLowerCase()}`)}`}
                          tone={severityTone}
                        />
                      )}
                      <Badge
                        icon={result.risk_level === 'HIGH' ? '!' : result.risk_level === 'MEDIUM' ? '▲' : '✓'}
                        label={`${t('scan.risk_level')}: ${result.risk_level} (${result.risk_score}/100)`}
                        tone={riskTone}
                      />
                    </View>
                  </Card>

                  <Card style={{ marginTop: spacing.md }}>
                    <Text style={[type.overline, { color: theme.textMuted }]}>{t('scan.risk_factors')}</Text>
                    {result.risk_factors.map((f, i) => (
                      <Text key={i} style={[type.body, { color: theme.text, marginTop: spacing.sm }]}>
                        • {f}
                      </Text>
                    ))}
                    <Text style={[type.bodyStrong, { color: theme.text, marginTop: spacing.md }]}>
                      → {result.recommended_action}
                    </Text>
                  </Card>

                  <View style={styles.btnRow}>
                    <Button
                      title={t('scan.new_scan')}
                      variant="secondary"
                      onPress={() => { setResult(null); setImageUri(null); setIsDemo(false); }}
                    />
                    <Button
                      title={t('scan.contact_expert')}
                      onPress={() => navigation.navigate('More', { screen: 'Expert' })}
                    />
                  </View>
                </View>
              )}
            </View>
          </FadeIn>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: spacing.lg },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, flexWrap: 'wrap' },
  preview: { width: '100%', height: 220, borderRadius: radius.md },
  centerRow: { alignItems: 'center' },
  confBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  confFill: { height: 8, borderRadius: 4 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
});
