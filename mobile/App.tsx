import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/theme/ThemeContext';
import { I18nProvider } from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </ThemeProvider>
    </I18nProvider>
  );
}
