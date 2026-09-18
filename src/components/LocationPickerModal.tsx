import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, LocateFixed, MapPin, Search, X } from 'lucide-react-native';
import { colors, useAppTheme, useThemeStyles } from './DesignSystem';
import { useAppPreferences } from './AppPreferencesContext';
import { geocodeAddressOrCity, ResolvedLocation } from '../services/location';
import { distanceKm } from '../services/mosques';

// A saved home masjid farther than this from the new location is dropped,
// so prayer times follow the new city instead of the old masjid.
const HOME_MOSQUE_RADIUS_KM = 50;

export default function LocationPickerModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences, updatePreferences, deviceLocation, locationLoading } =
    useAppPreferences();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResolvedLocation | null>(null);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setError('');
    setResult(null);
  }, [visible]);

  const search = async () => {
    if (searching) return;
    setSearching(true);
    setError('');
    setResult(null);
    try {
      setResult(await geocodeAddressOrCity(query));
    } catch (failure) {
      setError(
        failure instanceof Error && failure.message
          ? failure.message
          : 'That city was not found. Try adding the province or country.',
      );
    } finally {
      setSearching(false);
    }
  };

  const homeMosqueChanges = (location: ResolvedLocation | null) =>
    preferences.homeMosque &&
    location &&
    distanceKm(preferences.homeMosque, location) > HOME_MOSQUE_RADIUS_KM
      ? { homeMosque: null, homeMosqueSchedule: null }
      : {};

  const applyCity = (location: ResolvedLocation) => {
    updatePreferences({
      locationMode: 'custom',
      customLocation: location,
      ...homeMosqueChanges(location),
    });
    onClose();
  };

  const applyDeviceLocation = () => {
    updatePreferences({
      locationMode: 'device',
      ...homeMosqueChanges(deviceLocation),
    });
    onClose();
  };

  const usingDevice = preferences.locationMode === 'device';

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.sheet, theme.screen]}
      >
        <View style={styles.header}>
          <Text style={[styles.heading, theme.text]}>Location</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            onPress={onClose}
          >
            <X size={22} color={palette.muted} />
          </Pressable>
        </View>
        <Text style={[styles.intro, theme.mutedText]}>
          Prayer times and nearby mosques are based on this location.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Use my current location"
          onPress={applyDeviceLocation}
          style={[styles.option, theme.card]}
        >
          <View style={[styles.icon, { backgroundColor: palette.mint }]}>
            <LocateFixed size={19} color={palette.green} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, theme.text]}>
              Use my current location
            </Text>
            <Text style={[styles.meta, theme.mutedText]}>
              {locationLoading
                ? 'Finding your location…'
                : deviceLocation?.label ?? 'Uses your device’s GPS'}
            </Text>
          </View>
          {usingDevice ? <Check size={20} color={palette.green} /> : null}
        </Pressable>

        <Text style={[styles.section, theme.mutedText]}>OR ENTER A CITY</Text>
        <View style={[styles.search, theme.card]}>
          <Search size={19} color={palette.muted} />
          <TextInput
            accessibilityLabel="City"
            autoCorrect={false}
            autoFocus={!usingDevice}
            value={query}
            onChangeText={text => {
              setQuery(text);
              setError('');
            }}
            onSubmitEditing={search}
            placeholder="e.g. Edmonton, Alberta"
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            style={[styles.input, theme.text]}
          />
          {searching ? <ActivityIndicator color={palette.green} /> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search for city"
          disabled={query.trim().length < 2 || searching}
          onPress={search}
          style={[
            styles.searchButton,
            { backgroundColor: palette.green },
            (query.trim().length < 2 || searching) && styles.disabled,
          ]}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>

        {error ? (
          <Text style={[styles.error, { color: palette.gold }]}>{error}</Text>
        ) : null}

        {result ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Use ${result.label}`}
            onPress={() => applyCity(result)}
            style={[styles.option, theme.card]}
          >
            <View style={[styles.icon, { backgroundColor: palette.mint }]}>
              <MapPin size={19} color={palette.green} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.title, theme.text]}>{result.label}</Text>
              {result.address && result.address !== result.label ? (
                <Text numberOfLines={2} style={[styles.meta, theme.mutedText]}>
                  {result.address}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.use, { color: palette.green }]}>Use</Text>
          </Pressable>
        ) : !usingDevice && preferences.customLocation ? (
          <View style={[styles.option, theme.card]}>
            <View style={[styles.icon, { backgroundColor: palette.mint }]}>
              <MapPin size={19} color={palette.green} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.title, theme.text]}>
                {preferences.customLocation.label}
              </Text>
              <Text style={[styles.meta, theme.mutedText]}>Current city</Text>
            </View>
            <Check size={20} color={palette.green} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, padding: 22, paddingTop: 26 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { color: colors.ink, fontSize: 24, fontWeight: '800' },
  intro: { color: colors.muted, fontSize: 13, marginTop: 6, marginBottom: 22 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  section: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 10,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  input: { flex: 1, height: 50, fontSize: 15, color: colors.ink },
  searchButton: {
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  searchButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  error: { fontSize: 13, marginBottom: 12 },
  use: { fontSize: 14, fontWeight: '800' },
});
