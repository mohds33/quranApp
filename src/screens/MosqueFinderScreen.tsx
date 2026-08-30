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
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import {
  ChevronRight,
  Check,
  Home,
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
import { useSelectedMosque } from '../components/SelectedMosqueContext';
import {
  CALGARY_CENTRE,
  distanceKm,
  fallbackNearbyMosques,
  fetchMosquesInRegion,
  fetchNearbyMosques,
  geocodeCanadianPostalCode,
  searchMosquesByName,
} from '../services/mosques';
import type { Coordinates, Mosque } from '../services/mosques';
import { getCurrentCoordinates } from '../services/location';
import {
  readLastMosqueSearch,
  saveLastMosqueSearch,
} from '../services/mosqueSearchCache';
import type { CachedSearchedLocation } from '../services/mosqueSearchCache';

const INITIAL_REGION: Region = {
  ...CALGARY_CENTRE,
  latitudeDelta: 0.42,
  longitudeDelta: 0.42,
};

function normalizedPostalCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isCanadianPostalCode(value: string) {
  return /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\d[ABCEGHJKLMNPRSTVWXYZ]\d$/.test(
    normalizedPostalCode(value),
  );
}

function formatPostalCodeInput(value: string) {
  const normalized = normalizedPostalCode(value).slice(0, 6);
  return normalized.length > 3
    ? `${normalized.slice(0, 3)} ${normalized.slice(3)}`
    : normalized;
}

type LoadForOriginOptions = {
  background?: boolean;
  cacheLabel?: string;
  searchedLocation?: CachedSearchedLocation;
};

export default function MosqueFinderScreen({ navigation }: any) {
  const { palette, isDark } = useAppTheme();
  const theme = useThemeStyles();
  const { selectedMosque: homeMosque, selectMosque } = useSelectedMosque();
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);
  const mapOriginRef = useRef<Coordinates>(CALGARY_CENTRE);
  const loadRequestRef = useRef(0);
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
  const [showAllSearchResults, setShowAllSearchResults] = useState(false);
  const [visibleRegion, setVisibleRegion] = useState<Region>(INITIAL_REGION);
  const [searchedLocation, setSearchedLocation] =
    useState<CachedSearchedLocation | null>(null);

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
          { ...origin, latitudeDelta: 0.055, longitudeDelta: 0.055 },
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
      focusClosestOnly = false,
      options: LoadForOriginOptions = {},
    ) => {
      const requestId = ++loadRequestRef.current;
      mapOriginRef.current = origin;
      if (!options.background) setLoading(true);
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

      if (requestId !== loadRequestRef.current) return;
      if (options.background && !nextMosques.length) {
        setMessage(
          `Showing saved ${
            options.cacheLabel ?? 'area'
          } mosques · refresh unavailable`,
        );
        return;
      }

      setMosques(nextMosques);
      const closestMosque = nextMosques[0] ?? null;
      setSelectedMosque(closestMosque);

      if (options.cacheLabel && nextMosques.length) {
        saveLastMosqueSearch({
          origin,
          label: options.cacheLabel,
          mosques: nextMosques,
          searchedLocation: options.searchedLocation,
          radiusMeters,
        }).catch(() => undefined);
      }

      if (liveMosques.length)
        setMessage(
          `${successMessage}${
            liveMosques[0]?.source === 'apple' ? ' · Apple Maps' : ''
          }`,
        );
      else if (fallback.length)
        setMessage('Showing saved Calgary mosques · tap location to recenter');
      else if (searchFailed)
        setMessage('Mosque search is unavailable. Check your connection.');
      else setMessage('No mapped mosques found in this area.');
      if (!options.background) setLoading(false);
      focusMap(
        origin,
        focusClosestOnly ? nextMosques.slice(0, 1) : nextMosques,
      );
    },
    [focusMap],
  );

  useEffect(() => {
    let active = true;

    const restoreLastSearch = async () => {
      const cached = await readLastMosqueSearch();
      if (!active) return;

      if (cached?.mosques.length) {
        const closestMosque = cached.mosques[0];
        mapOriginRef.current = cached.origin;
        setMosques(cached.mosques);
        setSelectedMosque(closestMosque);
        setSearchedLocation(cached.searchedLocation ?? null);
        setQuery(cached.searchedLocation?.label ?? '');
        setShowAllSearchResults(Boolean(cached.searchedLocation));
        setLoading(false);
        setMessage(`Showing saved ${cached.label} mosques · refreshing…`);
        focusMap(cached.origin, cached.mosques.slice(0, 1));
        loadForOrigin(
          cached.origin,
          `${cached.label} · closest masjid previewed`,
          cached.radiusMeters,
          true,
          {
            background: true,
            cacheLabel: cached.label,
            searchedLocation: cached.searchedLocation,
          },
        );
        return;
      }

      loadForOrigin(
        CALGARY_CENTRE,
        'Calgary area · closest masjid previewed',
        30000,
        true,
        { cacheLabel: 'Calgary' },
      );
    };

    restoreLastSearch();
    return () => {
      active = false;
      loadRequestRef.current += 1;
    };
  }, [focusMap, loadForOrigin]);

  const locateMe = async () => {
    Keyboard.dismiss();
    loadRequestRef.current += 1;
    setLoading(true);
    setSearchError('');
    setMessage('Finding your location…');
    try {
      const origin = await getCurrentCoordinates();
      setShowsUserLocation(true);
      setSearchedLocation(null);
      setQuery('');
      setShowAllSearchResults(false);
      await loadForOrigin(
        origin,
        'Your location · closest masjid previewed',
        30000,
        true,
        { cacheLabel: 'your last location' },
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
    if (!value || looksPostal || showAllSearchResults) return mosques;
    return mosques.filter(mosque =>
      `${mosque.name} ${mosque.address}`.toLowerCase().includes(value),
    );
  }, [mosques, query, showAllSearchResults]);

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
      focusMap(mapOriginRef.current, mosques.slice(0, 1));
      return;
    }
    if (isCanadianPostalCode(query)) {
      loadRequestRef.current += 1;
      setLoading(true);
      setSearchError('');
      setMessage('Finding your postal-code area…');
      try {
        const area = await geocodeCanadianPostalCode(query);
        const postalLocation: CachedSearchedLocation = {
          coordinates: area.coordinates,
          label: area.postalArea,
          address: area.address,
        };
        setQuery(area.postalArea);
        setShowsUserLocation(false);
        setSearchedLocation(postalLocation);
        await loadForOrigin(
          area.coordinates,
          `${area.postalArea} · ${area.city}${
            area.province ? `, ${area.province}` : ''
          } · closest masjid and postal location in view`,
          30000,
          true,
          {
            cacheLabel: `${area.city}${
              area.province ? `, ${area.province}` : ''
            }`,
            searchedLocation: postalLocation,
          },
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
    setLoading(true);
    setMessage(`Searching Apple Maps for “${query.trim()}”…`);
    const requestId = ++loadRequestRef.current;
    try {
      const namedMosques = await searchMosquesByName(query.trim(), {
        latitude: visibleRegion.latitude,
        longitude: visibleRegion.longitude,
      });
      if (requestId !== loadRequestRef.current) return;
      if (!namedMosques.length) {
        setSearchError(`No Apple Maps result found for “${query.trim()}”.`);
        setMessage('Try the mosque’s full name or move the map closer');
        return;
      }
      const firstMatch = namedMosques[0];
      mapOriginRef.current = {
        latitude: firstMatch.latitude,
        longitude: firstMatch.longitude,
      };
      setMosques(namedMosques);
      setSelectedMosque(firstMatch);
      setQuery(firstMatch.name);
      setShowAllSearchResults(true);
      setSearchedLocation(null);
      setMessage(`Apple Maps result · ${firstMatch.name}`);
      focusMap(
        {
          latitude: firstMatch.latitude,
          longitude: firstMatch.longitude,
        },
        [],
      );
    } catch {
      if (requestId !== loadRequestRef.current) return;
      setSearchError('Apple Maps search is temporarily unavailable.');
      setMessage('Check your connection and try again');
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  };

  const searchVisibleArea = () => {
    const requestId = ++loadRequestRef.current;
    const mapOrigin = {
      latitude: visibleRegion.latitude,
      longitude: visibleRegion.longitude,
    };
    mapOriginRef.current = mapOrigin;
    setSearchedLocation(null);
    setQuery('');
    setShowAllSearchResults(false);
    setSearchError('');
    setLoading(true);
    setMapMoved(false);
    setMessage('Searching Apple Maps and the global mosque directory…');
    fetchMosquesInRegion(visibleRegion)
      .then(nextMosques => {
        if (requestId !== loadRequestRef.current) return;
        setMosques(nextMosques);
        const closestMosque = nextMosques[0] ?? null;
        setSelectedMosque(closestMosque);
        if (nextMosques.length) {
          saveLastMosqueSearch({
            origin: mapOrigin,
            label: 'last map area',
            mosques: nextMosques,
            radiusMeters: 30000,
          }).catch(() => undefined);
        }
        setMessage(
          nextMosques.length
            ? `Showing ${nextMosques.length} masjid${
                nextMosques.length === 1 ? '' : 's'
              } in this map area`
            : 'No mapped masjids found in this area.',
        );
      })
      .catch(error => {
        if (requestId !== loadRequestRef.current) return;
        setSearchError(
          error instanceof Error
            ? error.message
            : 'Mosque search is temporarily unavailable.',
        );
      })
      .finally(() => {
        if (requestId === loadRequestRef.current) setLoading(false);
      });
  };

  const activeMosque = selectedMosque ?? results[0] ?? null;
  const openMosque = (mosque: Mosque) => {
    navigation.navigate('MosqueDetail', { mosque });
  };
  const setHomeMosque = (mosque: Mosque) => {
    selectMosque(mosque);
    setSelectedMosque(mosque);
    setMessage(`${mosque.name} is now your home masjid.`);
  };

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <MapView
        initialRegion={INITIAL_REGION}
        loadingEnabled
        loadingIndicatorColor={palette.green}
        mapPadding={{ top: 145, right: 20, bottom: 220, left: 20 }}
        onMapReady={() => {
          mapReadyRef.current = true;
          focusMap(mapOriginRef.current, mosques.slice(0, 1));
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
        {results.map(mosque => (
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
            onPress={() => {
              setSelectedMosque(mosque);
            }}
            pinColor={
              selectedMosque?.id === mosque.id ? palette.gold : palette.green
            }
            title={mosque.name}
            zIndex={selectedMosque?.id === mosque.id ? 2 : 1}
          />
        ))}
        {searchedLocation ? (
          <Marker
            accessibilityLabel={`Postal-code location ${searchedLocation.label}`}
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={searchedLocation.coordinates}
            description={searchedLocation.address}
            title={`Postal location · ${searchedLocation.label}`}
            tracksViewChanges={false}
            zIndex={4}
          >
            <View
              style={[
                styles.homeMarker,
                { backgroundColor: palette.gold, borderColor: colors.white },
              ]}
            >
              <Home size={16} color={colors.white} strokeWidth={2.6} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <View pointerEvents="box-none" style={styles.topOverlay}>
        <View style={styles.headingRow}>
          <View>
            <Text style={[styles.title, theme.text]}>Mosques</Text>
            <Text style={[styles.subtitle, theme.mutedText]}>
              Explore masjids worldwide
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
            accessibilityLabel="Search mosque name, city, or postal code worldwide"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={value => {
              const normalized = normalizedPostalCode(value);
              setShowAllSearchResults(false);
              setQuery(
                /^[a-z]\d/i.test(normalized)
                  ? formatPostalCodeInput(value)
                  : value,
              );
              if (searchError) setSearchError('');
            }}
            onSubmitEditing={submitSearch}
            placeholder="Mosque, city, or postal code"
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
                setShowAllSearchResults(false);
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
        <View style={[styles.mosqueCard, theme.card]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${activeMosque.name} details`}
            onPress={() => openMosque(activeMosque)}
            style={styles.cardTop}
          >
            <View style={[styles.pinIcon, { backgroundColor: palette.mint }]}>
              {homeMosque?.id === activeMosque.id ? (
                <Home size={21} color={palette.green} />
              ) : (
                <MapPin size={21} color={palette.green} />
              )}
            </View>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardLabel, { color: palette.gold }]}>
                {homeMosque?.id === activeMosque.id
                  ? 'HOME MASJID'
                  : activeMosque.id === results[0]?.id
                  ? 'CLOSEST MASJID'
                  : 'PREVIEWING MASJID'}
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
          </Pressable>
          <View style={[styles.cardFooter, theme.border]}>
            <View style={styles.distanceRow}>
              <Navigation size={14} color={palette.green} />
              <Text style={[styles.cardDistance, { color: palette.green }]}>
                {activeMosque.distanceKm.toFixed(1)} km away
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                homeMosque?.id === activeMosque.id
                  ? `${activeMosque.name} is already your home masjid`
                  : `Set ${activeMosque.name} as home masjid`
              }
              disabled={homeMosque?.id === activeMosque.id}
              onPress={() => setHomeMosque(activeMosque)}
              style={[
                styles.homeButton,
                { backgroundColor: palette.green },
                homeMosque?.id === activeMosque.id && {
                  backgroundColor: palette.mint,
                },
              ]}
            >
              {homeMosque?.id === activeMosque.id ? (
                <Check size={14} color={palette.green} />
              ) : (
                <Home size={14} color={colors.white} />
              )}
              <Text
                style={[
                  styles.homeButtonText,
                  homeMosque?.id === activeMosque.id && {
                    color: palette.green,
                  },
                ]}
              >
                {homeMosque?.id === activeMosque.id
                  ? 'Home masjid'
                  : 'Set home'}
              </Text>
            </Pressable>
          </View>
        </View>
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
        {mosques.some(mosque => mosque.source === 'apple') &&
        mosques.some(mosque => mosque.source === 'openstreetmap')
          ? 'Results from Apple Maps + OpenStreetMap'
          : mosques[0]?.source === 'apple'
          ? 'Mosque results from Apple Maps'
          : mosques[0]?.source === 'saved'
          ? 'Saved mosque directory'
          : 'Mosque data © OpenStreetMap contributors'}
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
  homeMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
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
  homeButton: {
    minHeight: 34,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  homeButtonText: { color: colors.white, fontSize: 10, fontWeight: '900' },
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
