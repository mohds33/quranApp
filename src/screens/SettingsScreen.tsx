import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
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

type SettingKey = 'location' | 'method' | 'translation';
const options: Record<SettingKey, { title: string; values: string[] }> = {
  location: {
    title: 'Choose location',
    values: ['Calgary, Alberta', 'Edmonton, Alberta', 'Toronto, Ontario'],
  },
  method: {
    title: 'Prayer calculation',
    values: ['ISNA', 'Muslim World League', 'Umm al-Qura'],
  },
  translation: {
    title: 'Quran translation',
    values: ['The Clear Quran', 'Sahih International', 'Pickthall'],
  },
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    location: 'Calgary, Alberta',
    method: 'ISNA',
    translation: 'The Clear Quran',
  });
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const rows = [
    { Icon: MapPin, key: 'location' as const, title: 'Location' },
    {
      Icon: SlidersHorizontal,
      key: 'method' as const,
      title: 'Prayer calculation',
    },
    { Icon: Globe2, key: 'translation' as const, title: 'Quran translation' },
  ];
  const choose = (key: SettingKey) =>
    Alert.alert(options[key].title, undefined, [
      ...options[key].values.map(value => ({
        text: `${settings[key] === value ? '✓ ' : ''}${value}`,
        onPress: () => setSettings(current => ({ ...current, [key]: value })),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  return (
    <SafeAreaView
      style={[shared.screen, darkMode && styles.darkScreen]}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={shared.content}>
        <ScreenTitle title="Settings" subtitle="Make the experience yours" />
        <Text style={styles.section}>PREFERENCES</Text>
        <View style={[styles.group, darkMode && styles.darkGroup]}>
          {rows.map(({ Icon, key, title }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Change ${title}`}
              onPress={() => choose(key)}
              key={key}
              style={styles.row}
            >
              <View style={styles.icon}>
                <Icon size={19} color={colors.green} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.title, darkMode && styles.darkText]}>
                  {title}
                </Text>
                <Text style={styles.value}>{settings[key]}</Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>APP</Text>
        <View style={[styles.group, darkMode && styles.darkGroup]}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Bell size={19} color={colors.green} />
            </View>
            <Text
              style={[styles.title, styles.copy, darkMode && styles.darkText]}
            >
              Prayer notifications
            </Text>
            <Switch
              accessibilityLabel="Prayer notifications"
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: colors.green, false: colors.line }}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Moon size={19} color={colors.green} />
            </View>
            <Text
              style={[styles.title, styles.copy, darkMode && styles.darkText]}
            >
              Dark appearance
            </Text>
            <Switch
              accessibilityLabel="Dark appearance"
              value={darkMode}
              onValueChange={setDarkMode}
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
  darkScreen: { backgroundColor: '#12201D' },
  darkGroup: { backgroundColor: '#1B2E29', borderColor: '#2A403A' },
  darkText: { color: '#F4F3EC' },
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
