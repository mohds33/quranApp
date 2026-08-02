import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
} from 'lucide-react-native';
import {
  colors,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { fetchPrayerTimings, PrayerTimings } from '../services/mosques';

const prayerNames: Array<keyof PrayerTimings> = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

export default function MosqueDetailScreen({ navigation, route }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { mosque } = route.params;
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [loadingTimings, setLoadingTimings] = useState(true);
  useEffect(() => {
    let active = true;
    setLoadingTimings(true);
    fetchPrayerTimings({
      latitude: mosque.latitude,
      longitude: mosque.longitude,
    })
      .then(value => {
        if (active) setTimings(value);
      })
      .catch(() => {
        if (active) setTimings(null);
      })
      .finally(() => {
        if (active) setLoadingTimings(false);
      });
    return () => {
      active = false;
    };
  }, [mosque.latitude, mosque.longitude]);
  const directions = () =>
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`,
    );
  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to nearby mosques"
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
        <View style={styles.hero}>
          <View style={styles.heroPin}>
            <MapPin size={25} color={colors.white} />
          </View>
          <Text style={styles.name}>{mosque.name}</Text>
          <Text style={styles.address}>{mosque.address}</Text>
          <Text style={styles.distance}>
            {mosque.distanceKm.toFixed(1)} km away
          </Text>
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Get directions to ${mosque.name}`}
          onPress={directions}
          style={styles.directions}
        >
          <Navigation size={18} color={colors.white} />
          <Text style={styles.directionsText}>Get directions</Text>
        </Pressable>
        {mosque.website ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open ${mosque.name} website`}
            onPress={() => Linking.openURL(mosque.website)}
            style={[styles.website, theme.card]}
          >
            <ExternalLink size={17} color={palette.green} />
            <Text style={[styles.websiteText, theme.text]}>
              Visit mosque website
            </Text>
          </Pressable>
        ) : null}
        <View style={styles.sectionHeader}>
          <Clock3 size={18} color={palette.gold} />
          <View>
            <Text style={[styles.sectionTitle, theme.text]}>
              Today’s prayer times
            </Text>
            <Text style={[styles.sectionSubtitle, theme.mutedText]}>
              Calculated for this area · ISNA method
            </Text>
          </View>
        </View>
        <View style={[styles.times, theme.card]}>
          {loadingTimings ? (
            <ActivityIndicator
              accessibilityLabel="Loading prayer times"
              color={palette.green}
              style={styles.timesLoading}
            />
          ) : timings ? (
            prayerNames.map(name => (
              <View key={name} style={[styles.timeRow, theme.border]}>
                <Text style={[styles.prayerName, theme.text]}>{name}</Text>
                <Text style={[styles.prayerTime, theme.text]}>
                  {timings[name]}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.unavailable, theme.mutedText]}>
              Prayer times are unavailable right now.
            </Text>
          )}
        </View>
        <View style={[styles.notice, { backgroundColor: palette.mint }]}>
          <Text style={[styles.noticeTitle, { color: palette.green }]}>
            Before you go
          </Text>
          <Text style={[styles.noticeText, theme.text]}>
            These are calculated salah times, not this mosque’s official iqamah
            schedule. Check the mosque website or contact them to confirm
            congregation times.
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
  name: {
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
  directions: {
    backgroundColor: colors.green,
    borderRadius: 18,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  directionsText: { color: colors.white, fontWeight: '800' },
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
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  times: { ...shared.card, overflow: 'hidden' },
  timeRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  prayerName: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  prayerTime: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  unavailable: { padding: 24, textAlign: 'center' },
  timesLoading: { marginVertical: 26 },
  notice: {
    backgroundColor: colors.mint,
    borderRadius: 18,
    padding: 17,
    marginTop: 14,
  },
  noticeTitle: { color: colors.green, fontSize: 11, fontWeight: '800' },
  noticeText: { color: colors.ink, fontSize: 11, lineHeight: 17, marginTop: 6 },
});
