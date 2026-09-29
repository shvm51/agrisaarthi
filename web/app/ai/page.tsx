"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  SegmentedControl,
  Skeleton,
  TextInput,
  useT,
} from "@/components/ui";
import type { Lang } from "@/lib/i18n";
import { LANG_OPTIONS, useLang } from "@/lib/i18n";
import { postAssistant } from "@/lib/api";
import { useSession } from "@/lib/session";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

/** Minimal structural type for the browser SpeechRecognition API. */
interface VoiceRecognizer {
  lang: string;
  interimResults: boolean;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const CHAT_KEY = "agrisaarthi.chat";
const MAX_MESSAGES = 30;

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadChat(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (raw) {
      const arr: unknown = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .filter(
            (m): m is ChatMessage =>
              !!m &&
              typeof (m as ChatMessage).text === "string" &&
              ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant"),
          )
          .slice(-MAX_MESSAGES);
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function AiLoading() {
  const t = useT();
  return (
    <div className="px-4 pt-4">
      <PageHeader title={t("ai.title")} />
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-4/5" />
      </div>
    </div>
  );
}

export default function AiPage() {
  return (
    <Suspense fallback={<AiLoading />}>
      <AiChat />
    </Suspense>
  );
}

function AiChat() {
  const t = useT();
  const { lang: appLang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { farm } = useSession();

  const [lang, setLang] = useState<Lang>(appLang);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recogRef = useRef<VoiceRecognizer | null>(null);
  const busyRef = useRef(false);
  const qSentRef = useRef(false);
  const noteTimerRef = useRef<number | null>(null);

  /* hydrate persisted chat (client only — never during SSR) */
  useEffect(() => {
    setMessages(loadChat());
    setHydrated(true);
  }, []);

  /* persist last 30 messages */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
    } catch {
      /* ignore */
    }
  }, [messages, hydrated]);

  /* auto-scroll to newest message */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  /* stop recognition + timers on unmount */
  useEffect(() => {
    return () => {
      try {
        recogRef.current?.stop();
      } catch {
        /* ignore */
      }
      if (noteTimerRef.current !== null) window.clearTimeout(noteTimerRef.current);
    };
  }, []);

  async function sendMessage(text: string) {
    const query = text.trim();
    if (!query || busyRef.current) return;
    busyRef.current = true;
    setSending(true);
    setMessages((m) => [...m, { id: uid(), role: "user", text: query }]);
    setInput("");
    try {
      const res = await postAssistant({ query, language: lang, farm });
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", text: res.answer, sources: res.sources },
      ]);
    } catch {
      setMessages((m) => [...m, { id: uid(), role: "assistant", text: t("common.tryAgain") }]);
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  }

  /* prefill: ?q= becomes the first message automatically */
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !qSentRef.current) {
      qSentRef.current = true;
      void sendMessage(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function stopVoice() {
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    recogRef.current = null;
    setListening(false);
  }

  function newChat() {
    stopVoice();
    setMessages([]);
    setInput("");
  }

  function startVoice() {
    if (listening) {
      stopVoice();
      return;
    }
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => VoiceRecognizer;
      SpeechRecognition?: new () => VoiceRecognizer;
    };
    const Ctor = w.webkitSpeechRecognition ?? w.SpeechRecognition;
    if (!Ctor) {
      setVoiceNote(true);
      if (noteTimerRef.current !== null) window.clearTimeout(noteTimerRef.current);
      noteTimerRef.current = window.setTimeout(() => setVoiceNote(false), 5000);
      return;
    }
    setVoiceNote(false);
    const rec = new Ctor();
    rec.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e?.results?.[0]?.[0]?.transcript as string | undefined;
      if (transcript) setInput(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      recogRef.current = null;
    };
    recogRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      recogRef.current = null;
    }
  }

  function renderMessage(m: ChatMessage) {
    if (m.role === "user") {
      return (
        <div key={m.id} className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-pine-900 text-cream-50 dark:bg-pine-700 px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
            {m.text}
          </div>
        </div>
      );
    }
    return (
      <div key={m.id} className="flex justify-start">
        <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-cream-100 border border-cream-200 dark:bg-night-800 dark:border-night-700 px-4 py-3">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.text}</p>
          {m.sources && m.sources.length > 0 ? (
            <div className="mt-2.5">
              <div className="mb-1.5 text-xs font-bold text-ink-500 dark:text-night-400">
                {t("ai.sources")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.sources.map((s, i) => (
                  <Chip key={i}>{s}</Chip>
                ))}
              </div>
            </div>
          ) : null}
          <p className="mt-2.5 text-xs text-ink-500 dark:text-night-400">{t("ai.disclaimer")}</p>
        </div>
      </div>
    );
  }

  const thinkingBubble = (
    <div className="flex justify-start" aria-live="polite">
      <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md bg-cream-100 border border-cream-200 dark:bg-night-800 dark:border-night-700 px-4 py-3">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-pine-700 dark:bg-pine-200 animate-pulse"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </span>
        <span className="text-sm text-ink-500 dark:text-night-400">{t("ai.thinking")}</span>
      </div>
    </div>
  );

  return (
    <div className="px-4 pt-4 flex flex-col min-h-[calc(100dvh-7rem)] animate-rise">
      <PageHeader
        title={t("ai.title")}
        right={
          <Button variant="ghost" size="sm" onClick={newChat}>
            <Icon name="refresh" size={18} />
            {t("ai.newChat")}
          </Button>
        }
      />

      <div className="mb-3 flex justify-center">
        <SegmentedControl<Lang>
          ariaLabel={t("settings.language")}
          value={lang}
          onChange={setLang}
          options={LANG_OPTIONS.map((o) => ({ value: o.code, label: o.label }))}
        />
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto pb-3">
        {messages.length === 0 && !sending ? (
          <EmptyState icon="ai" title={t("ai.empty")} body={t("ai.emptyBody")} />
        ) : (
          <div className="space-y-3 pb-1">
            {messages.map(renderMessage)}
            {sending ? thinkingBubble : null}
          </div>
        )}
      </div>

      <div className="sticky bottom-24 -mx-4 px-4 pt-2 pb-3 bg-cream-50/95 dark:bg-night-900/95 backdrop-blur border-t border-cream-200 dark:border-night-700">
        {voiceNote ? (
          <p role="status" className="mb-2 text-center text-xs text-ink-500 dark:text-night-400">
            {t("ai.voiceUnsupported")}
          </p>
        ) : null}
        {listening ? (
          <p role="status" className="mb-2 text-center text-xs font-bold text-pine-800 dark:text-pine-200">
            {t("ai.listening")}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <TextInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendMessage(input);
              }}
              placeholder={t("ai.placeholder")}
              aria-label={t("ai.placeholder")}
              enterKeyHint="send"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={startVoice}
            className={listening ? "border-danger-500 text-danger-600 dark:text-red-300" : ""}
          >
            <Icon name="mic" size={18} />
            <span className="sr-only">{t("ai.voice")}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/scan")}>
            <Icon name="camera" size={18} />
            <span className="sr-only">{t("ai.camera")}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || sending}
          >
            <Icon name="send" size={18} />
            <span className="sr-only">{t("common.submit")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
