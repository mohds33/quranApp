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
  validTimeZone,
} from '../services/location';
import type { Mosque } from '../services/mosques';
import {
  calculationMethodOptions,
  type CalculationMethodKey,
  type PublishedMosquePrayerSchedule,
} from '../services/prayerTimes';
import {
  quranLanguageOptions,
  surahs,
  type QuranLanguageCode,
} from '../data/quran';
import {
  type AyahReference,
  validAyahBookmarks,
  validAyahReference,
} from '../services/quranReading';
import { PrayerLog, validPrayerLogs } from '../services/prayerTracking';

export type LocationMode = 'device' | 'custom';
export type AppearanceMode = 'system' | 'light' | 'dark';
export type PrayerTimeSource = 'closestMosque' | 'calculated';
export type QuranReadingKey = 'hafs';

export type SavedHomeMosqueSchedule = {
  mosqueId: string;
  refreshedOn: string;
  schedule: PublishedMosquePrayerSchedule;
};

export type AppPreferences = {
  appearance: AppearanceMode;
  prayerNotifications: boolean;
  locationMode: LocationMode;
  customLocation: ResolvedLocation | null;
  prayerTimeSource: PrayerTimeSource;
  calculationMethod: CalculationMethodKey;
  quranLanguage: QuranLanguageCode;
  quranReading: QuranReadingKey;
  quranLastRead: AyahReference | null;
  quranBookmarks: AyahReference[];
  savedDuas: string[];
  savedHadithBooks: string[];
  savedHadiths: string[];
  homeMosque: Mosque | null;
  homeMosqueSchedule: SavedHomeMosqueSchedule | null;
  prayerLogs: PrayerLog[];
};

const defaultPreferences: AppPreferences = {
  appearance: 'system',
  prayerNotifications: false,
  locationMode: 'device',
  customLocation: null,
  prayerTimeSource: 'closestMosque',
  calculationMethod: 'northAmerica',
  quranLanguage: 'en',
  quranReading: 'hafs',
  quranLastRead: null,
  quranBookmarks: [],
  savedDuas: [],
  savedHadithBooks: [],
  savedHadiths: [],
  homeMosque: null,
  homeMosqueSchedule: null,
  prayerLogs: [],
};

type AppPreferencesContextValue = {
  preferences: AppPreferences;
  updatePreferences: (changes: Partial<AppPreferences>) => void;
  activeLocation: ResolvedLocation | null;
  deviceLocation: ResolvedLocation | null;
  locationLoading: boolean;
  locationError: string;
  preferencesRestored: boolean;
  /** Time zone of a city chosen in Settings; undefined means the device's. */
  locationTimeZone?: string;
  refreshDeviceLocation: () => Promise<void>;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue>({
  preferences: defaultPreferences,
  updatePreferences: () => undefined,
  activeLocation: null,
  deviceLocation: null,
  locationLoading: false,
  locationError: '',
  preferencesRestored: false,
  refreshDeviceLocation: async () => undefined,
});

function validSavedMosque(value: any): Mosque | null {
  if (
    typeof value?.id !== 'string' ||
    typeof value?.name !== 'string' ||
    typeof value?.address !== 'string' ||
    !Number.isFinite(value?.latitude) ||
    !Number.isFinite(value?.longitude) ||
    Math.abs(value.latitude) > 90 ||
    Math.abs(value.longitude) > 180
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    address: value.address,
    latitude: value.latitude,
    longitude: value.longitude,
    distanceKm: Number.isFinite(value.distanceKm) ? value.distanceKm : 0,
    website: typeof value.website === 'string' ? value.website : undefined,
    websiteCandidates: Array.isArray(value.websiteCandidates)
      ? value.websiteCandidates.filter(
          (candidate: unknown): candidate is string =>
            typeof candidate === 'string',
        )
      : undefined,
    phone: typeof value.phone === 'string' ? value.phone : undefined,
    source:
      value.source === 'apple' ||
      value.source === 'openstreetmap' ||
      value.source === 'saved'
        ? value.source
        : undefined,
  };
}

function validSavedPublishedSchedule(
  value: any,
): PublishedMosquePrayerSchedule | null {
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.sourceName !== 'string' ||
    typeof value.sourceUrl !== 'string' ||
    typeof value.sourceLabel !== 'string' ||
    typeof value.verified !== 'boolean' ||
    typeof value.fetchedAt !== 'string' ||
    !Array.isArray(value.jummah)
  ) {
    return null;
  }
  const validTimes = (times: any) =>
    Object.fromEntries(
      Object.entries(times ?? {}).filter(
        ([, time]) => typeof time === 'string',
      ),
    );
  return {
    adhan: validTimes(value.adhan),
    iqamah: validTimes(value.iqamah),
    jummah: value.jummah.filter(
      (time: unknown): time is string => typeof time === 'string',
    ),
    sourceName: value.sourceName,
    sourceUrl: value.sourceUrl,
    officialWebsiteUrl:
      typeof value.officialWebsiteUrl === 'string'
        ? value.officialWebsiteUrl
        : undefined,
    sourceLabel: value.sourceLabel,
    verified: value.verified,
    coverageNote:
      typeof value.coverageNote === 'string' ? value.coverageNote : undefined,
    maghribUsesPublishedOffset:
      typeof value.maghribUsesPublishedOffset === 'boolean'
        ? value.maghribUsesPublishedOffset
        : undefined,
    fetchedAt: value.fetchedAt,
  };
}

/** Keeps saved ids that still look like ids, without duplicates. */
function validSavedKeys(value: unknown, pattern: RegExp, limit = 500) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set<string>(
      value.filter(
        (key: unknown): key is string =>
          typeof key === 'string' && pattern.test(key),
      ),
    ),
  ].slice(-limit);
}

export function validSavedPreferences(value: any): Partial<AppPreferences> {
  if (!value || typeof value !== 'object') return {};
  const savedLanguage = quranLanguageOptions.some(
    option => option.code === value.quranLanguage,
  )
    ? value.quranLanguage
    : defaultPreferences.quranLanguage;
  const homeMosque = validSavedMosque(value.homeMosque);
  const savedSchedule = validSavedPublishedSchedule(
    value.homeMosqueSchedule?.schedule,
  );
  const homeMosqueSchedule =
    homeMosque &&
    savedSchedule &&
    value.homeMosqueSchedule?.mosqueId === homeMosque.id &&
    typeof value.homeMosqueSchedule?.refreshedOn === 'string'
      ? {
          mosqueId: homeMosque.id,
          refreshedOn: value.homeMosqueSchedule.refreshedOn,
          schedule: savedSchedule,
        }
      : null;
  return {
    appearance:
      value.appearance === 'light' || value.appearance === 'dark'
        ? value.appearance
        : 'system',
    prayerNotifications: value.prayerNotifications === true,
    locationMode: value.locationMode === 'custom' ? 'custom' : 'device',
    customLocation:
      Number.isFinite(value.customLocation?.latitude) &&
      Number.isFinite(value.customLocation?.longitude)
        ? {
            ...value.customLocation,
            timeZone: validTimeZone(value.customLocation.timeZone),
          }
        : null,
    prayerTimeSource:
      value.prayerTimeSource === 'calculated' ? 'calculated' : 'closestMosque',
    calculationMethod: calculationMethodOptions.some(
      option => option.key === value.calculationMethod,
    )
      ? value.calculationMethod
      : defaultPreferences.calculationMethod,
    quranLanguage: savedLanguage,
    quranReading: 'hafs',
    quranLastRead: validAyahReference(value.quranLastRead, surahs),
    quranBookmarks: validAyahBookmarks(value.quranBookmarks, surahs),
    savedDuas: validSavedKeys(value.savedDuas, /^(h\d+|q\d+:\d+)$/),
    savedHadithBooks: validSavedKeys(
      value.savedHadithBooks,
      /^[a-z0-9]{2,20}$/,
    ),
    savedHadiths: validSavedKeys(
      value.savedHadiths,
      /^[a-z0-9]{2,20}:\d{1,6}$/,
    ),
    homeMosque,
    homeMosqueSchedule,
    prayerLogs: validPrayerLogs(value.prayerLogs),
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
  const [deviceLocation, setDeviceLocation] = useState<ResolvedLocation | null>(
    null,
  );
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
  const locationTimeZone =
    preferences.locationMode === 'custom'
      ? preferences.customLocation?.timeZone
      : undefined;
  const value = useMemo(
    () => ({
      locationTimeZone,
      preferences,
      updatePreferences,
      activeLocation,
      deviceLocation,
      locationLoading,
      locationError,
      preferencesRestored: restored,
      refreshDeviceLocation,
    }),
    [
      activeLocation,
      deviceLocation,
      locationError,
      locationLoading,
      locationTimeZone,
      preferences,
      refreshDeviceLocation,
      restored,
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
