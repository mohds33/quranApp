import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import {
  ChevronRight,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  X,
} from 'lucide-react-native';
import {
  colors,
  ScreenTitle,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import {
  CALGARY_CENTRE,
  Coordinates,
  distanceKm,
  fallbackNearbyMosques,
  fetchNearbyMosques,
  fetchPrayerTimings,
  Mosque,
  PrayerTimings,
} from '../services/mosques';

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

async function currentLocation(): Promise<Coordinates> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Find nearby mosques',
        message:
          'Sakinah uses your location only to find and sort nearby mosques.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED)
      throw new Error('Location permission was not granted.');
  }
  return new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    ),
  );
}

export default function MosqueFinderScreen({ navigation }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const [query, setQuery] = useState('');
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Finding your location…');
  const [precise, setPrecise] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('Finding your location…');
    let origin = CALGARY_CENTRE;
    let hasLocation = false;
    try {
      origin = await currentLocation();
      hasLocation = true;
      setPrecise(true);
    } catch {
      setPrecise(false);
      setMessage('Location is off · showing Calgary');
    }
    try {
      const [nearby, prayerTimes] = await Promise.all([
        fetchNearbyMosques(origin),
        fetchPrayerTimings(origin),
      ]);
      setMosques(
        nearby.length
          ? nearby
          : distanceKm(origin, CALGARY_CENTRE) < 100
          ? fallbackNearbyMosques(origin)
          : [],
      );
      setTimings(prayerTimes);
      setMessage(
        hasLocation
          ? 'Mosques within 25 km · nearest first'
          : 'Calgary mosques · enable location for distances',
      );
    } catch {
      const fallback =
        distanceKm(origin, CALGARY_CENTRE) < 100
          ? fallbackNearbyMosques(origin)
          : [];
      setMosques(fallback);
      setMessage(
        fallback.length
          ? 'Using saved Calgary mosque data'
          : 'Could not load mosques. Check your connection and retry.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  const results = useMemo(
    () =>
      mosques.filter(
        mosque =>
          !query.trim() ||
          `${mosque.name} ${mosque.address}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [mosques, query],
  );
  const closest = results[0];
  const openMosque = (mosque: Mosque) =>
    navigation.navigate('MosqueDetail', { mosque, timings });

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ScreenTitle title="Mosques" subtitle="Find a masjid near you" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh nearby mosques"
            onPress={load}
            style={[styles.circleButton, theme.card]}
          >
            <RefreshCw size={19} color={palette.green} />
          </Pressable>
        </View>
        <View style={[styles.locationBar, theme.card]}>
          <LocateFixed
            size={17}
            color={precise ? palette.green : palette.gold}
          />
          <Text style={[styles.locationText, theme.mutedText]}>{message}</Text>
        </View>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.green} />
            <Text style={[styles.loadingText, theme.mutedText]}>
              Searching OpenStreetMap…
            </Text>
          </View>
        ) : (
          <>
            {closest ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open closest mosque ${closest.name}`}
                onPress={() => openMosque(closest)}
                style={styles.closest}
              >
                <View style={styles.closestIcon}>
                  <Navigation size={21} color={colors.white} />
                </View>
                <View style={styles.closestCopy}>
                  <Text style={styles.closestLabel}>CLOSEST TO YOU</Text>
                  <Text style={styles.closestName}>{closest.name}</Text>
                  <Text style={styles.closestAddress}>{closest.address}</Text>
                </View>
                <Text style={styles.distance}>
                  {closest.distanceKm.toFixed(1)} km
                </Text>
              </Pressable>
            ) : null}
            <View style={[styles.search, theme.card]}>
              <Search size={18} color={palette.muted} />
              <TextInput
                accessibilityLabel="Search nearby mosques"
                value={query}
                onChangeText={setQuery}
                placeholder="Search local mosques"
                placeholderTextColor={palette.muted}
                style={[styles.input, theme.text]}
              />
              {query ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear mosque search"
                  onPress={() => setQuery('')}
                >
                  <X size={18} color={palette.muted} />
                </Pressable>
              ) : null}
            </View>
            <Text style={[styles.section, theme.mutedText]}>
              {results.length} MOSQUES NEARBY
            </Text>
            <View style={[styles.list, theme.card]}>
              {results.map((mosque, index) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${mosque.name}`}
                  onPress={() => openMosque(mosque)}
                  key={mosque.id}
                  style={[styles.row, theme.border]}
                >
                  <View style={[styles.pin, { backgroundColor: palette.mint }]}>
                    <MapPin size={18} color={palette.green} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={[styles.name, theme.text]}>{mosque.name}</Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.address, theme.mutedText]}
                    >
                      {mosque.address}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text
                      style={[
                        styles.rowDistance,
                        index === 0 && { color: palette.gold },
                      ]}
                    >
                      {mosque.distanceKm.toFixed(1)} km
                    </Text>
                    <ChevronRight size={16} color={palette.muted} />
                  </View>
                </Pressable>
              ))}
            </View>
            {!results.length ? (
              <Text style={[styles.empty, theme.mutedText]}>
                No mosques match this search.
              </Text>
            ) : null}
          </>
        )}
        <Text style={[styles.attribution, theme.mutedText]}>
          Mosque data © OpenStreetMap contributors · Prayer times calculated by
          AlAdhan
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBar: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 14,
    marginBottom: 14,
  },
  locationText: { color: colors.muted, fontSize: 12, flex: 1 },
  loading: { alignItems: 'center', paddingVertical: 70, gap: 13 },
  loadingText: { color: colors.muted, fontSize: 12 },
  closest: {
    backgroundColor: colors.green,
    borderRadius: 25,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  closestIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#FFFFFF18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closestCopy: { flex: 1, marginLeft: 12 },
  closestLabel: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  closestName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
  },
  closestAddress: { color: '#C8DAD4', fontSize: 10, marginTop: 3 },
  distance: { color: colors.white, fontSize: 12, fontWeight: '800' },
  search: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 16,
  },
  input: { height: 50, color: colors.ink, flex: 1 },
  section: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  list: { ...shared.card, overflow: 'hidden' },
  row: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pin: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  name: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  address: { color: colors.muted, fontSize: 9, marginTop: 4 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowDistance: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  empty: { textAlign: 'center', padding: 30 },
  attribution: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    margin: 20,
  },
});
