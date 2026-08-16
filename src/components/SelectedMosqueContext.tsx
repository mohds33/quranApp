import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Mosque } from '../services/mosques';
import { fetchNearbyMosques } from '../services/mosques';
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

type SelectedMosqueContextValue = {
  selectedMosque: Mosque | null;
  selectMosque: (mosque: Mosque) => void;
  findingClosestMosque: boolean;
  closestMosqueError: string;
};

const SelectedMosqueContext = createContext<SelectedMosqueContextValue>({
  selectedMosque: null,
  selectMosque: () => undefined,
  findingClosestMosque: false,
  closestMosqueError: '',
});

export function SelectedMosqueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeLocation } = useAppPreferences();
  const [selectedMosque, selectMosque] = useState<Mosque | null>(null);
  const [findingClosestMosque, setFindingClosestMosque] = useState(false);
  const [closestMosqueError, setClosestMosqueError] = useState('');

  useEffect(() => {
    if (!activeLocation) return;
    let active = true;
    setFindingClosestMosque(true);
    setClosestMosqueError('');
    fetchNearbyMosques(activeLocation, 30000)
      .then(mosques => {
        if (!active) return;
        const closest = mosques[0];
        if (closest) {
          selectMosque(closest);
        } else {
          selectMosque(DEFAULT_SELECTED_MOSQUE);
          setClosestMosqueError('No nearby masjid was found, Showing default masjid instead.');
        }
      })
      .catch(() => {
        if (active) {
          selectMosque(DEFAULT_SELECTED_MOSQUE);
          setClosestMosqueError('Nearby mosque search is unavailable - Showing default masjid instead.');
        }
      })
      .finally(() => {
        if (active) setFindingClosestMosque(false);
      });
    return () => {
      active = false;
    };
  }, [activeLocation]);

  const value = useMemo(
    () => ({
      selectedMosque,
      selectMosque,
      findingClosestMosque,
      closestMosqueError,
    }),
    [closestMosqueError, findingClosestMosque, selectedMosque],
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
