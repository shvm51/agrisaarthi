import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, darkTheme, lightTheme } from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeCtx {
  theme: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: lightTheme,
  mode: 'system',
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const system = useColorScheme();
  const theme = useMemo(
    () => (mode === 'dark' || (mode === 'system' && system === 'dark') ? darkTheme : lightTheme),
    [mode, system],
  );
  const value = useMemo(() => ({ theme, mode, setMode }), [theme, mode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
