import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Mosque } from '../services/mosques';
import { fetchNearbyMosques } from '../services/mosques';
import {
  findOfficialMosqueWebsite,
  fetchPublishedMosquePrayerSchedule,
  type PublishedMosquePrayerSchedule,
} from '../services/prayerTimes';
import { useAppPreferences } from './AppPreferencesContext';

export const DEFAULT_SELECTED_MOSQUE: Mosque = {
  id: 'masjid-ayesha-edmonton',
  name: 'Masjid Ayesha',
  address: '1741 170 St SW, Edmonton, AB T6W 1A6',
  latitude: 53.417073,
  longitude: -113.612226,
  distanceKm: 0,
  website: 'https://masjidayesha.ca/',
  source: 'saved',
};

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

type SelectedMosqueContextValue = {
  selectedMosque: Mosque | null;
  homeMosque: Mosque | null;
  selectMosque: (
    mosque: Mosque,
    schedule?: PublishedMosquePrayerSchedule,
  ) => void;
  findingClosestMosque: boolean;
  closestMosqueError: string;
  homeMosqueSchedule: PublishedMosquePrayerSchedule | null;
  homeMosqueScheduleLoading: boolean;
  homeMosqueScheduleError: string;
  refreshHomeMosqueSchedule: (
    forceRefresh?: boolean,
  ) => Promise<PublishedMosquePrayerSchedule | null>;
};

const SelectedMosqueContext = createContext<SelectedMosqueContextValue>({
  selectedMosque: null,
  homeMosque: null,
  selectMosque: () => undefined,
  findingClosestMosque: false,
  closestMosqueError: '',
  homeMosqueSchedule: null,
  homeMosqueScheduleLoading: false,
  homeMosqueScheduleError: '',
  refreshHomeMosqueSchedule: async () => null,
});

export function SelectedMosqueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    activeLocation,
    preferences,
    preferencesRestored,
    updatePreferences,
  } = useAppPreferences();
  const homeMosque = preferences.homeMosque;
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [findingClosestMosque, setFindingClosestMosque] = useState(false);
  const [closestMosqueError, setClosestMosqueError] = useState('');
  const [homeMosqueSchedule, setHomeMosqueSchedule] =
    useState<PublishedMosquePrayerSchedule | null>(null);
  const [homeMosqueScheduleLoading, setHomeMosqueScheduleLoading] =
    useState(false);
  const [homeMosqueScheduleError, setHomeMosqueScheduleError] = useState('');
  const [todayKey, setTodayKey] = useState(localDateKey);
  const homeMosqueIdRef = useRef<string | null>(null);

  useEffect(() => {
    homeMosqueIdRef.current = homeMosque?.id ?? null;
  }, [homeMosque?.id]);

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      1,
    );
    const timer = setTimeout(
      () => setTodayKey(localDateKey()),
      tomorrow.getTime() - now.getTime(),
    );
    return () => clearTimeout(timer);
  }, [todayKey]);

  useEffect(() => {
    if (!preferencesRestored) return;
    if (homeMosque) {
      setSelectedMosque(homeMosque);
      setFindingClosestMosque(false);
      setClosestMosqueError('');
      return;
    }
    if (!activeLocation) {
      setSelectedMosque(DEFAULT_SELECTED_MOSQUE);
      setFindingClosestMosque(false);
      return;
    }

    let active = true;
    setFindingClosestMosque(true);
    setClosestMosqueError('');
    fetchNearbyMosques(activeLocation, 30000)
      .then(mosques => {
        if (!active) return;
        const closest = mosques[0];
        if (closest) {
          setSelectedMosque(closest);
        } else {
          setSelectedMosque(DEFAULT_SELECTED_MOSQUE);
          setClosestMosqueError(
            'No nearby masjid was found. Showing the default masjid instead.',
          );
        }
      })
      .catch(() => {
        if (active) {
          setSelectedMosque(DEFAULT_SELECTED_MOSQUE);
          setClosestMosqueError(
            'Nearby mosque search is unavailable. Showing the default masjid instead.',
          );
        }
      })
      .finally(() => {
        if (active) setFindingClosestMosque(false);
      });
    return () => {
      active = false;
    };
  }, [activeLocation, homeMosque, preferencesRestored]);

  const selectMosque = useCallback(
    (mosque: Mosque, schedule?: PublishedMosquePrayerSchedule) => {
      const savedSchedule = schedule
        ? {
            mosqueId: mosque.id,
            refreshedOn: todayKey,
            schedule,
          }
        : null;
      homeMosqueIdRef.current = mosque.id;
      setSelectedMosque(mosque);
      setClosestMosqueError('');
      setFindingClosestMosque(false);
      setHomeMosqueSchedule(schedule ?? null);
      setHomeMosqueScheduleError('');
      setHomeMosqueScheduleLoading(false);
      updatePreferences({
        homeMosque: mosque,
        homeMosqueSchedule: savedSchedule,
      });
    },
    [todayKey, updatePreferences],
  );

  const refreshHomeMosqueSchedule = useCallback(
    async (forceRefresh = true) => {
      if (!homeMosque) return null;
      const mosque = homeMosque;
      setHomeMosqueScheduleLoading(true);
      setHomeMosqueScheduleError('');
      try {
        const schedule = await fetchPublishedMosquePrayerSchedule(mosque, {
          forceRefresh,
        });
        if (homeMosqueIdRef.current !== mosque.id) return null;
        const refreshedMosque = schedule.officialWebsiteUrl
          ? {
              ...mosque,
              website: schedule.officialWebsiteUrl,
              websiteCandidates: [
                schedule.officialWebsiteUrl,
                mosque.website,
                ...(mosque.websiteCandidates ?? []),
              ].filter(
                (website, index, websites): website is string =>
                  Boolean(website) && websites.indexOf(website) === index,
              ),
            }
          : mosque;
        setSelectedMosque(refreshedMosque);
        setHomeMosqueSchedule(schedule);
        updatePreferences({
          homeMosque: refreshedMosque,
          homeMosqueSchedule: {
            mosqueId: mosque.id,
            refreshedOn: todayKey,
            schedule,
          },
        });
        return schedule;
      } catch (failure) {
        if (homeMosqueIdRef.current === mosque.id) {
          setHomeMosqueScheduleError(
            failure instanceof Error
              ? failure.message
              : 'The saved masjid schedule could not be updated.',
          );
        }
        return null;
      } finally {
        if (homeMosqueIdRef.current === mosque.id) {
          setHomeMosqueScheduleLoading(false);
        }
      }
    },
    [homeMosque, todayKey, updatePreferences],
  );

  useEffect(() => {
    if (!preferencesRestored || !homeMosque) {
      setHomeMosqueSchedule(null);
      setHomeMosqueScheduleError('');
      setHomeMosqueScheduleLoading(false);
      return;
    }
    const saved = preferences.homeMosqueSchedule;
    const matchesHome = saved?.mosqueId === homeMosque.id;
    if (matchesHome) setHomeMosqueSchedule(saved.schedule);
    if (matchesHome && saved.refreshedOn === todayKey) {
      setHomeMosqueScheduleLoading(false);
      return;
    }
    refreshHomeMosqueSchedule(false);
  }, [
    homeMosque,
    preferences.homeMosqueSchedule,
    preferencesRestored,
    refreshHomeMosqueSchedule,
    todayKey,
  ]);

  useEffect(() => {
    if (!preferencesRestored || !homeMosque) return;
    let active = true;
    findOfficialMosqueWebsite(homeMosque)
      .then(website => {
        if (!active || website === homeMosque.website) return;
        const updatedMosque = {
          ...homeMosque,
          website,
          websiteCandidates: [
            website,
            homeMosque.website,
            ...(homeMosque.websiteCandidates ?? []),
          ].filter(
            (candidate, index, candidates): candidate is string =>
              Boolean(candidate) && candidates.indexOf(candidate) === index,
          ),
        };
        setSelectedMosque(updatedMosque);
        updatePreferences({ homeMosque: updatedMosque });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [homeMosque, preferencesRestored, updatePreferences]);

  const value = useMemo(
    () => ({
      selectedMosque,
      homeMosque,
      selectMosque,
      findingClosestMosque,
      closestMosqueError,
      homeMosqueSchedule,
      homeMosqueScheduleLoading,
      homeMosqueScheduleError,
      refreshHomeMosqueSchedule,
    }),
    [
      closestMosqueError,
      findingClosestMosque,
      homeMosque,
      homeMosqueSchedule,
      homeMosqueScheduleError,
      homeMosqueScheduleLoading,
      refreshHomeMosqueSchedule,
      selectMosque,
      selectedMosque,
    ],
  );
  return (
    <SelectedMosqueContext.Provider value={value}>
      {children}
    </SelectedMosqueContext.Provider>
  );
}

export function useSelectedMosque() {
  return useContext(SelectedMosqueContext);
}
