import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  Globe2,
  MapPin,
  Moon,
  SlidersHorizontal,
} from 'lucide-react-native';
import { colors, ScreenTitle, shared } from '../components/DesignSystem';

const rows = [
  [MapPin, 'Location', 'Calgary, Alberta'],
  [SlidersHorizontal, 'Prayer calculation', 'ISNA'],
  [Globe2, 'Quran translation', 'The Clear Quran'],
] as const;
export default function SettingsScreen() {
  return (
    <SafeAreaView style={shared.screen} edges={['top']}>
      <ScrollView contentContainerStyle={shared.content}>
        <ScreenTitle title="Settings" subtitle="Make the experience yours" />
        <Text style={styles.section}>PREFERENCES</Text>
        <View style={styles.group}>
          {rows.map(([Icon, title, value]) => (
            <View key={title} style={styles.row}>
              <View style={styles.icon}>
                <Icon size={19} color={colors.green} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </View>
          ))}
        </View>
        <Text style={styles.section}>APP</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Bell size={19} color={colors.green} />
            </View>
            <Text style={[styles.title, styles.copy]}>
              Prayer notifications
            </Text>
            <Switch
              value
              trackColor={{ true: colors.green, false: colors.line }}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Moon size={19} color={colors.green} />
            </View>
            <Text style={[styles.title, styles.copy]}>Dark appearance</Text>
            <Switch
              value={false}
              trackColor={{ true: colors.green, false: colors.line }}
            />
          </View>
        </View>
        <Text style={styles.footer}>Sakinah · Version 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  section: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
  },
  group: { ...shared.card, overflow: 'hidden', marginBottom: 24 },
  row: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  value: { color: colors.muted, fontSize: 11, marginTop: 4 },
  footer: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
});
