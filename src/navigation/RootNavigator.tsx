import React from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import MainTabs from './MainTabs';
import { useAppTheme } from '../components/DesignSystem';

export default function RootNavigator() {
  const { isDark, palette } = useAppTheme();
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: palette.cream,
      card: palette.white,
      text: palette.ink,
      border: palette.line,
      primary: palette.green,
    },
  };
  return (
    <NavigationContainer theme={navigationTheme}>
      <MainTabs />
    </NavigationContainer>
  );
}
