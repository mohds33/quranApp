import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAppPreferences } from './AppPreferencesContext';
import { useSelectedMosque } from './SelectedMosqueContext';
import {
  buildPrayerNotifications,
  cancelPrayerNotifications,
  schedulePrayerNotifications,
} from '../services/prayerNotifications';

/**
 * Keeps the prayer reminders in step with the chosen masjid, location and
 * calculation method. Renders nothing.
 */
export default function PrayerNotificationScheduler() {
  const { preferences, activeLocation } = useAppPreferences();
  const { selectedMosque, homeMosqueSchedule } = useSelectedMosque();
  const enabled = preferences.prayerNotifications;
  const origin = selectedMosque ?? activeLocation;
  const placeName = selectedMosque?.name ?? activeLocation?.label ?? '';
  const method = preferences.calculationMethod;
  const rescheduling = useRef(false);

  const reschedule = useCallback(async () => {
    if (rescheduling.current) return;
    rescheduling.current = true;
    try {
      if (!enabled || !origin) {
        await cancelPrayerNotifications();
        return;
      }
      await schedulePrayerNotifications(
        buildPrayerNotifications({
          origin,
          placeName,
          method,
          published: homeMosqueSchedule,
        }),
      );
    } finally {
      rescheduling.current = false;
    }
  }, [enabled, homeMosqueSchedule, method, origin, placeName]);

  useEffect(() => {
    reschedule();
  }, [reschedule]);

  // Reopening the app is the moment to top the schedule back up.
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') reschedule();
    });
    return () => listener.remove();
  }, [reschedule]);

  return null;
}
