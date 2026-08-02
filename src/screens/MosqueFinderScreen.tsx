import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker, Region } from 'react-native-maps';
import {
  ChevronRight,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  X,
} from 'lucide-react-native';
import {
  colors,
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

const INITIAL_REGION: Region = {
  ...CALGARY_CENTRE,
  latitudeDelta: 0.42,
  longitudeDelta: 0.42,
};

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
          'Sakinah uses your location only to show and sort nearby mosques.',
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

function normalizedPostalCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isCanadianPostalCode(value: string) {
  return /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ](?:\d[ABCEGHJKLMNPRSTVWXYZ]\d)?$/.test(
    normalizedPostalCode(value),
  );
}

export default function MosqueFinderScreen({ navigation }: any) {
  const { palette, isDark } = useAppTheme();
  const theme = useThemeStyles();
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);
  const [query, setQuery] = useState('');
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    'Tap the location icon to show where you are',
  );
  const [searchError, setSearchError] = useState('');
  const [showsUserLocation, setShowsUserLocation] = useState(false);
  const [mapMoved, setMapMoved] = useState(false);
  const [visibleRegion, setVisibleRegion] = useState<Region>(INITIAL_REGION);

  const focusMap = useCallback((origin: Coordinates, items: Mosque[]) => {
    if (!mapReadyRef.current) return;
    const coordinates = [
      origin,
      ...items.map(item => ({
        latitude: item.latitude,
        longitude: item.longitude,
      })),
    ];
    requestAnimationFrame(() => {
      if (coordinates.length > 1) {
        mapRef.current?.fitToCoordinates(coordinates, {
          animated: true,
          edgePadding: { top: 145, right: 45, bottom: 250, left: 45 },
        });
      } else {
        mapRef.current?.animateToRegion(
          { ...origin, latitudeDelta: 0.18, longitudeDelta: 0.18 },
          450,
        );
      }
    });
  }, []);

  const loadForOrigin = useCallback(
    async (
      origin: Coordinates,
      successMessage: string,
      radiusMeters = 30000,
    ) => {
      setLoading(true);
      setSearchError('');
      setMapMoved(false);
      let liveMosques: Mosque[] = [];
      let searchFailed = false;
      try {
        liveMosques = await fetchNearbyMosques(origin, radiusMeters);
      } catch {
        searchFailed = true;
      }
      const fallback =
        !liveMosques.length && distanceKm(origin, CALGARY_CENTRE) < 100
          ? fallbackNearbyMosques(origin)
          : [];
      const nextMosques = liveMosques.length ? liveMosques : fallback;
      setMosques(nextMosques);
      setSelectedMosque(nextMosques[0] ?? null);

      if (liveMosques.length) setMessage(successMessage);
      else if (fallback.length)
        setMessage('Showing saved Calgary mosques · tap location to recenter');
      else if (searchFailed)
        setMessage('Mosque search is unavailable. Check your connection.');
      else setMessage('No mapped mosques found in this area.');
      setLoading(false);
      focusMap(origin, nextMosques);
    },
    [focusMap],
  );

  useEffect(() => {
    loadForOrigin(
      CALGARY_CENTRE,
      'Calgary area · tap the location icon to show where you are',
    );
  }, [loadForOrigin]);

  const locateMe = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setSearchError('');
    setMessage('Finding your location…');
    try {
      const origin = await currentLocation();
      setShowsUserLocation(true);
      setQuery('');
      await loadForOrigin(
        origin,
        'Your location · nearby masjids shown on the map',
      );
    } catch {
      setShowsUserLocation(false);
      setSearchError(
        'Could not get your location. Allow location access or enter a postal code.',
      );
      setMessage('Location unavailable');
      setLoading(false);
    }
  };

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    const looksPostal = /^[a-z]\d/i.test(normalizedPostalCode(query));
    if (!value || looksPostal) return mosques;
    return mosques.filter(mosque =>
      `${mosque.name} ${mosque.address}`.toLowerCase().includes(value),
    );
  }, [mosques, query]);

  useEffect(() => {
    if (
      selectedMosque &&
      !results.some(mosque => mosque.id === selectedMosque.id)
    ) {
      setSelectedMosque(results[0] ?? null);
    }
  }, [results, selectedMosque]);

  const submitSearch = async () => {
    Keyboard.dismiss();
    if (!query.trim()) {
      focusMap(CALGARY_CENTRE, mosques);
      return;
    }
    if (isCanadianPostalCode(query)) {
      setLoading(true);
      setSearchError('');
      setMessage('Finding your postal-code area…');
      try {
        const area = await geocodeCanadianPostalCode(query);
        setQuery('');
        await loadForOrigin(
          area.coordinates,
          `${area.postalArea} · ${area.city}${
            area.province ? `, ${area.province}` : ''
          }`,
        );
      } catch (error) {
        setSearchError(
          error instanceof Error
            ? error.message
            : 'Could not find that postal code.',
        );
        setLoading(false);
      }
      return;
    }
    if (/^[a-z]\d/i.test(normalizedPostalCode(query))) {
      setSearchError('Enter a valid Canadian postal code, such as T2P 1J9.');
      return;
    }
    setSearchError('');
    if (results.length) {
      setSelectedMosque(results[0]);
      focusMap(
        {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        },
        results,
      );
    }
  };

  const searchVisibleArea = () => {
    const radiusMeters = Math.min(
      50000,
      Math.max(10000, visibleRegion.latitudeDelta * 111000 * 0.55),
    );
    loadForOrigin(
      {
        latitude: visibleRegion.latitude,
        longitude: visibleRegion.longitude,
      },
      'Showing masjids in this map area',
      radiusMeters,
    );
  };

  const activeMosque = selectedMosque ?? results[0] ?? null;
  const openMosque = (mosque: Mosque) =>
    navigation.navigate('MosqueDetail', { mosque });

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <MapView
        initialRegion={INITIAL_REGION}
        loadingEnabled
        loadingIndicatorColor={palette.green}
        mapPadding={{ top: 145, right: 20, bottom: 220, left: 20 }}
        onMapReady={() => {
          mapReadyRef.current = true;
          focusMap(CALGARY_CENTRE, mosques);
        }}
        onPanDrag={() => setMapMoved(true)}
        onRegionChangeComplete={setVisibleRegion}
        ref={mapRef}
        showsBuildings
        showsCompass
        showsPointsOfInterests
        showsScale
        showsUserLocation={showsUserLocation}
        style={StyleSheet.absoluteFill}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        {results.map((mosque, index) => (
          <Marker
            accessibilityLabel={`${mosque.name}, ${mosque.distanceKm.toFixed(
              1,
            )} kilometres away`}
            coordinate={{
              latitude: mosque.latitude,
              longitude: mosque.longitude,
            }}
            description={`${mosque.distanceKm.toFixed(1)} km · ${
              mosque.address
            }`}
            key={mosque.id}
            onPress={() => setSelectedMosque(mosque)}
            pinColor={index === 0 ? palette.gold : palette.green}
            title={mosque.name}
            zIndex={selectedMosque?.id === mosque.id ? 2 : 1}
          />
        ))}
      </MapView>

      <View pointerEvents="box-none" style={styles.topOverlay}>
        <View style={styles.headingRow}>
          <View>
            <Text style={[styles.title, theme.text]}>Mosques</Text>
            <Text style={[styles.subtitle, theme.mutedText]}>
              Explore masjids near you
            </Text>
          </View>
          <View style={[styles.countBadge, theme.card]}>
            <MapPin size={14} color={palette.green} />
            <Text style={[styles.countText, theme.text]}>{results.length}</Text>
          </View>
        </View>

        <View style={[styles.searchBar, theme.card]}>
          <Search size={19} color={palette.muted} />
          <TextInput
            accessibilityLabel="Search mosque name or Canadian postal code"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={value => {
              setQuery(value);
              if (searchError) setSearchError('');
            }}
            onSubmitEditing={submitSearch}
            placeholder="Mosque name or postal code"
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            style={[styles.input, theme.text]}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear mosque search"
              hitSlop={8}
              onPress={() => {
                setQuery('');
                setSearchError('');
              }}
            >
              <X size={18} color={palette.muted} />
            </Pressable>
          ) : null}
          <View style={[styles.searchDivider, theme.border]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show my location on the map"
            disabled={loading}
            hitSlop={6}
            onPress={locateMe}
            style={[styles.locationButton, { backgroundColor: palette.mint }]}
          >
            {loading ? (
              <ActivityIndicator color={palette.green} size="small" />
            ) : (
              <LocateFixed size={20} color={palette.green} />
            )}
          </Pressable>
        </View>

        <View style={[styles.statusPill, theme.card]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: palette.green },
              searchError && styles.statusDotError,
            ]}
          />
          <Text
            numberOfLines={2}
            style={[
              styles.statusText,
              searchError ? styles.errorText : theme.mutedText,
            ]}
          >
            {searchError || message}
          </Text>
        </View>
      </View>

      {mapMoved && !loading ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search for mosques in the visible map area"
          onPress={searchVisibleArea}
          style={[styles.searchAreaButton, theme.card]}
        >
          <Search size={15} color={palette.green} />
          <Text style={[styles.searchAreaText, { color: palette.green }]}>
            Search this area
          </Text>
        </Pressable>
      ) : null}

      {activeMosque ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${activeMosque.name} prayer times`}
          onPress={() => openMosque(activeMosque)}
          style={[styles.mosqueCard, theme.card]}
        >
          <View style={styles.cardTop}>
            <View style={[styles.pinIcon, { backgroundColor: palette.mint }]}>
              <MapPin size={21} color={palette.green} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardLabel, { color: palette.gold }]}>
                {activeMosque.id === results[0]?.id
                  ? 'CLOSEST MASJID'
                  : 'SELECTED MASJID'}
              </Text>
              <Text numberOfLines={1} style={[styles.cardName, theme.text]}>
                {activeMosque.name}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.cardAddress, theme.mutedText]}
              >
                {activeMosque.address}
              </Text>
            </View>
            <ChevronRight size={19} color={palette.muted} />
          </View>
          <View style={[styles.cardFooter, theme.border]}>
            <View style={styles.distanceRow}>
              <Navigation size={14} color={palette.green} />
              <Text style={[styles.cardDistance, { color: palette.green }]}>
                {activeMosque.distanceKm.toFixed(1)} km away
              </Text>
            </View>
            <Text style={[styles.prayerLink, { color: palette.green }]}>
              Prayer times & directions
            </Text>
          </View>
        </Pressable>
      ) : (
        <View style={[styles.emptyCard, theme.card]}>
          <Text style={[styles.emptyTitle, theme.text]}>
            No masjids here yet
          </Text>
          <Text style={[styles.emptyText, theme.mutedText]}>
            Move the map and tap “Search this area”.
          </Text>
        </View>
      )}

      <Text style={[styles.attribution, theme.mutedText]}>
        Mosque data © OpenStreetMap contributors
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topOverlay: { position: 'absolute', top: 10, left: 14, right: 14 },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 1 },
  countBadge: {
    ...shared.card,
    minWidth: 48,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  countText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  searchBar: {
    ...shared.card,
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 7,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 15,
    elevation: 7,
  },
  input: { color: colors.ink, flex: 1, height: 54, fontSize: 13 },
  searchDivider: {
    height: 28,
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
  },
  locationButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    ...shared.card,
    alignSelf: 'center',
    minHeight: 30,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 8,
    maxWidth: '94%',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 7 },
  statusDotError: { backgroundColor: '#C65353' },
  statusText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 13,
    flexShrink: 1,
  },
  errorText: { color: '#C65353' },
  searchAreaButton: {
    ...shared.card,
    position: 'absolute',
    top: 166,
    alignSelf: 'center',
    height: 38,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  searchAreaText: { color: colors.green, fontSize: 11, fontWeight: '800' },
  mosqueCard: {
    ...shared.card,
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 106,
    borderRadius: 23,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 17,
    elevation: 9,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  pinIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: { flex: 1, marginHorizontal: 11 },
  cardLabel: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  cardName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  cardAddress: { color: colors.muted, fontSize: 9, marginTop: 3 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 11,
    marginTop: 12,
  },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDistance: { color: colors.green, fontSize: 10, fontWeight: '800' },
  prayerLink: { color: colors.green, fontSize: 9, fontWeight: '700' },
  emptyCard: {
    ...shared.card,
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 106,
    borderRadius: 21,
    padding: 18,
    alignItems: 'center',
  },
  emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 10, marginTop: 4 },
  attribution: {
    position: 'absolute',
    bottom: 92,
    right: 18,
    color: colors.muted,
    fontSize: 7,
  },
});
