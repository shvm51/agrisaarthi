import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { MIN_TOUCH, radius, spacing, type } from '../theme/tokens';
import { FadeIn } from '../components/ui';
import { api } from '../services/api';
import { DEMO_PROFILE, getFarmProfile } from '../services/storage';

interface Msg {
  id: string;
  from: 'user' | 'ai';
  text: string;
}

export default function AssistantScreen({ navigation, route }: { navigation: any; route: any }) {
  const { theme } = useTheme();
  const { t, locale } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const listRef = useRef<FlatList>(null);
  const seeded = useRef(false);

  // Deep-link from Home's ASK AGRISAARTHI bar.
  useEffect(() => {
    const q = route?.params?.q;
    if (q && !seeded.current) {
      seeded.current = true;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.q]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, from: 'user', text };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setBusy(true);
    try {
      const profile = (await getFarmProfile()) ?? DEMO_PROFILE;
      const r = await api.askAssistant(text, locale, profile);
      setMsgs((m) => [...m, { id: `a-${Date.now()}`, from: 'ai', text: r.answer }]);
    } catch {
      // Demo fallback: farm-aware, clearly scoped — never pretends to be the LLM.
      const profile = (await getFarmProfile()) ?? DEMO_PROFILE;
      setMsgs((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          from: 'ai',
          text: t('assistant.demo_reply', {
            crop: profile.crop,
            stage: profile.cropStage,
            location: profile.location,
          }),
        },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMsg = ({ item }: { item: Msg }) => {
    const mine = item.from === 'user';
    return (
      <FadeIn>
        <View
          style={[
            styles.bubble,
            {
              alignSelf: mine ? 'flex-end' : 'flex-start',
              backgroundColor: mine ? theme.primary : theme.surface,
              borderColor: theme.border,
              borderWidth: mine ? 0 : 1,
            },
          ]}>
          <Text style={[type.body, { color: mine ? theme.primaryText : theme.text }]}>{item.text}</Text>
        </View>
      </FadeIn>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}>
        <Text style={[type.h1, { color: theme.text, padding: spacing.lg, paddingBottom: spacing.sm }]}>
          {t('assistant.title')}
        </Text>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          renderItem={renderMsg}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="chat-question-outline" size={48} color={theme.textMuted} />
              <Text style={[type.body, { color: theme.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
                {t('assistant.placeholder')}
              </Text>
            </View>
          }
        />
        <View style={[styles.bar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('assistant.attach_image')}
            onPress={() => navigation.navigate('Scan')}
            style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt }]}>
            <MaterialCommunityIcons name="image-plus" size={22} color={theme.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('a11y.mic_button')}
            onPress={() => {
              setListening(true);
              setTimeout(() => setListening(false), 1500); // voice input wiring point
            }}
            style={[styles.iconBtn, { backgroundColor: listening ? theme.primary : theme.surfaceAlt }]}>
            <MaterialCommunityIcons
              name={listening ? 'microphone' : 'microphone-outline'}
              size={22}
              color={listening ? theme.primaryText : theme.primary}
            />
          </Pressable>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('assistant.placeholder')}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, type.body, { color: theme.text, backgroundColor: theme.surfaceAlt }]}
            accessibilityLabel={t('assistant.placeholder')}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            editable={!busy}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('a11y.send_button')}
            onPress={() => send(input)}
            disabled={busy}
            style={[styles.iconBtn, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}>
            <MaterialCommunityIcons name="send" size={20} color={theme.primaryText} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, padding: spacing.md },
  empty: { alignItems: 'center', marginTop: spacing.xxl * 2, paddingHorizontal: spacing.xxl },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  input: { flex: 1, minHeight: MIN_TOUCH, borderRadius: radius.full, paddingHorizontal: spacing.lg },
  iconBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
