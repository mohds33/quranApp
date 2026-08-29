import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  Clock3,
  ExternalLink,
  Home,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';
import {
  colors,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { useSelectedMosque } from '../components/SelectedMosqueContext';
import {
  findOfficialMosqueWebsite,
  fetchPublishedMosquePrayerSchedule,
  masjidAyeshaPrayerNames,
  PublishedMosquePrayerSchedule,
} from '../services/prayerTimes';

export default function MosqueDetailScreen({ navigation, route }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { selectedMosque, selectMosque } = useSelectedMosque();
  const { mosque } = route.params;
  const isHomeMosque = selectedMosque?.id === mosque.id;
  const [schedule, setSchedule] =
    useState<PublishedMosquePrayerSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [discoveredWebsiteUrl, setDiscoveredWebsiteUrl] = useState('');

  const loadSchedule = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError('');
      setSchedule(null);
      try {
        setSchedule(
          await fetchPublishedMosquePrayerSchedule(mosque, { forceRefresh }),
        );
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'No published schedule could be loaded for this masjid.',
        );
      } finally {
        setLoading(false);
      }
    },
    [mosque],
  );

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    let active = true;
    setDiscoveredWebsiteUrl('');
    findOfficialMosqueWebsite(mosque)
      .then(website => {
        if (active) setDiscoveredWebsiteUrl(website);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [mosque]);

  const verifiedWebsiteUrl =
    schedule?.officialWebsiteUrl ?? discoveredWebsiteUrl;

  const directions = () =>
    Linking.openURL(
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${mosque.latitude},${mosque.longitude}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`,
    );

  const setHomeMasjid = () => {
    selectMosque(
      verifiedWebsiteUrl ? { ...mosque, website: verifiedWebsiteUrl } : mosque,
      schedule ?? undefined,
    );
  };

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable
            accessibilityLabel="Back to nearby mosques"
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={[styles.button, theme.card]}
          >
            <ArrowLeft size={20} color={palette.ink} />
          </Pressable>
          <Text style={[styles.heading, theme.text]}>Mosque details</Text>
          <View style={[styles.button, theme.card]}>
            <MapPin size={19} color={palette.green} />
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: palette.green }]}>
          <View style={styles.heroPin}>
            <MapPin size={25} color={colors.white} />
          </View>
          <Text style={styles.heroName}>{mosque.name}</Text>
          <Text style={styles.address}>{mosque.address}</Text>
          <Text style={[styles.distance, { color: palette.gold }]}>
            {mosque.distanceKm.toFixed(1)} km away
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={`Get directions to ${mosque.name}`}
            accessibilityRole="link"
            onPress={directions}
            style={[styles.action, { backgroundColor: palette.green }]}
          >
            <Navigation size={17} color={colors.white} />
            <Text style={styles.actionText}>Directions</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={
              isHomeMosque
                ? `${mosque.name} is already your home masjid`
                : `Set ${mosque.name} as your home masjid`
            }
            accessibilityRole="button"
            disabled={isHomeMosque}
            onPress={setHomeMasjid}
            style={[styles.action, styles.prayerAction, theme.card]}
          >
            {isHomeMosque ? (
              <Check size={17} color={palette.green} />
            ) : (
              <Home size={17} color={palette.green} />
            )}
            <Text style={[styles.prayerActionText, { color: palette.green }]}>
              {isHomeMosque ? 'Home masjid' : 'Set home'}
            </Text>
          </Pressable>
        </View>

        {verifiedWebsiteUrl ? (
          <Pressable
            accessibilityLabel={`Open ${mosque.name} website`}
            accessibilityRole="link"
            onPress={() => Linking.openURL(verifiedWebsiteUrl)}
            style={[styles.website, theme.card]}
          >
            <ExternalLink size={17} color={palette.green} />
            <Text style={[styles.websiteText, theme.text]}>
              Visit official website
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.sectionHeader}>
          <Clock3 size={18} color={palette.gold} />
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, theme.text]}>
              Published masjid schedule
            </Text>
            <Text style={[styles.sectionSubtitle, theme.mutedText]}>
              {schedule?.sourceLabel ?? 'Official website or schedule app'}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={`Refresh ${mosque.name} published prayer times`}
            accessibilityRole="button"
            disabled={loading}
            hitSlop={8}
            onPress={() => loadSchedule(true)}
          >
            {loading ? (
              <ActivityIndicator color={palette.green} size="small" />
            ) : (
              <RefreshCw size={17} color={palette.green} />
            )}
          </Pressable>
        </View>

        <View style={[styles.times, theme.card]}>
          <View style={[styles.tableHeader, theme.border]}>
            <Text style={[styles.headerPrayer, theme.mutedText]}>PRAYER</Text>
            <Text style={[styles.headerTime, theme.mutedText]}>ADHAN</Text>
            <Text style={[styles.headerTime, theme.mutedText]}>IQAMAH</Text>
          </View>
          {loading ? (
            <ActivityIndicator
              accessibilityLabel="Checking the mosque website and schedule apps"
              color={palette.green}
              style={styles.timesLoading}
            />
          ) : schedule ? (
            <>
              {masjidAyeshaPrayerNames.map(name => (
                <View key={name} style={[styles.timeRow, theme.border]}>
                  <Text style={[styles.prayerName, theme.text]}>{name}</Text>
                  <Text
                    style={[
                      styles.prayerTime,
                      schedule.adhan[name] ? theme.text : theme.mutedText,
                    ]}
                  >
                    {schedule.adhan[name] ?? '—'}
                  </Text>
                  <Text
                    style={[
                      styles.prayerTime,
                      schedule.iqamah[name] ? theme.text : theme.mutedText,
                    ]}
                  >
                    {schedule.iqamah[name] ?? '—'}
                  </Text>
                </View>
              ))}
              {schedule.jummah.slice(0, 3).map((time, index) => (
                <View
                  key={`${time}-${index}`}
                  style={[styles.timeRow, theme.border]}
                >
                  <Text style={[styles.prayerName, theme.text]}>
                    Jumu’ah {index + 1}
                  </Text>
                  <Text style={[styles.prayerTime, theme.mutedText]}>—</Text>
                  <Text style={[styles.prayerTime, theme.text]}>{time}</Text>
                </View>
              ))}
              <Pressable
                accessibilityRole="link"
                onPress={() => Linking.openURL(schedule.sourceUrl)}
                style={styles.scheduleSource}
              >
                {schedule.verified ? (
                  <ShieldCheck size={13} color={palette.green} />
                ) : null}
                <Text style={[styles.scheduleSourceText, theme.mutedText]}>
                  {schedule.sourceLabel} · {schedule.sourceName}
                </Text>
              </Pressable>
              {schedule.coverageNote ? (
                <Text style={[styles.scheduleCoverage, theme.mutedText]}>
                  {schedule.coverageNote}
                </Text>
              ) : null}
            </>
          ) : (
            <View style={styles.noSchedule}>
              <Text style={[styles.noScheduleTitle, theme.text]}>
                No published schedule found
              </Text>
              <Text style={[styles.noScheduleText, theme.mutedText]}>
                {error} The app will not replace it with a generic iqamah time.
              </Text>
              <Text style={[styles.websiteLink, { color: palette.green }]}>
                The map-listed website could not be verified.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.notice, { backgroundColor: palette.mint }]}>
          <Text style={[styles.noticeTitle, { color: palette.green }]}>
            Published sources only
          </Text>
          <Text style={[styles.noticeText, theme.text]}>
            Values come from this masjid’s website, an exact nearby schedule app
            match, or a clearly labelled verified city source when the masjid
            publishes no schedule. Missing values stay blank. When a masjid
            publishes Maghrib as minutes after sunset, that published offset is
            applied automatically.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: colors.green,
    borderRadius: 28,
    padding: 25,
    alignItems: 'center',
  },
  heroPin: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 15,
  },
  address: {
    color: '#C8DAD4',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 7,
  },
  distance: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 9,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  action: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  prayerAction: { ...shared.card },
  actionText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  prayerActionText: { color: colors.green, fontSize: 12, fontWeight: '800' },
  website: {
    ...shared.card,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  websiteText: { color: colors.ink, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 25,
    marginBottom: 11,
  },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  times: { ...shared.card, overflow: 'hidden' },
  tableHeader: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  headerPrayer: {
    flex: 1,
    color: colors.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  headerTime: {
    width: 82,
    color: colors.muted,
    textAlign: 'right',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  timeRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  prayerName: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '600' },
  prayerTime: {
    width: 82,
    color: colors.ink,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
  },
  timesLoading: { marginVertical: 32 },
  scheduleSource: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
  },
  scheduleSourceText: { color: colors.muted, fontSize: 9 },
  scheduleCoverage: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  noSchedule: { padding: 20 },
  noScheduleTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  noScheduleText: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 6,
  },
  websiteLink: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 12,
  },
  notice: { borderRadius: 20, padding: 17, marginTop: 18 },
  noticeTitle: { color: colors.green, fontSize: 11, fontWeight: '900' },
  noticeText: { color: colors.ink, fontSize: 10, lineHeight: 16, marginTop: 5 },
});
