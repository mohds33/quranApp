import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
  geocodeCanadianPostalCode,
  Mosque,
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
  const [postalCode, setPostalCode] = useState('');
  const [postalError, setPostalError] = useState('');
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Finding your location…');
  const [precise, setPrecise] = useState(false);

  const loadForOrigin = useCallback(
    async (origin: Coordinates, successMessage: string) => {
      let liveMosques: Mosque[] = [];
      let searchFailed = false;
      try {
        liveMosques = await fetchNearbyMosques(origin);
      } catch {
        searchFailed = true;
      }
      const fallback =
        !liveMosques.length && distanceKm(origin, CALGARY_CENTRE) < 100
          ? fallbackNearbyMosques(origin)
          : [];
      const nextMosques = liveMosques.length ? liveMosques : fallback;
      setMosques(nextMosques);

      if (liveMosques.length) setMessage(successMessage);
      else if (fallback.length) setMessage('Using saved Calgary mosque data');
      else if (searchFailed)
        setMessage('Mosque search is unavailable. Check your connection.');
      else setMessage('No mapped mosques found within 30 km of this area.');
      setLoading(false);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setPostalError('');
    setMessage('Finding your location…');
    try {
      const origin = await currentLocation();
      setPrecise(true);
      await loadForOrigin(
        origin,
        'Using your current location · nearest mosque first',
      );
    } catch {
      setPrecise(false);
      await loadForOrigin(
        CALGARY_CENTRE,
        'Location unavailable · showing Calgary. Try your postal code.',
      );
    }
  }, [loadForOrigin]);

  const changePostalCode = (value: string) => {
    const normalized = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    setPostalCode(
      normalized.length > 3
        ? `${normalized.slice(0, 3)} ${normalized.slice(3)}`
        : normalized,
    );
    if (postalError) setPostalError('');
  };

  const searchByPostalCode = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setPostalError('');
    setPrecise(false);
    setMessage('Finding your postal-code area…');
    try {
      const area = await geocodeCanadianPostalCode(postalCode);
      setPostalCode(area.postalArea);
      await loadForOrigin(
        area.coordinates,
        `${area.postalArea} · ${area.city}${
          area.province ? `, ${area.province}` : ''
        } · nearest first`,
      );
    } catch (error) {
      setPostalError(
        error instanceof Error
          ? error.message
          : 'Could not find that postal code.',
      );
      setMessage('Enter a Canadian postal code to search without GPS.');
      setLoading(false);
    }
  };

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
    navigation.navigate('MosqueDetail', { mosque });

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
        <View style={[styles.postalCard, theme.card]}>
          <Text style={[styles.postalTitle, theme.text]}>
            Search by postal code
          </Text>
          <Text style={[styles.postalHint, theme.mutedText]}>
            Works without location access. A full code or the first 3 characters
            is enough.
          </Text>
          <View style={[styles.postalInputRow, theme.border]}>
            <MapPin size={18} color={palette.green} />
            <TextInput
              accessibilityLabel="Canadian postal code"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              onChangeText={changePostalCode}
              onSubmitEditing={searchByPostalCode}
              placeholder="T2P 1J9"
              placeholderTextColor={palette.muted}
              returnKeyType="search"
              style={[styles.postalInput, theme.text]}
              value={postalCode}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search mosques by postal code"
              disabled={loading}
              onPress={searchByPostalCode}
              style={({ pressed }) => [
                styles.postalButton,
                (pressed || loading) && styles.pressed,
              ]}
            >
              <Search size={16} color={colors.white} />
              <Text style={styles.postalButtonText}>Search</Text>
            </Pressable>
          </View>
          {postalError ? (
            <Text style={styles.postalError}>{postalError}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
            disabled={loading}
            onPress={load}
            style={styles.useLocation}
          >
            <LocateFixed size={15} color={palette.green} />
            <Text style={[styles.useLocationText, { color: palette.green }]}>
              Use my current location
            </Text>
          </Pressable>
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
                placeholder="Filter mosque names"
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
          Mosque data © OpenStreetMap contributors · Postal areas by
          Zippopotam.us · Prayer times calculated by AlAdhan
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
  postalCard: { ...shared.card, padding: 16, marginBottom: 14 },
  postalTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  postalHint: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  postalInputRow: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    marginTop: 12,
  },
  postalInput: { color: colors.ink, flex: 1, height: 48, paddingHorizontal: 9 },
  postalButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.green,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 13,
    margin: 3,
  },
  postalButtonText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  postalError: { color: '#C65353', fontSize: 10, marginTop: 8 },
  useLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 11,
  },
  useLocationText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.65 },
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
