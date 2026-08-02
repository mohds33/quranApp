import React, { createContext, useContext, useMemo, useState } from 'react';
import { Appearance, StyleSheet, Text, View } from 'react-native';

export const lightColors = {
  ink: '#17332E',
  green: '#1F5C4F',
  mint: '#DDEBE4',
  cream: '#F7F4EC',
  white: '#FFFFFF',
  gold: '#C69B51',
  muted: '#788580',
  line: '#E7E5DC',
};

export const darkColors = {
  ink: '#F3F6F4',
  green: '#65A794',
  mint: '#29463E',
  cream: '#101815',
  white: '#19241F',
  gold: '#D8AE65',
  muted: '#97A59F',
  line: '#2C3B35',
};

export const colors = lightColors;
export type AppPalette = typeof lightColors;

type ThemeContextValue = {
  isDark: boolean;
  palette: AppPalette;
  setDarkMode: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  palette: lightColors,
  setDarkMode: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setDarkMode] = useState(
    Appearance.getColorScheme() === 'dark',
  );
  const value = useMemo(
    () => ({ isDark, setDarkMode, palette: isDark ? darkColors : lightColors }),
    [isDark],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export function useThemeStyles() {
  const { palette } = useAppTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: palette.cream },
        card: { backgroundColor: palette.white, borderColor: palette.line },
        text: { color: palette.ink },
        mutedText: { color: palette.muted },
        border: { borderColor: palette.line },
      }),
    [palette],
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  const { palette } = useAppTheme();
  return (
    <Text style={[styles.eyebrow, { color: palette.gold }]}>{children}</Text>
  );
}

export function ScreenTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.heading}>
      <Text style={[styles.title, { color: palette.ink }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: palette.muted }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export const shared = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 130 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
});

const styles = StyleSheet.create({
  heading: { marginBottom: 24 },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 5 },
});
