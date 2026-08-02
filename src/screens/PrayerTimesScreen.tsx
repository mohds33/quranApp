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
import { Bell, Check, MapPin } from 'lucide-react-native';
import {
  colors,
  ScreenTitle,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';

const prayers = [
  ['Fajr', '4:06 AM'],
  ['Sunrise', '5:48 AM'],
  ['Dhuhr', '1:38 PM'],
  ['Asr', '5:50 PM'],
  ['Maghrib', '9:18 PM'],
  ['Isha', '10:51 PM'],
];

export default function PrayerTimesScreen({ navigation }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const [reminders, setReminders] = useState<string[]>(['Fajr', 'Maghrib']);
  const toggleReminder = (name: string) =>
    setReminders(items =>
      items.includes(name)
        ? items.filter(item => item !== name)
        : [...items, name],
    );

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView contentContainerStyle={shared.content}>
        <ScreenTitle
          title="Prayer times"
          subtitle="Saturday, August 1 · 18 Muharram 1448"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change prayer location and calculation method"
          onPress={() => navigation.navigate('Settings')}
          style={[styles.location, theme.card]}
        >
          <MapPin size={16} color={palette.green} />
          <Text style={[styles.locationText, theme.text]}>
            Calgary, Alberta
          </Text>
          <Text style={styles.method}>ISNA</Text>
        </Pressable>
        <View style={[styles.list, theme.card]}>
          {prayers.map(([name, time], i) => {
            const active = name === 'Maghrib';
            return (
              <View
                key={name}
                style={[styles.row, theme.border, active && styles.active]}
              >
                <View style={[styles.dot, i < 4 && styles.dotDone]}>
                  {i < 4 ? <Check size={10} color={colors.white} /> : null}
                </View>
                <View style={styles.copy}>
                  <Text
                    style={[
                      styles.name,
                      !active && theme.text,
                      active && styles.activeText,
                    ]}
                  >
                    {name}
                  </Text>
                  {active ? (
                    <Text style={styles.next}>NEXT · IN 1 HR 24 MIN</Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.time,
                    !active && theme.text,
                    active && styles.activeText,
                  ]}
                >
                  {time}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${
                    reminders.includes(name) ? 'Disable' : 'Enable'
                  } ${name} reminder`}
                  hitSlop={10}
                  onPress={() => {
                    toggleReminder(name);
                    Alert.alert(
                      `${name} reminder`,
                      reminders.includes(name)
                        ? 'Reminder disabled.'
                        : 'Reminder enabled.',
                    );
                  }}
                >
                  <Bell
                    size={18}
                    color={
                      active
                        ? colors.white
                        : reminders.includes(name)
                        ? palette.gold
                        : palette.muted
                    }
                    fill={
                      reminders.includes(name)
                        ? active
                          ? colors.white
                          : palette.gold
                        : 'transparent'
                    }
                  />
                </Pressable>
              </View>
            );
          })}
        </View>
        <Text style={[styles.note, theme.mutedText]}>
          Times are calculated using your current location. You can change the
          calculation method in Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  location: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 18,
    gap: 8,
  },
  locationText: { color: colors.ink, fontWeight: '600', flex: 1 },
  method: { color: colors.gold, fontSize: 11, fontWeight: '800' },
  list: { ...shared.card, overflow: 'hidden' },
  row: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  active: { backgroundColor: colors.green },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  copy: { flex: 1 },
  name: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  activeText: { color: colors.white },
  next: {
    fontSize: 8,
    color: '#D8E7E1',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  time: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    margin: 22,
  },
});
