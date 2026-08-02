import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const colors = {
  ink: '#17332E',
  green: '#1F5C4F',
  mint: '#DDEBE4',
  cream: '#F7F4EC',
  white: '#FFFFFF',
  gold: '#C69B51',
  muted: '#788580',
  line: '#E7E5DC',
};

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function ScreenTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.heading}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
