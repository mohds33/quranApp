import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react-native';
import {
  colors,
  ScreenTitle,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { useSelectedMosque } from '../components/SelectedMosqueContext';
import {
  fetchPublishedMosquePrayerSchedule,
  masjidAyeshaPrayerNames,
  PublishedMosquePrayerSchedule,
} from '../services/prayerTimes';

import { isNil } from 'lodash';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function PrayerTimesScreen({ navigation }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { selectedMosque } = useSelectedMosque();
  const [schedule, setSchedule] =
    useState<PublishedMosquePrayerSchedule | null>(null);
  const [reminders, setReminders] = useState<string[]>(['Fajr', 'Maghrib']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPrayerTimes = useCallback(async () => {
    if (!selectedMosque) {
      return setError('No mosque selected. Please select a mosque to view prayer times.');
    }
    setLoading(true);
    setError('');
    setSchedule(null);
    try {
      setSchedule(await fetchPublishedMosquePrayerSchedule(selectedMosque));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'No published schedule could be loaded for this masjid.',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMosque]);

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  const toggleReminder = (name: string) =>
    setReminders(items =>
      items.includes(name)
        ? items.filter(item => item !== name)
        : [...items, name],
    );

  const sourceUrl = schedule?.sourceUrl;
  const openSource = () => {
    if (sourceUrl) Linking.openURL(sourceUrl);
  };

  if (isNil(selectedMosque)) {
    return (<Text>No mosque selected.</Text>);
  }

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle
          title="Prayer times"
          subtitle={`${formatDate(new Date())} · selected masjid`}
        />

        <View style={[styles.sourceCard, theme.card]}>
          <View style={[styles.sourceIcon, { backgroundColor: palette.mint }]}>
            <MapPin size={20} color={palette.green} />
          </View>
          <View style={styles.sourceCopy}>
            <Text numberOfLines={1} style={[styles.sourceName, theme.text]}>
              {selectedMosque.name}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.sourceAddress, theme.mutedText]}
            >
              {selectedMosque.address}
            </Text>
          </View>
          {sourceUrl ? (
            <Pressable
              accessibilityLabel={`Open the published schedule source for ${selectedMosque.name}`}
              accessibilityRole="link"
              hitSlop={8}
              onPress={openSource}
            >
              <ExternalLink size={18} color={palette.green} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel={`Refresh ${selectedMosque.name} prayer schedule`}
            accessibilityRole="button"
            disabled={loading}
            hitSlop={8}
            onPress={loadPrayerTimes}
          >
            {loading ? (
              <ActivityIndicator color={palette.green} size="small" />
            ) : (
              <RefreshCw size={18} color={palette.green} />
            )}
          </Pressable>
        </View>

        <Pressable
          accessibilityLabel="Choose a different masjid"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Mosques')}
          style={[styles.chooseButton, { backgroundColor: palette.mint }]}
        >
          <Search size={16} color={palette.green} />
          <Text style={[styles.chooseText, { color: palette.green }]}>
            Choose another masjid
          </Text>
        </Pressable>

        {error ? (
          <View style={[styles.errorCard, { backgroundColor: palette.mint }]}>
            <Text style={[styles.errorTitle, theme.text]}>
              Published times unavailable
            </Text>
            <Text style={[styles.errorText, theme.mutedText]}>{error}</Text>
            <Text style={[styles.errorLink, { color: palette.green }]}>
              The map-listed website could not be verified.
            </Text>
          </View>
        ) : null}

        <View style={[styles.list, theme.card]}>
          <View style={[styles.tableHeader, theme.border]}>
            <Text style={[styles.headerPrayer, theme.mutedText]}>PRAYER</Text>
            <Text style={[styles.headerTime, theme.mutedText]}>ADHAN</Text>
            <Text style={[styles.headerTime, theme.mutedText]}>IQAMAH</Text>
            <View style={styles.bellSpacer} />
          </View>
          {loading ? (
            <ActivityIndicator
              accessibilityLabel="Checking the mosque website and schedule apps"
              color={palette.green}
              style={styles.loading}
            />
          ) : schedule ? (
            masjidAyeshaPrayerNames.map(name => (
              <View key={name} style={[styles.row, theme.border]}>
                <View style={styles.copy}>
                  <Text style={[styles.name, theme.text]}>{name}</Text>
                </View>
                <Text
                  style={[
                    styles.time,
                    schedule.adhan[name] ? theme.text : theme.mutedText,
                  ]}
                >
                  {schedule.adhan[name] ?? '—'}
                </Text>
                <Text
                  style={[
                    styles.time,
                    schedule.iqamah[name] ? theme.text : theme.mutedText,
                  ]}
                >
                  {schedule.iqamah[name] ?? '—'}
                </Text>
                <Pressable
                  accessibilityLabel={`${
                    reminders.includes(name) ? 'Disable' : 'Enable'
                  } ${name} reminder`}
                  accessibilityRole="button"
                  hitSlop={9}
                  onPress={() => {
                    const enabled = !reminders.includes(name);
                    toggleReminder(name);
                    Alert.alert(
                      `${name} reminder`,
                      enabled ? 'Reminder enabled.' : 'Reminder disabled.',
                    );
                  }}
                >
                  <Bell
                    size={17}
                    color={
                      reminders.includes(name) ? palette.gold : palette.muted
                    }
                    fill={
                      reminders.includes(name) ? palette.gold : 'transparent'
                    }
                  />
                </Pressable>
              </View>
            ))
          ) : (
            <Pressable onPress={loadPrayerTimes} style={styles.retry}>
              <Text style={[styles.retryText, { color: palette.green }]}>
                Check again
              </Text>
            </Pressable>
          )}
        </View>

        {schedule?.jummah.length ? (
          <View style={[styles.jummahCard, theme.card]}>
            <View>
              <Text style={[styles.jummahTitle, theme.text]}>Jumu’ah</Text>
              <Text style={[styles.jummahMeta, theme.mutedText]}>
                Published Friday congregation times
              </Text>
            </View>
            <View style={styles.jummahTimes}>
              {schedule.jummah.slice(0, 3).map((time, index) => (
                <View
                  key={`${time}-${index}`}
                  style={[styles.jummahPill, { backgroundColor: palette.mint }]}
                >
                  <Text style={[styles.jummahNumber, { color: palette.green }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.jummahTime, theme.text]}>{time}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {schedule ? (
          <Pressable
            accessibilityRole={sourceUrl ? 'link' : undefined}
            disabled={!sourceUrl}
            onPress={openSource}
          >
            <View style={styles.sourceNote}>
              {schedule.verified ? (
                <ShieldCheck size={13} color={palette.green} />
              ) : null}
              <Text style={[styles.note, theme.mutedText]}>
                {schedule.sourceLabel} · {schedule.sourceName} · refreshed{' '}
                {new Date(schedule.fetchedAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {schedule.maghribUsesPublishedOffset ? (
              <Text style={[styles.note, theme.mutedText]}>
                Maghrib uses this masjid’s published minutes-after-sunset
                setting.
              </Text>
            ) : null}
            {schedule.coverageNote ? (
              <Text style={[styles.coverageNote, theme.mutedText]}>
                {schedule.coverageNote}
              </Text>
            ) : null}
          </Pressable>
        ) : (
          <Text style={[styles.note, theme.mutedText]}>
            Generic iqamah times are not used here. Only schedules published by
            the selected masjid or a matched schedule app are shown.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sourceCard: {
    ...shared.card,
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 11,
    marginBottom: 10,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceCopy: { flex: 1 },
  sourceName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  sourceAddress: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  chooseButton: {
    minHeight: 44,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  chooseText: { color: colors.green, fontSize: 11, fontWeight: '800' },
  errorCard: { borderRadius: 18, padding: 16, marginBottom: 14 },
  errorTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  errorText: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  errorLink: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 10,
  },
  list: { ...shared.card, overflow: 'hidden' },
  tableHeader: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerPrayer: {
    color: colors.muted,
    flex: 1,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerTime: {
    color: colors.muted,
    width: 76,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  copy: { flex: 1 },
  name: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  time: {
    color: colors.ink,
    width: 76,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  bellSpacer: { width: 17 },
  loading: { marginVertical: 48 },
  retry: { padding: 30, alignItems: 'center' },
  retryText: { color: colors.green, fontWeight: '800' },
  jummahCard: {
    ...shared.card,
    padding: 17,
    marginTop: 14,
    gap: 15,
  },
  jummahTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  jummahMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  jummahTimes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  jummahPill: {
    minWidth: '45%',
    flexGrow: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jummahNumber: { fontSize: 10, fontWeight: '900' },
  jummahTime: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  sourceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginVertical: 20,
  },
  note: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginHorizontal: 16,
    marginVertical: 20,
  },
  coverageNote: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 20,
  },
});
