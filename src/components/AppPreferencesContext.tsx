import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import NativeAppleMapsSearch from '../../specs/NativeAppleMapsSearch';
import {
  getCurrentCoordinates,
  ResolvedLocation,
  reverseGeocodeCoordinates,
} from '../services/location';
import type { CalculationMethodKey } from '../services/prayerTimes';
import type { QuranLanguageCode } from '../data/quran';

export type LocationMode = 'device' | 'custom';
export type PrayerTimeSource = 'closestMosque' | 'calculated';
export type QuranReadingKey = 'hafs';

export type AppPreferences = {
  locationMode: LocationMode;
  customLocation: ResolvedLocation | null;
  prayerTimeSource: PrayerTimeSource;
  calculationMethod: CalculationMethodKey;
  quranLanguage: QuranLanguageCode;
  quranReading: QuranReadingKey;
};

const defaultPreferences: AppPreferences = {
  locationMode: 'device',
  customLocation: null,
  prayerTimeSource: 'closestMosque',
  calculationMethod: 'northAmerica',
  quranLanguage: 'en',
  quranReading: 'hafs',
};

type AppPreferencesContextValue = {
  preferences: AppPreferences;
  updatePreferences: (changes: Partial<AppPreferences>) => void;
  activeLocation: ResolvedLocation | null;
  deviceLocation: ResolvedLocation | null;
  locationLoading: boolean;
  locationError: string;
  refreshDeviceLocation: () => Promise<void>;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue>({
  preferences: defaultPreferences,
  updatePreferences: () => undefined,
  activeLocation: null,
  deviceLocation: null,
  locationLoading: false,
  locationError: '',
  refreshDeviceLocation: async () => undefined,
});

function validSavedPreferences(value: any): Partial<AppPreferences> {
  if (!value || typeof value !== 'object') return {};
  return {
    locationMode: value.locationMode === 'custom' ? 'custom' : 'device',
    customLocation:
      Number.isFinite(value.customLocation?.latitude) &&
      Number.isFinite(value.customLocation?.longitude)
        ? value.customLocation
        : null,
    prayerTimeSource:
      value.prayerTimeSource === 'calculated'
        ? 'calculated'
        : 'closestMosque',
    calculationMethod: value.calculationMethod,
    quranLanguage: value.quranLanguage,
    quranReading: 'hafs',
  };
}

async function readSavedPreferences() {
  if (Platform.OS !== 'ios' || !NativeAppleMapsSearch) return {};
  try {
    const payload = await NativeAppleMapsSearch.readAppPreferences();
    return validSavedPreferences(payload ? JSON.parse(payload) : null);
  } catch {
    return {};
  }
}

async function savePreferences(preferences: AppPreferences) {
  if (Platform.OS !== 'ios' || !NativeAppleMapsSearch) return;
  try {
    await NativeAppleMapsSearch.saveAppPreferences(JSON.stringify(preferences));
  } catch {
    // Preferences still remain active for this session.
  }
}

export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [deviceLocation, setDeviceLocation] =
    useState<ResolvedLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [restored, setRestored] = useState(false);

  const refreshDeviceLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const coordinates = await getCurrentCoordinates();
      try {
        setDeviceLocation(await reverseGeocodeCoordinates(coordinates));
      } catch {
        setDeviceLocation({ ...coordinates, label: 'Current location' });
      }
    } catch (failure) {
      setLocationError(
        failure instanceof Error
          ? failure.message
          : 'Your current location is unavailable.',
      );
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    readSavedPreferences().then(saved => {
      setPreferences(current => ({ ...current, ...saved }));
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (restored && preferences.locationMode === 'device') {
      refreshDeviceLocation();
    }
  }, [preferences.locationMode, refreshDeviceLocation, restored]);

  const updatePreferences = useCallback((changes: Partial<AppPreferences>) => {
    setPreferences(current => {
      const next = { ...current, ...changes };
      savePreferences(next);
      return next;
    });
  }, []);

  const activeLocation =
    preferences.locationMode === 'custom'
      ? preferences.customLocation
      : deviceLocation;
  const value = useMemo(
    () => ({
      preferences,
      updatePreferences,
      activeLocation,
      deviceLocation,
      locationLoading,
      locationError,
      refreshDeviceLocation,
    }),
    [
      activeLocation,
      deviceLocation,
      locationError,
      locationLoading,
      preferences,
      refreshDeviceLocation,
      updatePreferences,
    ],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  return useContext(AppPreferencesContext);
}
