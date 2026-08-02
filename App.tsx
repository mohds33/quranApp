import React from 'react';
import { StatusBar } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useAppTheme } from './src/components/DesignSystem';
import { SelectedMosqueProvider } from './src/components/SelectedMosqueContext';
import { AppPreferencesProvider } from './src/components/AppPreferencesContext';

function ThemedApp() {
  const { isDark } = useAppTheme();
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppPreferencesProvider>
        <SelectedMosqueProvider>
          <ThemedApp />
        </SelectedMosqueProvider>
      </AppPreferencesProvider>
    </ThemeProvider>
  );
}
