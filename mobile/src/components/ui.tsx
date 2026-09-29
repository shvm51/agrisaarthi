/**
 * AgriSaarthi design-system components.
 * Every screen composes these — no per-screen restyling.
 * Accessibility: min 48dp targets, icon + text badges (never color-only).
 */
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { MIN_TOUCH, radius, shadow, spacing, type } from '../theme/tokens';
import { useI18n } from '../i18n';

// ── Button ─────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  accessibilityLabel,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const bg =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.danger
        : 'transparent';
  const border =
    variant === 'secondary' ? { borderWidth: 1.5, borderColor: theme.primary } : undefined;
  const fg =
    variant === 'primary' || variant === 'danger'
      ? theme.primaryText
      : variant === 'ghost'
        ? theme.textMuted
        : theme.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        border,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[type.button, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

// ── Card ───────────────────────────────────────────────────────
export function Card({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { theme } = useTheme();
  const inner = (
    <View style={[styles.card, shadow.card, { backgroundColor: theme.surface }, style]}>
      {children}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
      {inner}
    </Pressable>
  );
}

// ── Badge: icon + text, never color alone ───────────────────────
export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_ICON: Record<BadgeTone, string> = {
  success: '✓',
  warning: '▲',
  danger: '!',
  info: 'i',
  neutral: '•',
};

export function Badge({
  icon,
  label,
  tone = 'neutral',
  style,
}: {
  icon?: string | React.ReactNode;
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const color =
    tone === 'success'
      ? theme.success
      : tone === 'warning'
        ? theme.warning
        : tone === 'danger'
          ? theme.danger
          : tone === 'info'
            ? theme.info
            : theme.textMuted;
  const iconEl =
    icon === undefined || typeof icon === 'string' ? (
      <Text style={[type.caption, { color, fontWeight: '700' }]}>{icon ?? TONE_ICON[tone]}</Text>
    ) : (
      icon
    );
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={typeof icon === 'string' ? `${icon} ${label}` : label}
      style={[
        styles.badge,
        { borderColor: color, backgroundColor: `${color}14` },
        style,
      ]}>
      {iconEl}
      <Text style={[type.caption, { color, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

// ── Chip (selectable) ──────────────────────────────────────────
export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.surfaceAlt,
          borderColor: selected ? theme.primary : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Text
        style={[
          type.smallStrong,
          { color: selected ? theme.primaryText : theme.text },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── BottomSheet (stub — Modal-based, Expo Go safe) ─────────────
export function BottomSheet({
  visible,
  onClose,
  children,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  const { theme } = useTheme();
  const { t } = useI18n();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.sheetBackdrop, { backgroundColor: theme.overlay }]} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          shadow.raised,
          { backgroundColor: theme.surface },
        ]}>
        <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
        {title ? (
          <View style={styles.sheetHeader}>
            <Text style={[type.h3, { color: theme.text }]}>{title}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('a11y.close')}
              style={styles.sheetClose}>
              <Text style={[type.h3, { color: theme.textMuted }]}>✕</Text>
            </Pressable>
          </View>
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

// ── Skeleton (subtle shimmer via Animated opacity) ─────────────
export function Skeleton({ height = 16, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[{ height, borderRadius: radius.sm, backgroundColor: theme.skeleton, opacity }, style]}
    />
  );
}

// ── EmptyState / ErrorState ────────────────────────────────────
export function EmptyState({ title, body, icon = '○' }: { title: string; body?: string; icon?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[type.display, { color: theme.textMuted }]}>{icon}</Text>
      <Text style={[type.h3, { color: theme.text, marginTop: spacing.md, textAlign: 'center' }]}>{title}</Text>
      {body ? (
        <Text style={[type.body, { color: theme.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>{body}</Text>
      ) : null}
    </View>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body?: string; onRetry?: () => void }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.center}>
      <Text style={[type.display, { color: theme.warning }]}>⚠</Text>
      <Text style={[type.h3, { color: theme.text, marginTop: spacing.md, textAlign: 'center' }]}>{title}</Text>
      {body ? (
        <Text style={[type.body, { color: theme.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>{body}</Text>
      ) : null}
      {onRetry ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button title={t('common.retry')} onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

// ── SectionTitle ───────────────────────────────────────────────
export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <Text style={[type.overline, { color: theme.textMuted }]}>{title}</Text>
      {action}
    </View>
  );
}

// ── FadeIn: subtle card entrance motion ─────────────────────────
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={[
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  chip: {
    minHeight: MIN_TOUCH - 8,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetBackdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetClose: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'flex-end', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});

export type { TextStyle, ViewStyle };
