import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
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
import {
  colors,
  ScreenTitle,
  shared,
  Toggle,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { useAppPreferences } from '../components/AppPreferencesContext';
import { quranLanguageOptions } from '../data/quran';
import { calculationMethodOptions } from '../services/prayerTimes';
import { requestNotificationPermission } from '../services/prayerNotifications';
import LocationPickerModal from '../components/LocationPickerModal';

type SettingKey = 'location' | 'method' | 'translation';

export default function SettingsScreen() {
  const { isDark, setDarkMode, palette } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences, updatePreferences, deviceLocation, locationLoading } =
    useAppPreferences();
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const locationLabel =
    preferences.locationMode === 'custom' && preferences.customLocation
      ? preferences.customLocation.label
      : locationLoading
      ? 'Finding your location…'
      : `${deviceLocation?.label ?? 'Current location'} · GPS`;
  const activeLanguage =
    quranLanguageOptions.find(
      option => option.code === preferences.quranLanguage,
    ) ?? quranLanguageOptions[0];
  const setNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updatePreferences({ prayerNotifications: false });
      return;
    }
    if (await requestNotificationPermission()) {
      updatePreferences({ prayerNotifications: true });
      return;
    }
    Alert.alert(
      'Notifications are off',
      'Allow notifications for Sakinah in the Settings app to be reminded at each prayer time.',
    );
  };
  const activeMethod =
    calculationMethodOptions.find(
      option => option.key === preferences.calculationMethod,
    ) ?? calculationMethodOptions[0];
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
    key === 'location'
      ? setLocationPickerOpen(true)
      : key === 'translation'
      ? Alert.alert('Quran translation', undefined, [
          ...quranLanguageOptions.map(option => ({
            text: `${preferences.quranLanguage === option.code ? '✓ ' : ''}${
              option.label
            } · ${option.translator}`,
            onPress: () => updatePreferences({ quranLanguage: option.code }),
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ])
      : Alert.alert('Prayer calculation', undefined, [
          ...calculationMethodOptions.map(option => ({
            text: `${preferences.calculationMethod === option.key ? '✓ ' : ''}${
              option.label
            }`,
            onPress: () => updatePreferences({ calculationMethod: option.key }),
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ]);

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView contentContainerStyle={shared.content}>
        <ScreenTitle title="Settings" subtitle="Make the experience yours" />
        <Text style={[styles.section, theme.mutedText]}>PREFERENCES</Text>
        <View style={[styles.group, theme.card]}>
          {rows.map(({ Icon, key, title }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Change ${title}`}
              onPress={() => choose(key)}
              key={key}
              style={[styles.row, theme.border]}
            >
              <View style={[styles.icon, { backgroundColor: palette.mint }]}>
                <Icon size={19} color={palette.green} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.title, theme.text]}>{title}</Text>
                <Text style={[styles.value, theme.mutedText]}>
                  {key === 'translation'
                    ? `${activeLanguage.label} · ${activeLanguage.translator}`
                    : key === 'location'
                    ? locationLabel
                    : activeMethod.label}
                </Text>
              </View>
              <ChevronRight size={18} color={palette.muted} />
            </Pressable>
          ))}
        </View>
        <Text style={[styles.section, theme.mutedText]}>APP</Text>
        <View style={[styles.group, theme.card]}>
          <View style={[styles.row, theme.border]}>
            <View style={[styles.icon, { backgroundColor: palette.mint }]}>
              <Bell size={19} color={palette.green} />
            </View>
            <Text style={[styles.title, styles.copy, theme.text]}>
              Prayer notifications
            </Text>
            <Toggle
              accessibilityLabel="Prayer notifications"
              value={preferences.prayerNotifications}
              onValueChange={setNotifications}
            />
          </View>
          <View style={[styles.row, theme.border]}>
            <View style={[styles.icon, { backgroundColor: palette.mint }]}>
              <Moon size={19} color={palette.green} />
            </View>
            <Text style={[styles.title, styles.copy, theme.text]}>
              Dark appearance
            </Text>
            <Toggle
              accessibilityLabel="Dark appearance"
              value={isDark}
              onValueChange={setDarkMode}
            />
          </View>
        </View>
        <Text style={[styles.footer, theme.mutedText]}>
          Sakinah · Version 1.0
        </Text>
      </ScrollView>
      <LocationPickerModal
        visible={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
      />
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
