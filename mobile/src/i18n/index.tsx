import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import en from './en.json';
import hi from './hi.json';
import mr from './mr.json';

export type Locale = 'en' | 'hi' | 'mr';

const dictionaries: Record<Locale, Record<string, any>> = { en, hi, mr };

function lookup(dict: Record<string, any>, key: string): string | undefined {
  const parts = key.split('.');
  let node: any = dict;
  for (const p of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[p];
  }
  return typeof node === 'string' ? node : undefined;
}

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate a dotted key, falling back to English, then the key itself. */
  t: (key: string, params?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let s = lookup(dictionaries[locale], key) ?? lookup(dictionaries.en, key) ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          s = s.replace(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
