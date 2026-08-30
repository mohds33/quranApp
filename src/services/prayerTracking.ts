export const trackedPrayerNames = [
  'Fajr',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
] as const;

export type TrackedPrayerName = (typeof trackedPrayerNames)[number];
export type PrayerLogStatus = 'onTime' | 'delayed';

export type PrayerLog = {
  date: string;
  prayer: TrackedPrayerName;
  status: PrayerLogStatus;
  recordedAt: string;
};

export type PrayerHistoryDay = {
  date: string;
  dateValue: Date;
  onTime: number;
  delayed: number;
  logs: Partial<Record<TrackedPrayerName, PrayerLogStatus>>;
};

export function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validPrayerLogs(value: unknown): PrayerLog[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, PrayerLog>();
  value.forEach(item => {
    const log = item as Partial<PrayerLog>;
    if (
      typeof log.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(log.date) ||
      !trackedPrayerNames.includes(log.prayer as TrackedPrayerName) ||
      (log.status !== 'onTime' && log.status !== 'delayed') ||
      typeof log.recordedAt !== 'string'
    ) {
      return;
    }
    unique.set(`${log.date}:${log.prayer}`, log as PrayerLog);
  });
  return [...unique.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

export function setPrayerLog(
  logs: PrayerLog[],
  prayer: TrackedPrayerName,
  status: PrayerLogStatus,
  date = new Date(),
) {
  const dateKey = localDateKey(date);
  const next = logs.filter(
    log => !(log.date === dateKey && log.prayer === prayer),
  );
  next.push({
    date: dateKey,
    prayer,
    status,
    recordedAt: new Date().toISOString(),
  });
  return validPrayerLogs(next).slice(-450);
}

export function clearPrayerLog(
  logs: PrayerLog[],
  prayer: TrackedPrayerName,
  date = new Date(),
) {
  const dateKey = localDateKey(date);
  return logs.filter(log => !(log.date === dateKey && log.prayer === prayer));
}

export function getPrayerLogStatus(
  logs: PrayerLog[],
  prayer: TrackedPrayerName,
  date = new Date(),
) {
  const dateKey = localDateKey(date);
  return logs.find(log => log.date === dateKey && log.prayer === prayer)
    ?.status;
}

export function getPrayerHistoryDays(
  logs: PrayerLog[],
  endDate = new Date(),
  numberOfDays = 7,
): PrayerHistoryDay[] {
  return Array.from({ length: numberOfDays }, (_, index) => {
    const offset = numberOfDays - index - 1;
    const dateValue = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - offset,
      12,
    );
    const date = localDateKey(dateValue);
    const dayLogs = logs.filter(log => log.date === date);
    const statuses = Object.fromEntries(
      dayLogs.map(log => [log.prayer, log.status]),
    ) as Partial<Record<TrackedPrayerName, PrayerLogStatus>>;
    return {
      date,
      dateValue,
      onTime: dayLogs.filter(log => log.status === 'onTime').length,
      delayed: dayLogs.filter(log => log.status === 'delayed').length,
      logs: statuses,
    };
  });
}
