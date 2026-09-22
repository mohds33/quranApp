import { Platform } from 'react-native';
import NativeAppleMapsSearch from '../../specs/NativeAppleMapsSearch';
import type { Coordinates } from './mosques';
import {
  calculatePrayerSchedule,
  masjidAyeshaPrayerNames,
  type CalculationMethodKey,
  type MasjidAyeshaPrayerName,
  type PublishedMosquePrayerSchedule,
} from './prayerTimes';

export type PrayerNotification = {
  id: string;
  title: string;
  body: string;
  /** ISO timestamp of the moment the notification should fire. */
  date: string;
};

/** iOS allows 64 pending local notifications, so a week of prayers fits. */
const NOTIFICATION_DAYS = 12;

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Moves a calculated time to the masjid's published time for that prayer. */
function publishedTime(
  calculated: Date,
  published?: string,
): Date | undefined {
  const match = published?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return undefined;
  let hour = Number(match[1]);
  const suffix = match[3]?.toUpperCase();
  if (suffix) hour = (hour % 12) + (suffix === 'PM' ? 12 : 0);
  const moved = new Date(calculated);
  moved.setHours(hour, Number(match[2]), 0, 0);
  return moved;
}

/**
 * The next days of prayer times for this place, preferring the masjid's
 * published times for today when they are known.
 */
export function buildPrayerNotifications({
  origin,
  placeName,
  method,
  published,
  now = new Date(),
  days = NOTIFICATION_DAYS,
}: {
  origin: Coordinates;
  placeName: string;
  method: CalculationMethodKey;
  published?: PublishedMosquePrayerSchedule | null;
  now?: Date;
  days?: number;
}): PrayerNotification[] {
  const notifications: PrayerNotification[] = [];
  for (let day = 0; day < days; day += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    const schedule = calculatePrayerSchedule(origin, date, method);
    for (const name of masjidAyeshaPrayerNames) {
      const calculated = schedule.dates[name as MasjidAyeshaPrayerName];
      // Published times only describe today, so use them for today alone.
      const fires =
        (day === 0 &&
          publishedTime(
            calculated,
            published?.iqamah[name] ?? published?.adhan[name],
          )) ||
        calculated;
      if (fires.getTime() <= now.getTime()) continue;
      notifications.push({
        id: `${dayKey(date)}-${name}`,
        title: `${name} · ${placeName}`,
        body:
          day === 0 && published?.iqamah[name]
            ? `Jama'ah at ${published.iqamah[name]}`
            : `It is time for ${name}`,
        date: fires.toISOString(),
      });
    }
  }
  return notifications.sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

export async function requestNotificationPermission() {
  if (Platform.OS !== 'ios' || !NativeAppleMapsSearch) return false;
  try {
    return (await NativeAppleMapsSearch.requestNotificationPermission()) ===
      'granted';
  } catch {
    return false;
  }
}

export async function cancelPrayerNotifications() {
  if (Platform.OS !== 'ios' || !NativeAppleMapsSearch) return;
  try {
    await NativeAppleMapsSearch.cancelPrayerNotifications();
  } catch {
    // Nothing was scheduled.
  }
}

/** Replaces every pending prayer reminder with the coming days' times. */
export async function schedulePrayerNotifications(
  notifications: PrayerNotification[],
) {
  if (Platform.OS !== 'ios' || !NativeAppleMapsSearch) return 0;
  try {
    return await NativeAppleMapsSearch.schedulePrayerNotifications(
      JSON.stringify(notifications),
    );
  } catch {
    return 0;
  }
}
