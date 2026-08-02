import {
  CalculationMethod,
  Coordinates as AdhanCoordinates,
  PolarCircleResolution,
  PrayerTimes as AdhanPrayerTimes,
  Qibla,
} from 'adhan';
import { Platform } from 'react-native';
import NativeAppleMapsSearch from '../../specs/NativeAppleMapsSearch';
import { distanceKm } from './mosques';
import type { Coordinates, Mosque } from './mosques';

export const prayerNames = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
] as const;

export type PrayerName = (typeof prayerNames)[number];
export type PrayerTimings = Record<PrayerName, string>;
export type PrayerDates = Record<PrayerName, Date>;

export type DailyPrayerSchedule = {
  timings: PrayerTimings;
  dates: PrayerDates;
  readableDate: string;
  hijriDate: string;
  methodName: string;
};

export type AddressPrayerSchedule = {
  schedule: DailyPrayerSchedule;
  locationLabel: string;
};

export const calculationMethodOptions = [
  { key: 'northAmerica', label: 'ISNA · North America' },
  { key: 'muslimWorldLeague', label: 'Muslim World League' },
  { key: 'ummAlQura', label: 'Umm al-Qura · Makkah' },
  { key: 'egyptian', label: 'Egyptian Survey Authority' },
  { key: 'karachi', label: 'University of Islamic Sciences · Karachi' },
  { key: 'moonsighting', label: 'Moonsighting Committee' },
  { key: 'dubai', label: 'Dubai' },
  { key: 'kuwait', label: 'Kuwait' },
  { key: 'qatar', label: 'Qatar' },
  { key: 'singapore', label: 'Singapore' },
  { key: 'turkey', label: 'Diyanet · Türkiye' },
  { key: 'tehran', label: 'Institute of Geophysics · Tehran' },
] as const;

export type CalculationMethodKey =
  (typeof calculationMethodOptions)[number]['key'];

export type MosqueIqamahSchedule = {
  timings: Partial<
    Record<'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', string>
  >;
  jummah: string[];
  matchedMosqueName: string;
  verified: boolean;
  maghribUsesPublishedOffset?: boolean;
  updatedAt?: string;
};

export const masjidAyeshaPrayerNames = [
  'Fajr',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
] as const;

export type MasjidAyeshaPrayerName = (typeof masjidAyeshaPrayerNames)[number];

export type PublishedMosquePrayerSchedule = {
  adhan: Partial<Record<MasjidAyeshaPrayerName, string>>;
  iqamah: Partial<Record<MasjidAyeshaPrayerName, string>>;
  jummah: string[];
  sourceName: string;
  sourceUrl: string;
  officialWebsiteUrl?: string;
  sourceLabel: string;
  verified: boolean;
  coverageNote?: string;
  maghribUsesPublishedOffset?: boolean;
  fetchedAt: string;
};

export const MASJID_AYESHA_PRAYER_TIMES_URL = 'https://masjidayesha.ca/';
const AL_FARUQ_CENTRE_WEBSITE_URL = 'https://www.alfaruqcentre.com/';
export const AL_FARUQ_CENTRE_PRAYER_TIMES_URL =
  'https://www.alfaruqcentre.com/prayertimes';
const AL_FARUQ_CENTRE_PRAYER_TIMES_API =
  'https://www.alfaruqcentre.com/api/prayerTimes';
const AL_KAFEEL_WEBSITE_URL = 'https://alkafeel.net/?lang=en';
const AL_KAFEEL_KARBALA_PRAYER_API =
  'https://alkafeel.net/alkafeel_back_test/api/v1/salaDate';

type IqamahCandidateMatch = {
  candidate: any;
  nameScore: number;
  distanceMeters: number;
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

function formatTime(date: Date) {
  return Number.isNaN(date.getTime()) ? '—' : timeFormatter.format(date);
}

function formatHijriDate(date: Date) {
  try {
    return new Intl.DateTimeFormat('en-US-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

export function calculatePrayerSchedule(
  origin: Coordinates,
  date = new Date(),
  method: CalculationMethodKey = 'northAmerica',
): DailyPrayerSchedule {
  const methodFactories: Record<
    CalculationMethodKey,
    () => ReturnType<typeof CalculationMethod.NorthAmerica>
  > = {
    northAmerica: CalculationMethod.NorthAmerica,
    muslimWorldLeague: CalculationMethod.MuslimWorldLeague,
    ummAlQura: CalculationMethod.UmmAlQura,
    egyptian: CalculationMethod.Egyptian,
    karachi: CalculationMethod.Karachi,
    moonsighting: CalculationMethod.MoonsightingCommittee,
    dubai: CalculationMethod.Dubai,
    kuwait: CalculationMethod.Kuwait,
    qatar: CalculationMethod.Qatar,
    singapore: CalculationMethod.Singapore,
    turkey: CalculationMethod.Turkey,
    tehran: CalculationMethod.Tehran,
  };
  const selectedMethod =
    calculationMethodOptions.find(option => option.key === method) ??
    calculationMethodOptions[0];
  const parameters = methodFactories[selectedMethod.key]();
  parameters.polarCircleResolution = PolarCircleResolution.AqrabYaum;
  const calculated = new AdhanPrayerTimes(
    new AdhanCoordinates(origin.latitude, origin.longitude),
    date,
    parameters,
  );
  const dates: PrayerDates = {
    Fajr: calculated.fajr,
    Sunrise: calculated.sunrise,
    Dhuhr: calculated.dhuhr,
    Asr: calculated.asr,
    Maghrib: calculated.maghrib,
    Isha: calculated.isha,
  };
  return {
    dates,
    timings: Object.fromEntries(
      prayerNames.map(name => [name, formatTime(dates[name])]),
    ) as PrayerTimings,
    readableDate: new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date),
    hijriDate: formatHijriDate(date),
    methodName: `${selectedMethod.label} · offline calculation`,
  };
}

export function calculateQiblaDirection(origin: Coordinates) {
  return Qibla(new AdhanCoordinates(origin.latitude, origin.longitude));
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init: RequestInit = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeLocalizedWebsiteText(value: string) {
  const digitSets = ['٠١٢٣٤٥٦٧٨٩', '۰۱۲۳۴۵۶۷۸۹', '০১২৩৪৫৬৭৮৯', '०१२३४५६७८९'];
  return value
    .replace(/[٠-٩۰-۹০-৯०-९]/g, digit => {
      for (const set of digitSets) {
        const index = set.indexOf(digit);
        if (index >= 0) return String(index);
      }
      return digit;
    })
    .normalize('NFKD')
    .replace(
      /[\u0300-\u036f\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g,
      '',
    )
    .replace(/[ıİ]/g, 'i')
    .replace(/ß/g, 'ss');
}

function websiteHtmlToText(html: string) {
  const namedEntities: Record<string, string> = {
    eacute: 'é',
    egrave: 'è',
    ecirc: 'ê',
    aacute: 'á',
    oacute: 'ó',
    uacute: 'ú',
    ouml: 'ö',
    uuml: 'ü',
    ccedil: 'ç',
  };
  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) =>
      String.fromCodePoint(Number.parseInt(value, 16)),
    )
    .replace(/&#(\d+);/g, (_, value: string) =>
      String.fromCodePoint(Number(value)),
    )
    .replace(
      /&([a-z]+);/gi,
      (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity,
    )
    .replace(/\s+/g, ' ')
    .trim();
  return normalizeLocalizedWebsiteText(text);
}

function normalizePublishedTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute > 59) return '';
  return `${String(hour).padStart(2, '0')}:${
    match[2]
  } ${match[3].toUpperCase()}`;
}

export function parseMasjidAyeshaPrayerScheduleHTML(
  html: string,
): PublishedMosquePrayerSchedule {
  const text = websiteHtmlToText(html);
  const prayerSectionStart = text.search(/Prayer Timing/i);
  const jummahSectionStart = text.search(/Jumuah Timing/i);
  if (prayerSectionStart < 0 || jummahSectionStart <= prayerSectionStart) {
    throw new Error('The official prayer schedule was not found.');
  }

  const prayerSection = text.slice(prayerSectionStart, jummahSectionStart);
  const adhan = {} as Record<MasjidAyeshaPrayerName, string>;
  const iqamah = {} as Record<MasjidAyeshaPrayerName, string>;
  const clockPattern = '(\\d{1,2}:\\d{2}\\s*[AP]M)';

  for (const name of masjidAyeshaPrayerNames) {
    const match = prayerSection.match(
      new RegExp(`${name}\\s+${clockPattern}\\s+${clockPattern}`, 'i'),
    );
    const adhanTime = match ? normalizePublishedTime(match[1]) : '';
    const iqamahTime = match ? normalizePublishedTime(match[2]) : '';
    if (!adhanTime || !iqamahTime) {
      throw new Error(`The official ${name} times were missing.`);
    }
    adhan[name] = adhanTime;
    iqamah[name] = iqamahTime;
  }

  const jummahSection = text.slice(jummahSectionStart);
  const jummah = [1, 2]
    .map(number => {
      const match = jummahSection.match(
        new RegExp(`${number}\\s+Jumuah\\s+${clockPattern}`, 'i'),
      );
      return match ? normalizePublishedTime(match[1]) : '';
    })
    .filter(Boolean);
  if (jummah.length < 2) {
    throw new Error('The official Jumu’ah times were missing.');
  }

  return {
    adhan,
    iqamah,
    jummah,
    sourceName: 'Masjid Ayesha',
    sourceUrl: MASJID_AYESHA_PRAYER_TIMES_URL,
    sourceLabel: 'Official website',
    verified: true,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchMasjidAyeshaPrayerSchedule() {
  const response = await fetchWithTimeout(
    MASJID_AYESHA_PRAYER_TIMES_URL,
    10000,
  );
  if (!response.ok) {
    throw new Error('Masjid Ayesha’s website could not be reached.');
  }
  return parseMasjidAyeshaPrayerScheduleHTML(await response.text());
}

const websitePrayerAliases: Record<MasjidAyeshaPrayerName, string> = {
  Fajr: 'Fajr|Fajer|Fajir|Fedzr|Fedjr|Fecr|Subh|Sobh|Subuh|Subax|Sabah|Sabahu|الفجر|فجر|الصبح|صبح|ফজর',
  Dhuhr:
    'Dhuhr|Duhur|Duhr|Zuhr|Zuhur|Dzuhur|Zohar|Zohr|Dhohr|Dhor|Ogle|Podne|Dreke|Noon|Midi|الظهر|ظهر|ظہر|জোহর|যোহর',
  Asr: 'Asr|Asar|Ashar|Casar|Ikindi|Ikindija|Ikindia|العصر|عصر|আসর',
  Maghrib:
    'Maghrib|Maghreb|Magrib|Maqrib|Aksam|Aksham|Akshami|المغرب|مغرب|মাগরিব',
  Isha: 'Isha|Ishaa|Esha|Eshaa|Icha|Isya|Isyak|Cisho|Yatsi|Jacija|Jacia|العشاء|عشاء|ইশা|এশা',
};
const websiteJummahAliases =
  "Jum(?:u['’]?ah|ua|mah)|Joumou['’]?a|Yumuah|Friday\\s+(?:Prayer|Prayers|Salah|Salaah)|Freitagsgebet|Cuma|Vendredi(?:\\s+(?:Priere|Salat))?|Jumat|Jumaat|Dzuma|Xhuma|Jimco|الجمعة|جمعه|جمعہ|জুমা";

const websiteTimePattern =
  /(?:[01]?\d|2[0-3])[:.][0-5]\d\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|[صم])?/gi;
const websiteScheduleWords =
  /(?:(?:prayer|salah|salat)[\s_-]*(?:times?|timings?|timetable|schedule)|iqamah|jamaat|jamat|jummah|jumuah|timetable|namaz|vaktija|namaska\s+vremena|orari\s+i\s+namazit|(?:ramadan|monthly|yearly)\s+(?:prayer\s+)?schedule|horaires?\s+(?:de\s+)?priere|heures?\s+(?:de\s+)?priere|gebetszeiten|tiempos?\s+de\s+oracion|horarios?\s+de\s+oracion|orari[oa]\s+(?:di\s+)?preghier[ae]|gebedstijden|namaz\s+(?:vakitleri|saatleri|vremena)|waktu\s+(?:solat|salat|sholat)|waqtiyada\s+salaadda|مواقيت\s*(?:الصلاة|الصلاه)|اوقات\s*(?:الصلاة|الصلاه)|اوقات\s*نماز|نماز\s*کے\s*اوقات|নামাজের\s*সময়|awqat-salat|namaz-sutra|tiempos-de-oracion|horaires-de-priere|orario-di-preghiera|demen-nimeje|waktu-solat|namaz-vakitleri|waktu-sholat|waqtiyada-salaadda|namaaz-ke-auqat|casy-modlitieb|namajera-samaya|imaidoket|reihai-jikan|bon-?tider|bonnetider|vremya-molitv|neram-pattiyal)/i;

function normalizeWebsiteTime(value: string, prayer?: MasjidAyeshaPrayerName) {
  const cleaned = normalizeLocalizedWebsiteText(value)
    .replace(/(\d)\.(?=\d)/g, '$1:')
    .replace(/\s+/g, ' ')
    .trim();
  const match = cleaned.match(
    /^(\d{1,2}):(\d{2})\s*(?:(A|P)\.?\s*M\.?|([صم]))?$/i,
  );
  if (!match) return '';
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const explicitSuffix =
    match[3]?.toUpperCase() ??
    (match[4] === 'ص' ? 'A' : match[4] === 'م' ? 'P' : undefined);
  if (minute > 59 || hour > 23) return '';
  if (explicitSuffix) {
    if (hour < 1 || hour > 12) return '';
    return `${String(hour).padStart(2, '0')}:${match[2]} ${explicitSuffix}M`;
  }
  if (hour <= 12 && prayer) {
    const suffix = prayer === 'Fajr' ? 'AM' : 'PM';
    hour = hour % 12;
    return `${String(hour || 12).padStart(2, '0')}:${match[2]} ${suffix}`;
  }
  return displayClockTime(`${hour}:${match[2]}`);
}

function websitePrayerSegment(text: string, name: MasjidAyeshaPrayerName) {
  const label = new RegExp(`(?:${websitePrayerAliases[name]})`, 'gi');
  let bestSegment = '';
  let bestTimeCount = 0;
  for (const match of text.matchAll(label)) {
    const start = (match.index ?? 0) + match[0].length;
    const candidate = text.slice(start, start + 240);
    const nextPrayerIndex = [
      ...masjidAyeshaPrayerNames
        .filter(otherName => otherName !== name)
        .map(otherName =>
          candidate.search(
            new RegExp(`(?:${websitePrayerAliases[otherName]})`, 'i'),
          ),
        ),
      candidate.search(new RegExp(`(?:${websiteJummahAliases})`, 'i')),
    ]
      .filter(index => index >= 0)
      .sort((left, right) => left - right)[0];
    const segment = candidate.slice(
      0,
      nextPrayerIndex === undefined ? candidate.length : nextPrayerIndex,
    );
    const timeCount = [...segment.matchAll(websiteTimePattern)].length;
    if (timeCount && timeCount >= bestTimeCount) {
      bestSegment = segment;
      bestTimeCount = timeCount;
    }
  }
  return bestSegment;
}

function displayTimeMinutes(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.NaN;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[2]);
}

function extractPublishedJummahTimes(text: string, mosqueName?: string) {
  const heading = new RegExp(`(?:${websiteJummahAliases})`, 'gi');
  const dailyPrayer = new RegExp(
    `(?:${Object.values(websitePrayerAliases).join('|')})`,
    'i',
  );
  let best: string[] = [];

  if (mosqueName) {
    const venueMatches = [
      ...text.matchAll(
        /\bJum(?:u['’]?ah|ua|mah)\s+(?:at|@)\s+(.{1,80}?)\s+(\d{1,2}[:.]\d{2}\s*(?:a\.?m\.?|p\.?m\.?))/gi,
      ),
    ].map(match => ({
      score: mosqueNameScore(mosqueName, match[1]),
      time: normalizeWebsiteTime(match[2], 'Dhuhr'),
    }));
    const bestVenueScore = Math.max(
      0,
      ...venueMatches.map(match => match.score),
    );
    if (bestVenueScore >= 0.45) {
      const venueTimes = venueMatches
        .filter(match => match.score === bestVenueScore && match.time)
        .map(match => match.time)
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 3);
      if (venueTimes.length) return venueTimes;
    }
  }

  for (const match of text.matchAll(heading)) {
    const start = (match.index ?? 0) + match[0].length;
    const candidate = text.slice(start, start + 600);
    const nextDailyPrayer = candidate.search(dailyPrayer);
    const segment = candidate.slice(
      0,
      nextDailyPrayer < 0 ? candidate.length : nextDailyPrayer,
    );
    const times = [...segment.matchAll(websiteTimePattern)]
      .map(timeMatch => normalizeWebsiteTime(timeMatch[0], 'Dhuhr'))
      .filter(Boolean)
      .filter(value => {
        const minutes = displayTimeMinutes(value);
        return minutes >= 10 * 60 + 30 && minutes <= 17 * 60 + 30;
      })
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(0, 2);

    if (times.length && times.length >= best.length) best = times;
  }

  return best;
}

function semanticWebsiteTime(
  html: string,
  name: MasjidAyeshaPrayerName,
  kind: 'adhan' | 'iqamah',
) {
  const prayerPattern = new RegExp(`(?:${websitePrayerAliases[name]})`, 'i');
  const rolePattern =
    kind === 'adhan'
      ? /(?:adhaan|adhan|athaan|athan|azzan|azan|ezan|salah|start|begin|heure|horaire|zeit|vakit|waqt|waktu|tiempo|اذان|أذان|وقت)/i
      : /(?:iqamah|iqama|iqaamah|jamaat|jamat|congregation|kamet|اقامة|إقامة|جماعة)/i;

  for (const match of html.matchAll(/<[^>]+>/g)) {
    const tag = normalizeLocalizedWebsiteText(match[0]);
    if (!prayerPattern.test(tag) || !rolePattern.test(tag)) continue;
    const start = (match.index ?? 0) + match[0].length;
    const nearbyHTML = normalizeLocalizedWebsiteText(
      html.slice(start, start + 260),
    );
    const time = nearbyHTML.match(websiteTimePattern)?.[0] ?? '';
    const normalized = normalizeWebsiteTime(time, name);
    if (normalized) return normalized;
  }
  return '';
}

function normalizedWebsiteDataKey(value: string) {
  return normalizeLocalizedWebsiteText(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\u0980-\u09ff]+/g, '_')
    .replace(/^_|_$/g, '');
}

function flattenWebsiteData(
  value: unknown,
  prefix = '',
  depth = 0,
  flattened = new Map<string, unknown>(),
) {
  if (depth > 8 || value === null || value === undefined) return flattened;
  if (Array.isArray(value)) {
    value
      .slice(0, 12)
      .forEach((item, index) =>
        flattenWebsiteData(item, `${prefix}_${index}`, depth + 1, flattened),
      );
    return flattened;
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      flattenWebsiteData(
        item,
        prefix ? `${prefix}_${key}` : key,
        depth + 1,
        flattened,
      );
    }
    return flattened;
  }
  flattened.set(normalizedWebsiteDataKey(prefix), value);
  return flattened;
}

function balancedJSONObjectAt(source: string, start: number) {
  const opening = source[start];
  if (opening !== '{' && opening !== '[') return '';
  const closing = opening === '{' ? '}' : ']';
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === opening) depth += 1;
    else if (character === closing) {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return '';
}

export function extractEmbeddedPrayerScheduleData(html: string) {
  const payloads: unknown[] = [];
  const addJSON = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 3_000_000) return;
    try {
      payloads.push(JSON.parse(trimmed));
    } catch {
      // Ignore scripts that are JavaScript rather than valid JSON data.
    }
  };

  for (const script of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  )) {
    if (
      /\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(script[1]) ||
      /\bid\s*=\s*["']__NEXT_DATA__["']/i.test(script[1])
    ) {
      addJSON(script[2]);
    }
  }

  const stateAssignment =
    /(?:window\.)?(?:__INITIAL_STATE__|__PRELOADED_STATE__|__NUXT__)\s*=\s*/gi;
  for (const match of html.matchAll(stateAssignment)) {
    const valueStart = (match.index ?? 0) + match[0].length;
    addJSON(balancedJSONObjectAt(html, valueStart));
  }

  return payloads.slice(0, 10);
}

function genericWebsiteDataTime(
  data: Map<string, unknown>,
  prayerAliases: string[],
  roleAliases: string[],
  prayer: MasjidAyeshaPrayerName,
) {
  for (const [key, value] of data) {
    if (
      prayerAliases.some(prayerAlias =>
        roleAliases.some(roleAlias =>
          key.endsWith(`${prayerAlias}_${roleAlias}`),
        ),
      )
    ) {
      const time = normalizeWebsiteTime(String(value ?? ''), prayer);
      if (time) return time;
    }
  }
  return '';
}

function publishedPrayerName(value: unknown): MasjidAyeshaPrayerName | null {
  const label = normalizeLocalizedWebsiteText(String(value ?? ''))
    .toLocaleLowerCase()
    .trim();
  if (/^(?:fajr|fajer|subh|الفجر|فجر)$/.test(label)) return 'Fajr';
  if (/^(?:dhuhr|duhr|zuhr|zuhur|الظهر|ظهر)$/.test(label)) return 'Dhuhr';
  if (/^(?:asr|asar|العصر|عصر)$/.test(label)) return 'Asr';
  if (/^(?:maghrib|maghreb|magrib|المغرب|مغرب)$/.test(label)) return 'Maghrib';
  if (/^(?:isha|ishaa|esha|العشاء|عشاء)$/.test(label)) return 'Isha';
  return null;
}

function findPublishedPrayerRows(value: unknown, depth = 0): any[] {
  if (depth > 6 || !value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    const labelled = value.filter(
      item =>
        item &&
        typeof item === 'object' &&
        publishedPrayerName(
          item.name ?? item.prayer ?? item.salah ?? item.label,
        ),
    );
    if (labelled.length >= 3) return labelled;
    for (const item of value) {
      const nested = findPublishedPrayerRows(item, depth + 1);
      if (nested.length) return nested;
    }
    return [];
  }
  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    const nested = findPublishedPrayerRows(nestedValue, depth + 1);
    if (nested.length) return nested;
  }
  return [];
}

export function parsePublishedMosqueWebsiteData(
  payload: unknown,
  mosque: Mosque,
  sourceUrl: string,
): PublishedMosquePrayerSchedule {
  if (!payload || typeof payload !== 'object') {
    throw new Error('The website prayer data was missing.');
  }
  const prayerRows = findPublishedPrayerRows(payload);
  if (prayerRows.length >= 3) {
    const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
    const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
    for (const row of prayerRows) {
      const name = publishedPrayerName(
        row.name ?? row.prayer ?? row.salah ?? row.label,
      );
      if (!name) continue;
      const adhanTime = normalizeWebsiteTime(
        String(
          row.adhan ??
            row.athan ??
            row.athaan ??
            row.azan ??
            row.start ??
            '',
        ),
        name,
      );
      const iqamahTime = normalizeWebsiteTime(
        String(
          row.iqamah ??
            row.iqama ??
            row.iqaamah ??
            row.jamaat ??
            row.congregation ??
            '',
        ),
        name,
      );
      if (adhanTime) adhan[name] = adhanTime;
      if (iqamahTime) iqamah[name] = iqamahTime;
    }
    if (Object.keys(adhan).length >= 3 || Object.keys(iqamah).length >= 3) {
      const flattenedRows = flattenWebsiteData(payload);
      const jummah = [...flattenedRows]
        .filter(([key]) => /(?:jummah|jumuah|jumua)/.test(key))
        .map(([, value]) =>
          normalizeWebsiteTime(String(value ?? ''), 'Dhuhr'),
        )
        .filter(Boolean)
        .filter(time => {
          const minutes = displayTimeMinutes(time);
          return minutes >= 10 * 60 + 30 && minutes <= 17 * 60 + 30;
        })
        .filter((time, index, times) => times.indexOf(time) === index)
        .slice(0, 3);
      return {
        adhan,
        iqamah,
        jummah,
        sourceName: mosque.name,
        sourceUrl,
        sourceLabel: 'Official website · live schedule',
        verified: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  }
  const flattened = flattenWebsiteData(payload);
  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  const aliases: Record<MasjidAyeshaPrayerName, string[]> = {
    Fajr: [
      'fajr',
      'fajer',
      'fajir',
      'fedzr',
      'fedjr',
      'fecr',
      'subh',
      'sobh',
      'subuh',
      'subax',
      'sabah',
      'sabahu',
      'الفجر',
      'فجر',
      'الصبح',
      'صبح',
      'ফজর',
    ],
    Dhuhr: [
      'dhuhr',
      'duhur',
      'duhr',
      'zuhr',
      'zuhur',
      'dzuhur',
      'zohr',
      'dhohr',
      'dhor',
      'ogle',
      'podne',
      'dreke',
      'midi',
      'الظهر',
      'ظهر',
      'ظہر',
      'জোহর',
      'যোহর',
    ],
    Asr: [
      'asr',
      'asar',
      'ashar',
      'casar',
      'ikindi',
      'ikindija',
      'ikindia',
      'العصر',
      'عصر',
      'আসর',
    ],
    Maghrib: [
      'maghrib',
      'maghreb',
      'magrib',
      'maqrib',
      'aksam',
      'aksham',
      'akshami',
      'المغرب',
      'مغرب',
      'মাগরিব',
    ],
    Isha: [
      'isha',
      'ishaa',
      'esha',
      'eshaa',
      'icha',
      'isya',
      'isyak',
      'cisho',
      'yatsi',
      'jacija',
      'jacia',
      'العشاء',
      'عشاء',
      'ইশা',
      'এশা',
    ],
  };
  const adhanRoles = [
    'adhan',
    'adhaan',
    'athan',
    'athaan',
    'azan',
    'azzan',
    'ezan',
    'start',
    'starts',
    'begin',
    'begins',
    'time',
    'timing',
    'heure',
    'horaire',
    'zeit',
    'vakit',
    'waqt',
    'waktu',
    'tiempo',
    'اذان',
    'أذان',
    'وقت',
  ];
  const iqamahRoles = [
    'iqamah',
    'iqama',
    'iqaamah',
    'jamaat',
    'jamat',
    'congregation',
    'kamet',
    'اقامة',
    'إقامة',
    'جماعة',
  ];
  let prayerCount = 0;

  for (const name of masjidAyeshaPrayerNames) {
    const adhanTime = genericWebsiteDataTime(
      flattened,
      aliases[name],
      adhanRoles,
      name,
    );
    const iqamahTime = genericWebsiteDataTime(
      flattened,
      aliases[name],
      iqamahRoles,
      name,
    );
    if (adhanTime) adhan[name] = adhanTime;
    if (iqamahTime) iqamah[name] = iqamahTime;
    if (adhanTime || iqamahTime) prayerCount += 1;
  }

  const jummah = [...flattened]
    .filter(([key]) =>
      /(?:^|_)(?:jummah|jumuah|joumoua|yumuah|cuma|jumat|jumaat|dzuma|xhuma|jimco|الجمعة|جمعه|جمعہ|জুমা)(?:_|$)/.test(
        key,
      ),
    )
    .map(([, value]) => normalizeWebsiteTime(String(value ?? ''), 'Dhuhr'))
    .filter(Boolean)
    .filter(value => {
      const minutes = displayTimeMinutes(value);
      return minutes >= 10 * 60 + 30 && minutes <= 17 * 60 + 30;
    })
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 2);

  if (prayerCount < 3 && !jummah.length) {
    throw new Error('The website prayer data was incomplete.');
  }
  return {
    adhan,
    iqamah,
    jummah,
    sourceName: mosque.name,
    sourceUrl,
    sourceLabel: 'Official website · live schedule',
    verified: true,
    fetchedAt: new Date().toISOString(),
  };
}

function masjidboxDateKey(date: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find(part => part.type === type)?.value ?? '';
    const year = value('year');
    const month = value('month');
    const day = value('day');
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    // Fall back to the device calendar if the mosque timezone is unavailable.
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function masjidboxTime(value: unknown, prayer: MasjidAyeshaPrayerName) {
  const raw = String(value ?? '');
  const timestamp = raw.match(/T(\d{2}):(\d{2})(?::\d{2})?/);
  if (timestamp) {
    return displayClockTime(`${Number(timestamp[1])}:${timestamp[2]}`);
  }
  return normalizeWebsiteTime(raw, prayer);
}

function masjidboxJummahTimes(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .map(time => masjidboxTime(time, 'Dhuhr'))
    .filter(Boolean)
    .filter(time => {
      const minutes = displayTimeMinutes(time);
      return minutes >= 10 * 60 + 30 && minutes <= 17 * 60 + 30;
    })
    .filter((time, index, times) => times.indexOf(time) === index)
    .slice(0, 3);
}

export function parseMasjidboxPrayerScheduleHTML(
  html: string,
  mosque: Mosque,
  sourceUrl: string,
  now = new Date(),
): PublishedMosquePrayerSchedule {
  const encodedState = html.match(
    /(?:window\.)?REDUX_STATE\s*=\s*(['"])([\s\S]*?)\1\s*;/i,
  )?.[2];
  if (!encodedState) {
    throw new Error('The Masjidbox timetable data was not found.');
  }

  let payload: any;
  try {
    const unicodeDecoded = encodedState.replace(
      /%u([0-9a-f]{4})/gi,
      (_, value: string) => String.fromCharCode(Number.parseInt(value, 16)),
    );
    payload = JSON.parse(decodeURIComponent(unicodeDecoded));
  } catch {
    throw new Error('The Masjidbox timetable data could not be read.');
  }

  const published = payload?.masjidbox?.masjidboxAthany;
  const timetable = Array.isArray(published?.timetable)
    ? published.timetable.filter(
        (entry: unknown) => entry && typeof entry === 'object',
      )
    : [];
  if (!timetable.length) {
    throw new Error('The Masjidbox timetable was empty.');
  }

  const timeZone = String(published?.settings?.timezone ?? '');
  const today = masjidboxDateKey(now, timeZone);
  const selected =
    timetable.find(
      (entry: any) => String(entry.date ?? '').slice(0, 10) === today,
    ) ??
    timetable.reduce((closest: any, entry: any) => {
      const distance = Math.abs(new Date(entry.date).getTime() - now.getTime());
      const closestDistance = Math.abs(
        new Date(closest.date).getTime() - now.getTime(),
      );
      return distance < closestDistance ? entry : closest;
    });
  const iqamahData =
    selected.iqamah && typeof selected.iqamah === 'object'
      ? selected.iqamah
      : {};
  const fields: Record<MasjidAyeshaPrayerName, string> = {
    Fajr: 'fajr',
    Dhuhr: 'dhuhr',
    Asr: 'asr',
    Maghrib: 'maghrib',
    Isha: 'isha',
  };
  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};

  for (const name of masjidAyeshaPrayerNames) {
    const field = fields[name];
    const adhanTime = masjidboxTime(selected[field], name);
    const iqamahTime = masjidboxTime(iqamahData[field], name);
    if (adhanTime) adhan[name] = adhanTime;
    if (iqamahTime) iqamah[name] = iqamahTime;
  }

  if (Object.keys(adhan).length < 3 && Object.keys(iqamah).length < 3) {
    throw new Error('The Masjidbox prayer times were incomplete.');
  }
  const iqamahJummah = masjidboxJummahTimes(iqamahData.jumuah);
  const jummah = iqamahJummah.length
    ? iqamahJummah
    : masjidboxJummahTimes(selected.jumuah);

  return {
    adhan,
    iqamah,
    jummah,
    sourceName: String(published?.name ?? mosque.name),
    sourceUrl,
    sourceLabel: 'Official website · Masjidbox',
    verified: published?.verified !== false,
    fetchedAt: new Date().toISOString(),
  };
}

export function extractPrayerDataEndpoints(html: string, sourceUrl: string) {
  let base: URL;
  try {
    base = new URL(sourceUrl);
  } catch {
    return [];
  }
  const baseHost = base.hostname.toLowerCase().replace(/^www\./, '');
  const endpoints: string[] = [];
  const fetchCalls = /\bfetch\s*\(\s*(["'`])([^"'`]+)\1/gi;

  for (const match of html.matchAll(fetchCalls)) {
    const rawUrl = match[2].replace(/&amp;/gi, '&').trim();
    if (!websiteScheduleWords.test(rawUrl)) continue;
    try {
      const endpoint = new URL(rawUrl, base);
      if (
        !/^https?:$/.test(endpoint.protocol) ||
        endpoint.hostname.toLowerCase().replace(/^www\./, '') !== baseHost ||
        endpoints.includes(endpoint.href)
      ) {
        continue;
      }
      endpoints.push(endpoint.href);
    } catch {
      // Ignore dynamic templates and malformed data URLs.
    }
  }
  return endpoints.slice(0, 4);
}

export function extractWebsiteScriptLinks(html: string, sourceUrl: string) {
  let base: URL;
  try {
    base = new URL(sourceUrl);
  } catch {
    return [];
  }
  const host = base.hostname.toLocaleLowerCase().replace(/^www\./, '');
  const scripts: string[] = [];
  for (const tag of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi)) {
    const raw = (tag[1] ?? tag[2] ?? tag[3] ?? '').replace(/&amp;/gi, '&');
    try {
      const resolved = new URL(raw, base);
      if (
        resolved.protocol !== 'https:' ||
        resolved.hostname.toLocaleLowerCase().replace(/^www\./, '') !== host ||
        !/\.m?js(?:$|[?#])/i.test(resolved.href) ||
        scripts.includes(resolved.href)
      ) {
        continue;
      }
      scripts.push(resolved.href);
    } catch {
      // Ignore malformed script URLs.
    }
  }
  return scripts.slice(0, 4);
}

export function extractPrayerScheduleLinks(html: string, sourceUrl: string) {
  const links: string[] = [];
  const anchors =
    /<a\b[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;

  let base: URL;
  try {
    base = new URL(sourceUrl);
  } catch {
    return links;
  }
  const baseHost = base.hostname.toLowerCase().replace(/^www\./, '');
  const trustedWidgetHost =
    /^(?:timing\.)?athanplus\.com$|^(?:www\.)?mymasjidal\.com$|^(?:www\.)?masjidal\.com$|^(?:www\.)?mawaqit\.net$|^(?:www\.)?masjidbox\.com$/i;

  for (const match of html.matchAll(anchors)) {
    const rawHref = (match[1] ?? match[2] ?? match[3] ?? '')
      .replace(/&amp;/gi, '&')
      .trim();
    const linkText = websiteHtmlToText(match[4] ?? '');
    if (
      !rawHref ||
      (!websiteScheduleWords.test(rawHref) &&
        !websiteScheduleWords.test(linkText))
    ) {
      continue;
    }
    try {
      const resolved = new URL(rawHref, base);
      const resolvedHost = resolved.hostname
        .toLowerCase()
        .replace(/^www\./, '');
      const trustedWidget = trustedWidgetHost.test(
        resolved.hostname.toLowerCase(),
      );
      if (
        !/^https?:$/.test(resolved.protocol) ||
        (resolvedHost !== baseHost && !trustedWidget) ||
        resolved.href === base.href ||
        links.includes(resolved.href)
      ) {
        continue;
      }
      if (trustedWidget) links.unshift(resolved.href);
      else links.push(resolved.href);
    } catch {
      // Ignore malformed or non-web links from the mosque site.
    }
  }

  const embeddedTags = /<(?:iframe|embed)\b[^>]*>/gi;
  for (const match of html.matchAll(embeddedTags)) {
    const tag = match[0];
    const source = tag.match(/\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
    const rawSource = (source?.[1] ?? source?.[2] ?? source?.[3] ?? '')
      .replace(/&amp;/gi, '&')
      .trim();
    if (!rawSource) continue;
    try {
      const resolved = new URL(rawSource, base);
      const resolvedHost = resolved.hostname.toLowerCase();
      const sameHost = resolvedHost.replace(/^www\./, '') === baseHost;
      const describesPrayerSchedule =
        websiteScheduleWords.test(rawSource) || websiteScheduleWords.test(tag);
      if (
        resolved.protocol !== 'https:' ||
        (!sameHost &&
          !trustedWidgetHost.test(resolvedHost) &&
          !describesPrayerSchedule) ||
        links.includes(resolved.href)
      ) {
        continue;
      }
      if (trustedWidgetHost.test(resolvedHost)) links.unshift(resolved.href);
      else links.push(resolved.href);
    } catch {
      // Ignore malformed or non-web embedded sources.
    }
  }

  const encodedEmbedAttributes = /\bdata-code\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of html.matchAll(encodedEmbedAttributes)) {
    const decodedEmbed = (match[1] ?? match[2] ?? '')
      .replace(/&quot;|&#0*34;/gi, '"')
      .replace(/&apos;|&#0*39;/gi, "'")
      .replace(/&lt;|&#0*60;/gi, '<')
      .replace(/&gt;|&#0*62;/gi, '>')
      .replace(/&amp;/gi, '&');
    const source = decodedEmbed.match(
      /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i,
    );
    const rawSource = (source?.[1] ?? source?.[2] ?? source?.[3] ?? '').trim();
    if (!rawSource) continue;
    try {
      const resolved = new URL(rawSource, base);
      const resolvedHost = resolved.hostname.toLowerCase();
      if (
        resolved.protocol !== 'https:' ||
        !trustedWidgetHost.test(resolvedHost) ||
        links.includes(resolved.href)
      ) {
        continue;
      }
      links.unshift(resolved.href);
    } catch {
      // Ignore malformed custom embed HTML.
    }
  }

  return links.slice(0, 6);
}

export function parsePublishedMosqueWebsiteHTML(
  html: string,
  mosque: Mosque,
): PublishedMosquePrayerSchedule {
  const text = websiteHtmlToText(html);
  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  let publishedPrayerCount = 0;

  for (const name of masjidAyeshaPrayerNames) {
    const semanticAdhan = semanticWebsiteTime(html, name, 'adhan');
    const semanticIqamah = semanticWebsiteTime(html, name, 'iqamah');
    if (semanticAdhan) adhan[name] = semanticAdhan;
    if (semanticIqamah) iqamah[name] = semanticIqamah;

    const segment = websitePrayerSegment(text, name);
    const times = [...segment.matchAll(websiteTimePattern)]
      .map(match => normalizeWebsiteTime(match[0], name))
      .filter(Boolean);
    if (!adhan[name] && times.length >= 2) adhan[name] = times[0];
    if (!iqamah[name] && times.length >= 2) iqamah[name] = times[1];
    else if (!iqamah[name] && times.length === 1) iqamah[name] = times[0];
    if (adhan[name] || iqamah[name]) publishedPrayerCount += 1;
  }

  const jummah = extractPublishedJummahTimes(text, mosque.name);
  if (publishedPrayerCount < 3 && !jummah.length) {
    throw new Error('No complete published schedule was found on the website.');
  }

  return {
    adhan,
    iqamah,
    jummah,
    sourceName: mosque.name,
    sourceUrl: mosque.website ?? '',
    sourceLabel: 'Official website',
    verified: true,
    fetchedAt: new Date().toISOString(),
  };
}

export function parseAthanPlusPrayerScheduleHTML(
  html: string,
  mosque: Mosque,
  sourceUrl: string,
): PublishedMosquePrayerSchedule {
  const activeTableId =
    html.match(
      /<div\b[^>]*class\s*=\s*["'][^"']*carousel-item[^"']*\bactive\b[^"']*["'][^>]*data-id\s*=\s*["'](\d+)["']/i,
    )?.[1] ?? '0';
  const tableStartPattern = new RegExp(
    `<div\\b[^>]*\\bid\\s*=\\s*["']table_div_${activeTableId}["'][^>]*>`,
    'i',
  );
  const tableStart = tableStartPattern.exec(html);
  if (!tableStart || tableStart.index === undefined) {
    throw new Error('The Athan+ timetable for today was not found.');
  }
  const sectionStart = tableStart.index;
  const remaining = html.slice(sectionStart + tableStart[0].length);
  const nextTableIndex = remaining.search(
    /<div\b[^>]*\bid\s*=\s*["']table_div_\d+["'][^>]*>/i,
  );
  const section = html.slice(
    sectionStart,
    nextTableIndex < 0
      ? html.length
      : sectionStart + tableStart[0].length + nextTableIndex,
  );
  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  const rows = [...section.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  let publishedPrayerCount = 0;
  for (const name of masjidAyeshaPrayerNames) {
    const row = rows.find(match =>
      new RegExp(`\\b(?:${websitePrayerAliases[name]})\\b`, 'i').test(
        websiteHtmlToText(match[1]),
      ),
    );
    if (!row) continue;
    const times = [...websiteHtmlToText(row[1]).matchAll(websiteTimePattern)]
      .map(match => normalizeWebsiteTime(match[0], name))
      .filter(Boolean);
    if (times.length >= 2) {
      adhan[name] = times[0];
      iqamah[name] = times[1];
      publishedPrayerCount += 1;
    } else if (times.length === 1) {
      iqamah[name] = times[0];
      publishedPrayerCount += 1;
    }
  }
  if (publishedPrayerCount < 3) {
    throw new Error('The Athan+ timetable for today was incomplete.');
  }
  const jummah = extractPublishedJummahTimes(
    websiteHtmlToText(section),
    mosque.name,
  );
  return {
    adhan,
    iqamah,
    jummah,
    sourceName: mosque.name,
    sourceUrl,
    sourceLabel: 'Official website · Athan+',
    verified: true,
    fetchedAt: new Date().toISOString(),
  };
}

function datePartsInTimeZone(date: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find(part => part.type === type)?.value);
    const year = value('year');
    const month = value('month');
    const day = value('day');
    if (year && month && day) return { year, month, day };
  } catch {
    // Fall back to the device calendar if the published timezone is invalid.
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function parseMawaqitPrayerScheduleHTML(
  html: string,
  mosque: Mosque,
  sourceUrl: string,
  date = new Date(),
): PublishedMosquePrayerSchedule {
  const confDataJSON = html.match(
    /\bvar\s+confData\s*=\s*(\{[\s\S]*?\})\s*;\s*var\s+isMosque\b/i,
  )?.[1];
  if (!confDataJSON) {
    throw new Error('The MAWAQIT mosque schedule was missing.');
  }

  let confData: any;
  try {
    confData = JSON.parse(confDataJSON);
  } catch {
    throw new Error('The MAWAQIT mosque schedule could not be read.');
  }
  const publishedLatitude = Number(confData.latitude);
  const publishedLongitude = Number(confData.longitude);
  const publishedDistance =
    Number.isFinite(publishedLatitude) && Number.isFinite(publishedLongitude)
      ? distanceKm(mosque, {
          latitude: publishedLatitude,
          longitude: publishedLongitude,
        })
      : Number.POSITIVE_INFINITY;
  if (
    mosqueNameScore(mosque.name, String(confData.name ?? '')) < 0.4 &&
    publishedDistance > 1.5
  ) {
    throw new Error('The MAWAQIT timetable belongs to a different mosque.');
  }
  const dateParts = datePartsInTimeZone(date, String(confData.timezone ?? ''));
  const publishedTimes =
    confData.calendar?.[dateParts.month - 1]?.[String(dateParts.day)];
  const publishedIqamah =
    confData.iqamaCalendar?.[dateParts.month - 1]?.[String(dateParts.day)];
  if (!Array.isArray(publishedTimes) || publishedTimes.length < 6) {
    throw new Error("Today's MAWAQIT adhan schedule was unavailable.");
  }

  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  const positions: Record<MasjidAyeshaPrayerName, number> = {
    Fajr: 0,
    Dhuhr: 2,
    Asr: 3,
    Maghrib: 4,
    Isha: 5,
  };
  for (const [iqamahIndex, name] of masjidAyeshaPrayerNames.entries()) {
    const adhanTime = normalizeWebsiteTime(
      String(publishedTimes[positions[name]] ?? ''),
      name,
    );
    if (!adhanTime) continue;
    adhan[name] = adhanTime;

    const iqamahRule = String(publishedIqamah?.[iqamahIndex] ?? '').trim();
    const offset = iqamahRule.match(/^([+-])(\d{1,3})$/);
    const iqamahTime = offset
      ? addMinutesToDisplayTime(
          adhanTime,
          Number(offset[2]) * (offset[1] === '-' ? -1 : 1),
        )
      : normalizeWebsiteTime(iqamahRule, name);
    if (iqamahTime) iqamah[name] = iqamahTime;
  }
  if (
    Object.keys(adhan).length !== masjidAyeshaPrayerNames.length ||
    Object.keys(iqamah).length < 3
  ) {
    throw new Error("Today's MAWAQIT mosque schedule was incomplete.");
  }

  const jummah = [confData.jumua, confData.jumua2, confData.jumua3]
    .map(value => normalizeWebsiteTime(String(value ?? ''), 'Dhuhr'))
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3);

  return {
    adhan,
    iqamah,
    jummah,
    sourceName: mosque.name,
    sourceUrl,
    sourceLabel: 'Official website · MAWAQIT',
    verified: true,
    fetchedAt: new Date().toISOString(),
  };
}

export function parseFiveTimesSchedulePayload(
  payload: any,
  mosque: Mosque,
): PublishedMosquePrayerSchedule {
  const published = Array.isArray(payload?.prayers) ? payload.prayers[0] : null;
  if (!published || typeof published !== 'object') {
    throw new Error('The official 5Times schedule was missing.');
  }

  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  const fieldNames: Record<MasjidAyeshaPrayerName, string> = {
    Fajr: 'fajr',
    Dhuhr: 'dhuhr',
    Asr: 'asr',
    Maghrib: 'maghrib',
    Isha: 'isha',
  };
  let prayerCount = 0;
  for (const name of masjidAyeshaPrayerNames) {
    const fieldName = fieldNames[name];
    const adhanTime = normalizeWebsiteTime(
      String(published[`${fieldName}_adhan`] ?? ''),
      name,
    );
    const iqamahTime = normalizeWebsiteTime(
      String(published[`${fieldName}_iqama`] ?? ''),
      name,
    );
    if (adhanTime) adhan[name] = adhanTime;
    if (iqamahTime) iqamah[name] = iqamahTime;
    if (adhanTime || iqamahTime) prayerCount += 1;
  }
  if (prayerCount < 3) {
    throw new Error('The official 5Times daily schedule was incomplete.');
  }

  const jummah = [published.jumuah_1, published.jumuah_2, published.jumuah_3]
    .map(value => normalizeWebsiteTime(String(value ?? ''), 'Dhuhr'))
    .filter(Boolean)
    .filter(value => {
      const minutes = displayTimeMinutes(value);
      return minutes >= 10 * 60 + 30 && minutes <= 17 * 60 + 30;
    })
    .slice(0, 3);

  return {
    adhan,
    iqamah,
    jummah,
    sourceName: mosque.name,
    sourceUrl: 'https://5times.vercel.app/',
    sourceLabel: 'Official 5Times app',
    verified: true,
    fetchedAt: new Date().toISOString(),
  };
}

export function parseAlFaruqPrayerTimesPayload(
  payload: any,
  mosque: Mosque,
  date = new Date(),
): PublishedMosquePrayerSchedule {
  const prayerTimes = Array.isArray(payload) ? payload : [];
  const published = prayerTimes.find(
    item =>
      Number(item?.date) === date.getDate() &&
      Number(item?.month) === date.getMonth() + 1 &&
      Number(item?.year) === date.getFullYear(),
  );
  if (!published) {
    throw new Error("Today's Al Faruq schedule was not available.");
  }

  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  const fields: Record<MasjidAyeshaPrayerName, string> = {
    Fajr: 'fajr',
    Dhuhr: 'zuhr',
    Asr: 'asr',
    Maghrib: 'maghrib',
    Isha: 'isha',
  };
  let prayerCount = 0;

  for (const name of masjidAyeshaPrayerNames) {
    const prayer = published[fields[name]];
    const adhanTime = normalizeWebsiteTime(String(prayer?.azzan ?? ''), name);
    const iqamahTime = normalizeWebsiteTime(String(prayer?.iqamah ?? ''), name);
    if (adhanTime) adhan[name] = adhanTime;
    if (iqamahTime) iqamah[name] = iqamahTime;
    if (adhanTime && iqamahTime) prayerCount += 1;
  }

  if (prayerCount !== masjidAyeshaPrayerNames.length) {
    throw new Error("Today's Al Faruq schedule was incomplete.");
  }

  return {
    adhan,
    iqamah,
    jummah: [],
    sourceName: mosque.name,
    sourceUrl: AL_FARUQ_CENTRE_PRAYER_TIMES_URL,
    sourceLabel: 'Official website · live schedule',
    verified: true,
    fetchedAt: new Date().toISOString(),
  };
}

export function parsePublishedMosquePDFText(
  text: string,
  mosque: Mosque,
  sourceUrl: string,
  date = new Date(),
): PublishedMosquePrayerSchedule {
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    date,
  );
  const sectionStart = text.search(
    new RegExp(
      `Prayer Times\\s*[-–—]\\s*${monthName}\\s+${date.getFullYear()}`,
      'i',
    ),
  );
  if (sectionStart < 0) {
    throw new Error('The current month was not found in the official PDF.');
  }
  const remainingText = text.slice(sectionStart);
  const nextSection = remainingText
    .slice(20)
    .search(/Prayer Times\s*[-–—]\s*[A-Za-z]+\s+\d{4}/i);
  const monthSection = remainingText.slice(
    0,
    nextSection < 0 ? remainingText.length : nextSection + 20,
  );
  const day = date.getDate();
  const row = monthSection.match(
    new RegExp(
      `(?:^|\\n)\\s*${day}\\s+(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\\s+((?:(?:\\d{1,2}:\\d{2})\\s*){11})`,
      'i',
    ),
  );
  const times = row?.[1].match(/\b\d{1,2}:\d{2}\b/g) ?? [];
  if (times.length < 11) {
    throw new Error('Today’s row was not found in the official PDF timetable.');
  }

  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  const positions: Record<MasjidAyeshaPrayerName, [number, number]> = {
    Fajr: [0, 1],
    Dhuhr: [3, 4],
    Asr: [5, 6],
    Maghrib: [7, 8],
    Isha: [9, 10],
  };
  for (const name of masjidAyeshaPrayerNames) {
    const [adhanIndex, iqamahIndex] = positions[name];
    adhan[name] = normalizeWebsiteTime(times[adhanIndex], name);
    iqamah[name] = normalizeWebsiteTime(times[iqamahIndex], name);
  }

  const jummahText =
    monthSection.match(/Jum(?:u['’]?ah|ua|mah)[\s\S]{0,220}/i)?.[0] ?? '';
  const jummah = [...jummahText.matchAll(websiteTimePattern)]
    .map(match => normalizeWebsiteTime(match[0], 'Dhuhr'))
    .filter(Boolean)
    .filter(value => {
      const minutes = displayTimeMinutes(value);
      return minutes >= 10 * 60 + 30 && minutes <= 17 * 60 + 30;
    })
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 2);

  return {
    adhan,
    iqamah,
    jummah,
    sourceName: mosque.name,
    sourceUrl,
    sourceLabel: 'Official PDF timetable',
    verified: true,
    fetchedAt: new Date().toISOString(),
  };
}

export function parseAlKafeelKarbalaPrayerPayload(
  payload: unknown,
  mosque: Mosque,
): PublishedMosquePrayerSchedule {
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row !== 'object') {
    throw new Error('The official Karbala prayer timetable was empty.');
  }
  const values = row as Record<string, unknown>;
  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const fajr = normalizeWebsiteTime(String(values.fajer ?? ''), 'Fajr');
  const dhuhr = normalizeWebsiteTime(String(values.noon ?? ''), 'Dhuhr');
  const maghrib = normalizeWebsiteTime(String(values.ghrob ?? ''), 'Maghrib');
  if (fajr) adhan.Fajr = fajr;
  if (dhuhr) adhan.Dhuhr = dhuhr;
  if (maghrib) adhan.Maghrib = maghrib;
  if (Object.keys(adhan).length < 3) {
    throw new Error('The official Karbala prayer timetable was incomplete.');
  }
  return {
    adhan,
    iqamah: {},
    jummah: [],
    sourceName: 'Al-Kafeel · Karbala city timetable',
    sourceUrl: AL_KAFEEL_WEBSITE_URL,
    sourceLabel: 'Official Karbala city adhan times',
    verified: true,
    coverageNote:
      `${mosque.name} has not published mosque-specific iqamah times. ` +
      'Al-Kafeel currently publishes Karbala times for Fajr, Dhuhr, and Maghrib only; missing prayers remain blank.',
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchAlKafeelKarbalaPrayerSchedule(mosque: Mosque) {
  const response = await fetchWithTimeout(AL_KAFEEL_KARBALA_PRAYER_API, 10000);
  if (!response.ok) {
    throw new Error('The official Karbala prayer source could not be reached.');
  }
  return parseAlKafeelKarbalaPrayerPayload(await response.json(), mosque);
}

async function fetchFiveTimesSchedule(mosque: Mosque) {
  const response = await fetchWithTimeout(
    'https://5times.vercel.app/api/prayer',
    8000,
  );
  if (!response.ok)
    throw new Error('The official 5Times app could not be reached.');
  return parseFiveTimesSchedulePayload(await response.json(), mosque);
}

async function fetchAlFaruqPrayerSchedule(mosque: Mosque) {
  const response = await fetchWithTimeout(
    AL_FARUQ_CENTRE_PRAYER_TIMES_API,
    8000,
  );
  if (!response.ok) {
    throw new Error("Al Faruq Centre's live schedule could not be reached.");
  }
  return parseAlFaruqPrayerTimesPayload(await response.json(), mosque);
}

function isMasjidAyesha(mosque: Mosque) {
  return (
    /masjidayesha\.ca/i.test(mosque.website ?? '') ||
    (/\b(?:masjid\s+)?ayesha\b/i.test(mosque.name) &&
      /edmonton/i.test(mosque.address))
  );
}

function isAlFaruqCentre(mosque: Mosque) {
  return (
    /alfaruqcentre\.com/i.test(mosque.website ?? '') ||
    (/\bal[\s-]?faruq\b/i.test(mosque.name) && /edmonton/i.test(mosque.address))
  );
}

function isAthanPlusScheduleUrl(url: string) {
  try {
    return /^(?:timing\.)?athanplus\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isMawaqitScheduleUrl(url: string) {
  try {
    return /^(?:www\.)?mawaqit\.net$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isMasjidboxScheduleUrl(url: string) {
  try {
    return /^(?:www\.)?masjidbox\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isAlKafeelScheduleUrl(url: string) {
  try {
    return /^(?:www\.)?alkafeel\.net$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function decodeWebsiteSearchValue(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, valueHex: string) =>
      String.fromCodePoint(Number.parseInt(valueHex, 16)),
    )
    .replace(/&#(\d+);/g, (_, valueDecimal: string) =>
      String.fromCodePoint(Number(valueDecimal)),
    );
}

function isRejectedWebsiteSearchHost(hostname: string) {
  const host = hostname.toLocaleLowerCase().replace(/^www\./, '');
  return (
    /^(?:duckduckgo|google|bing|yahoo)\./.test(host) ||
    /^(?:m\.)?(?:facebook|instagram|youtube|twitter|x|tiktok|linkedin)\.com$/.test(
      host,
    ) ||
    /(?:^|\.)(?:yelp|mapquest|yellowpages|findglocal|canada-listing|informalberta|timesofsalah|globalprayertimes|prayersconnect|prayercalctime|islamicfinder|muslimandquran|salatomatic|esalah|jammat|masjidway|mapcarta|tripadvisor|waze|wikipedia|praysalat|cybo|travelsetu|adequatetravel|ancient-history-sites|islamicdates|muslimapp|alummahai|prayer-times)\./.test(
      host,
    ) ||
    /(?:^|\.)(?:211\.ca|maps\.apple\.com)$/.test(host)
  );
}

export function extractMosqueWebsiteSearchCandidates(html: string) {
  const candidates: string[] = [];
  for (const anchor of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
    if (!/\bclass\s*=\s*["'][^"']*\bresult__a\b/i.test(anchor[0])) continue;
    const href = anchor[0].match(
      /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i,
    );
    let value = decodeWebsiteSearchValue(
      href?.[1] ?? href?.[2] ?? href?.[3] ?? '',
    );
    if (!value) continue;
    if (value.startsWith('//')) value = `https:${value}`;

    try {
      let parsed = new URL(value);
      if (/^(?:www\.)?duckduckgo\.com$/i.test(parsed.hostname)) {
        const redirected = parsed.searchParams.get('uddg');
        if (!redirected) continue;
        parsed = new URL(redirected);
      }
      if (
        !/^https?:$/.test(parsed.protocol) ||
        isRejectedWebsiteSearchHost(parsed.hostname)
      ) {
        continue;
      }
      const candidate = parsed.href;
      if (!candidates.includes(candidate)) candidates.push(candidate);
    } catch {
      // Ignore malformed or non-web search results.
    }
  }
  return candidates.slice(0, 5);
}

export function extractBingWebsiteSearchCandidates(xml: string) {
  const candidates: string[] = [];
  for (const item of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const link = item[1].match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? '';
    const value = decodeWebsiteSearchValue(link.trim());
    try {
      const parsed = new URL(value);
      if (
        !/^https?:$/.test(parsed.protocol) ||
        isRejectedWebsiteSearchHost(parsed.hostname) ||
        candidates.includes(parsed.href)
      ) {
        continue;
      }
      candidates.push(parsed.href);
    } catch {
      // Ignore invalid RSS search result URLs.
    }
  }
  return candidates.slice(0, 5);
}

export function mosqueCity(mosque: Mosque) {
  const parts = mosque.address
    .split(/[,،]/)
    .map(part => part.trim())
    .filter(Boolean);
  return (
    [...parts].reverse().find(part => {
      if (/\d/.test(part)) return false;
      if (
        /^(?:canada|united states(?: of america)?|usa|uk|united kingdom|england|iraq|العراق)$/i.test(
          part,
        )
      ) {
        return false;
      }
      if (
        /(?:^|\s)(?:governorate|province|region|state|county|district|prefecture|محافظة|ولاية|منطقة|اقليم|إقليم)(?:\s|$)/i.test(
          part,
        )
      ) {
        return false;
      }
      if (
        /^(?:AB|Alberta|BC|British Columbia|MB|Manitoba|NB|New Brunswick|NL|Newfoundland(?: and Labrador)?|NS|Nova Scotia|NT|Northwest Territories|NU|Nunavut|ON|Ontario|PE|Prince Edward Island|QC|Quebec|SK|Saskatchewan|YT|Yukon)$/i.test(
          part,
        )
      ) {
        return false;
      }
      return !/^[A-Z]{2}$/i.test(part);
    }) ?? ''
  );
}

function isKarbalaMosque(mosque: Mosque) {
  return /(?:karbala|كربلاء)/i.test(
    normalizeLocalizedWebsiteText(`${mosque.name} ${mosque.address}`),
  );
}

function normalizedIdentityText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim();
}

function containsNormalizedPhrase(text: string, phrase: string) {
  return Boolean(phrase) && ` ${text} `.includes(` ${phrase} `);
}

export function websiteMatchesSelectedMosque(html: string, mosque: Mosque) {
  const pageText = websiteHtmlToText(html);
  const identityHTML = [
    ...[...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)]
      .slice(0, 4)
      .map(match => match[1]),
    ...[...html.matchAll(/<h[1-2]\b[^>]*>([\s\S]*?)<\/h[1-2]>/gi)]
      .slice(0, 8)
      .map(match => match[1]),
  ].join(' ');
  const identityText = normalizedIdentityText(websiteHtmlToText(identityHTML));
  const normalizedPageText = normalizedIdentityText(pageText);
  const normalizedName = normalizedMosqueName(mosque.name);
  const nameTokens = normalizedName.split(' ').filter(Boolean);
  const pageTokens = new Set(normalizedPageText.split(' ').filter(Boolean));
  const tokenCoverage = nameTokens.length
    ? nameTokens.filter(token => pageTokens.has(token)).length /
      nameTokens.length
    : 0;
  const exactIdentityMatch = containsNormalizedPhrase(
    identityText,
    normalizedName,
  );
  const exactPageMatch = containsNormalizedPhrase(
    normalizedPageText,
    normalizedName,
  );

  if (exactIdentityMatch) return true;

  return (
    (exactPageMatch || tokenCoverage >= 0.75) &&
    websiteLocationMatchesSelectedMosque(html, mosque)
  );
}

export function websiteLocationMatchesSelectedMosque(
  html: string,
  mosque: Mosque,
) {
  const pageText = websiteHtmlToText(html);
  const normalizedPageText = normalizedIdentityText(pageText);
  const city = normalizedIdentityText(mosqueCity(mosque));
  const postalCode = mosque.address.match(/\b([A-Z]\d[A-Z])\s?(\d[A-Z]\d)\b/i);
  const normalizedPostalCode = postalCode
    ? `${postalCode[1]}${postalCode[2]}`.toLocaleLowerCase()
    : '';
  const compactPageText = pageText.toLocaleLowerCase().replace(/\s+/g, '');
  const streetNumber = mosque.address.match(/\b(\d{3,6})\b/)?.[1] ?? '';
  return (
    containsNormalizedPhrase(normalizedPageText, city) ||
    Boolean(
      normalizedPostalCode && compactPageText.includes(normalizedPostalCode),
    ) ||
    Boolean(streetNumber && pageText.includes(streetNumber))
  );
}

async function fetchOfficialMosqueWebsiteSchedule(
  mosque: Mosque,
  websiteOverride?: string,
  allowLocationIdentity = false,
) {
  const sourceUrl =
    websiteOverride ??
    (isMasjidAyesha(mosque)
      ? MASJID_AYESHA_PRAYER_TIMES_URL
      : isAlFaruqCentre(mosque)
      ? AL_FARUQ_CENTRE_WEBSITE_URL
      : mosque.website);
  if (!sourceUrl)
    throw new Error('This masjid has no official website listed.');
  const response = await fetchWithTimeout(sourceUrl, 10000);
  if (!response.ok)
    throw new Error('The official website could not be reached.');
  const html = await response.text();
  const resolvedSourceUrl = response.url || sourceUrl;
  const knownMasjidAyeshaSource = /(?:^|\.)masjidayesha\.ca$/i.test(
    new URL(resolvedSourceUrl).hostname,
  );
  const knownAlFaruqSource = /(?:^|\.)alfaruqcentre\.com$/i.test(
    new URL(resolvedSourceUrl).hostname,
  );
  const knownAlKafeelKarbalaSource =
    isAlKafeelScheduleUrl(resolvedSourceUrl) && isKarbalaMosque(mosque);
  if (
    !knownMasjidAyeshaSource &&
    !knownAlFaruqSource &&
    !knownAlKafeelKarbalaSource &&
    !isAthanPlusScheduleUrl(resolvedSourceUrl) &&
    !isMawaqitScheduleUrl(resolvedSourceUrl) &&
    !isMasjidboxScheduleUrl(resolvedSourceUrl) &&
    !websiteMatchesSelectedMosque(html, mosque) &&
    !(
      allowLocationIdentity &&
      websiteLocationMatchesSelectedMosque(html, mosque)
    )
  ) {
    throw new Error('The listed website belongs to a different organization.');
  }
  if (knownMasjidAyeshaSource) {
    return parseMasjidAyeshaPrayerScheduleHTML(html);
  }
  if (knownAlKafeelKarbalaSource) {
    return fetchAlKafeelKarbalaPrayerSchedule(mosque);
  }

  if (isAthanPlusScheduleUrl(resolvedSourceUrl)) {
    return parseAthanPlusPrayerScheduleHTML(html, mosque, resolvedSourceUrl);
  }
  if (isMawaqitScheduleUrl(resolvedSourceUrl)) {
    return parseMawaqitPrayerScheduleHTML(html, mosque, resolvedSourceUrl);
  }
  if (isMasjidboxScheduleUrl(resolvedSourceUrl)) {
    return parseMasjidboxPrayerScheduleHTML(html, mosque, resolvedSourceUrl);
  }
  const schedules: PublishedMosquePrayerSchedule[] = [];
  try {
    schedules.push(
      parsePublishedMosqueWebsiteHTML(html, {
        ...mosque,
        website: resolvedSourceUrl,
      }),
    );
  } catch {
    // A homepage often links to the schedule instead of containing it.
  }
  for (const payload of extractEmbeddedPrayerScheduleData(html)) {
    try {
      schedules.push(
        parsePublishedMosqueWebsiteData(payload, mosque, resolvedSourceUrl),
      );
    } catch {
      // Most embedded JSON is unrelated page data.
    }
  }

  const discoveredScheduleLinks = extractPrayerScheduleLinks(
    html,
    resolvedSourceUrl,
  );
  const athanPlusLink = discoveredScheduleLinks.find(isAthanPlusScheduleUrl);
  const linkedScheduleLinks = athanPlusLink
    ? [athanPlusLink]
    : discoveredScheduleLinks.slice(0, 4);
  const linkedScheduleRequests = linkedScheduleLinks.map(async link => {
    const linkedResponse = await fetchWithTimeout(link, 8000);
    if (!linkedResponse.ok) throw new Error('Prayer schedule page failed.');
    const linkedSourceUrl = linkedResponse.url || link;
    const contentType = linkedResponse.headers.get('content-type') ?? '';
    if (
      /application\/pdf/i.test(contentType) ||
      /\.pdf(?:$|[?#])/i.test(linkedSourceUrl)
    ) {
      if (Platform.OS !== 'ios' || !NativeAppleMapsSearch) {
        throw new Error('PDF timetable reading is currently available on iOS.');
      }
      return parsePublishedMosquePDFText(
        await NativeAppleMapsSearch.extractPdfText(linkedSourceUrl),
        mosque,
        linkedSourceUrl,
      );
    }
    const linkedHTML = await linkedResponse.text();
    if (isAthanPlusScheduleUrl(linkedSourceUrl)) {
      return parseAthanPlusPrayerScheduleHTML(
        linkedHTML,
        mosque,
        linkedSourceUrl,
      );
    }
    if (isMawaqitScheduleUrl(linkedSourceUrl)) {
      return parseMawaqitPrayerScheduleHTML(
        linkedHTML,
        mosque,
        linkedSourceUrl,
      );
    }
    if (isMasjidboxScheduleUrl(linkedSourceUrl)) {
      return parseMasjidboxPrayerScheduleHTML(
        linkedHTML,
        mosque,
        linkedSourceUrl,
      );
    }
    if (isAlKafeelScheduleUrl(linkedSourceUrl) && isKarbalaMosque(mosque)) {
      return fetchAlKafeelKarbalaPrayerSchedule(mosque);
    }
    return parsePublishedMosqueWebsiteHTML(linkedHTML, {
      ...mosque,
      website: linkedSourceUrl,
    });
  });
  for (const endpoint of extractPrayerDataEndpoints(html, resolvedSourceUrl)) {
    linkedScheduleRequests.push(
      (async () => {
        const dataResponse = await fetchWithTimeout(endpoint, 8000);
        if (!dataResponse.ok) {
          throw new Error('The website prayer data request failed.');
        }
        return parsePublishedMosqueWebsiteData(
          await dataResponse.json(),
          mosque,
          dataResponse.url || endpoint,
        );
      })(),
    );
  }
  for (const scriptUrl of extractWebsiteScriptLinks(html, resolvedSourceUrl)) {
    linkedScheduleRequests.push(
      (async () => {
        const scriptResponse = await fetchWithTimeout(scriptUrl, 10000);
        if (!scriptResponse.ok) {
          throw new Error('The mosque website application could not be read.');
        }
        const script = await scriptResponse.text();
        const endpoints = extractPrayerDataEndpoints(script, resolvedSourceUrl);
        if (!endpoints.length) {
          throw new Error('No prayer data endpoint was found in the website app.');
        }
        const endpointResults = await Promise.allSettled(
          endpoints.map(async endpoint => {
            const dataResponse = await fetchWithTimeout(endpoint, 8000);
            if (!dataResponse.ok) {
              throw new Error('The website prayer data request failed.');
            }
            return parsePublishedMosqueWebsiteData(
              await dataResponse.json(),
              mosque,
              dataResponse.url || endpoint,
            );
          }),
        );
        const success = endpointResults.find(
          result => result.status === 'fulfilled',
        );
        if (success?.status === 'fulfilled') return success.value;
        throw new Error('The website prayer data was incomplete.');
      })(),
    );
  }
  if (knownAlFaruqSource) {
    linkedScheduleRequests.push(fetchAlFaruqPrayerSchedule(mosque));
  }
  if (/https?:\/\/5times\.vercel\.app\b/i.test(html)) {
    linkedScheduleRequests.push(fetchFiveTimesSchedule(mosque));
  }
  const linkedResults = await Promise.allSettled(linkedScheduleRequests);
  for (const result of linkedResults) {
    if (result.status === 'fulfilled') schedules.push(result.value);
  }

  if (!schedules.length && Platform.OS === 'ios' && NativeAppleMapsSearch) {
    try {
      const renderedHTML =
        await NativeAppleMapsSearch.extractRenderedWebsiteHTML(
          resolvedSourceUrl,
        );
      if (
        !websiteMatchesSelectedMosque(renderedHTML, mosque) &&
        !(
          allowLocationIdentity &&
          websiteLocationMatchesSelectedMosque(renderedHTML, mosque)
        )
      ) {
        throw new Error(
          'The rendered website belongs to another organization.',
        );
      }
      try {
        schedules.push(
          parsePublishedMosqueWebsiteHTML(renderedHTML, {
            ...mosque,
            website: resolvedSourceUrl,
          }),
        );
      } catch {
        // The rendered page may expose its timetable as JSON instead of text.
      }
      for (const payload of extractEmbeddedPrayerScheduleData(renderedHTML)) {
        try {
          schedules.push(
            parsePublishedMosqueWebsiteData(payload, mosque, resolvedSourceUrl),
          );
        } catch {
          // Ignore unrelated rendered application state.
        }
      }
    } catch {
      // Continue to the next verified website candidate.
    }
  }

  if (!schedules.length) {
    throw new Error('No published schedule was found on the official website.');
  }

  const score = (schedule: PublishedMosquePrayerSchedule) =>
    masjidAyeshaPrayerNames.reduce(
      (total, name) =>
        total +
        (schedule.adhan[name] ? 1 : 0) +
        (schedule.iqamah[name] ? 2 : 0),
      Math.min(schedule.jummah.length, 3) * 2,
    );
  const ranked = [...schedules].sort(
    (left, right) => score(right) - score(left),
  );
  const best = ranked[0];
  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  for (const schedule of ranked) {
    for (const name of masjidAyeshaPrayerNames) {
      if (!adhan[name] && schedule.adhan[name])
        adhan[name] = schedule.adhan[name];
      if (!iqamah[name] && schedule.iqamah[name])
        iqamah[name] = schedule.iqamah[name];
    }
  }
  const fridaySchedule = ranked.find(schedule => schedule.jummah.length);

  return {
    ...best,
    adhan,
    iqamah,
    jummah: fridaySchedule?.jummah.slice(0, 3) ?? [],
  };
}

type WebsiteScheduleResult = {
  schedule: PublishedMosquePrayerSchedule;
  website: string;
};

const discoveredMosqueWebsiteCache = new Map<string, string>();

function mosqueWebsiteCacheKey(mosque: Mosque) {
  return `${normalizedMosqueName(mosque.name)}:${mosque.latitude.toFixed(
    4,
  )}:${mosque.longitude.toFixed(4)}`;
}

function knownOfficialMosqueWebsite(mosque: Mosque) {
  if (isMasjidAyesha(mosque)) return MASJID_AYESHA_PRAYER_TIMES_URL;
  if (isAlFaruqCentre(mosque)) return AL_FARUQ_CENTRE_WEBSITE_URL;
  return undefined;
}

function uniqueWebsiteCandidates(values: Array<string | undefined>) {
  const candidates: string[] = [];
  for (const value of values) {
    if (!value) continue;
    try {
      const parsed = new URL(value);
      if (isRejectedWebsiteSearchHost(parsed.hostname)) continue;
      const candidate = parsed.href;
      if (!candidates.includes(candidate)) candidates.push(candidate);
    } catch {
      // Ignore malformed website values from map providers.
    }
  }
  return candidates;
}

function firstSuccessfulWebsiteSchedule(
  websites: string[],
  mosque: Mosque,
  allowLocationIdentity = false,
) {
  return new Promise<WebsiteScheduleResult>((resolve, reject) => {
    if (!websites.length) {
      reject(new Error('No mosque website candidates were available.'));
      return;
    }

    let failures = 0;
    let lastFailure: unknown;
    for (const website of websites) {
      fetchOfficialMosqueWebsiteSchedule(
        { ...mosque, website },
        website,
        allowLocationIdentity,
      ).then(
        schedule => resolve({ schedule, website }),
        failure => {
          failures += 1;
          lastFailure = failure;
          if (failures === websites.length) reject(lastFailure);
        },
      );
    }
  });
}

async function searchForOfficialMosqueWebsites(mosque: Mosque) {
  const city = mosqueCity(mosque);
  const identity = [mosque.name, city].filter(Boolean).join(' ');
  const qualifiers = ['official website'];
  if (/[\u0600-\u06ff]/.test(identity) || isKarbalaMosque(mosque)) {
    qualifiers.push('الموقع الرسمي مواقيت الصلاة');
  }
  const results = await Promise.allSettled(
    qualifiers.flatMap(qualifier => {
      const query = `${identity} ${qualifier}`.trim();
      return [
        (async () => {
          const response = await fetchWithTimeout(
            `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
            10000,
            {
              headers: {
                Accept: 'text/html,application/xhtml+xml',
                'Accept-Language': 'ar,en-CA;q=0.9,en;q=0.8',
                'User-Agent':
                  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
              },
            },
          );
          if (!response.ok)
            throw new Error('The mosque website search failed.');
          return extractMosqueWebsiteSearchCandidates(await response.text());
        })(),
        (async () => {
          const response = await fetchWithTimeout(
            `https://www.bing.com/search?format=rss&q=${encodeURIComponent(
              query,
            )}`,
            10000,
            {
              headers: {
                Accept: 'application/rss+xml,application/xml,text/xml',
                'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
                'User-Agent':
                  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
              },
            },
          );
          if (!response.ok)
            throw new Error('The fallback website search failed.');
          return extractBingWebsiteSearchCandidates(await response.text());
        })(),
      ];
    }),
  );
  const candidates = results.flatMap(result =>
    result.status === 'fulfilled' ? result.value : [],
  );
  if (
    !candidates.length &&
    results.every(result => result.status === 'rejected')
  ) {
    throw new Error('The mosque website search failed.');
  }
  return [...new Set(candidates)].slice(0, 5);
}

async function fetchVerifiedMosqueWebsiteSchedule(mosque: Mosque) {
  const cacheKey = mosqueWebsiteCacheKey(mosque);
  const cachedWebsite = discoveredMosqueWebsiteCache.get(cacheKey);
  const listedWebsites = uniqueWebsiteCandidates([
    cachedWebsite,
    knownOfficialMosqueWebsite(mosque),
    mosque.website,
    ...(mosque.websiteCandidates ?? []),
  ]);

  try {
    const result = await firstSuccessfulWebsiteSchedule(listedWebsites, mosque);
    return {
      ...result.schedule,
      officialWebsiteUrl: result.website,
    };
  } catch {
    // The map listing may be wrong or may not contain a published schedule.
  }

  const searchedWebsites = (await searchForOfficialMosqueWebsites(mosque))
    .filter(website => !listedWebsites.includes(website))
    .slice(0, 3);
  if (!searchedWebsites.length) {
    throw new Error('No verified official mosque website was found.');
  }
  const result = await firstSuccessfulWebsiteSchedule(
    searchedWebsites,
    mosque,
    true,
  );
  discoveredMosqueWebsiteCache.set(cacheKey, result.website);
  return {
    ...result.schedule,
    officialWebsiteUrl: result.website,
    sourceLabel: `${result.schedule.sourceLabel} · found by web search`,
  };
}

function cleanApiTime(value: unknown) {
  return String(value ?? '').replace(/\s*\([^)]*\)\s*$/, '');
}

export async function fetchPrayerTimings(
  origin: Coordinates,
): Promise<PrayerTimings> {
  try {
    const response = await fetchWithTimeout(
      `https://api.aladhan.com/v1/timings?latitude=${origin.latitude}&longitude=${origin.longitude}&method=2`,
      8000,
    );
    if (!response.ok) throw new Error('Prayer time request failed.');
    const payload = await response.json();
    const apiTimings = payload?.data?.timings;
    if (!apiTimings) throw new Error('Prayer times were missing.');
    return Object.fromEntries(
      prayerNames.map(name => {
        const cleaned = cleanApiTime(apiTimings[name]);
        return [name, displayClockTime(cleaned) || cleaned];
      }),
    ) as PrayerTimings;
  } catch {
    return calculatePrayerSchedule(origin).timings;
  }
}

export async function fetchPrayerScheduleByAddress(
  address: string,
): Promise<AddressPrayerSchedule> {
  const trimmedAddress = address.trim();
  if (!trimmedAddress)
    throw new Error('Enter a city, address, or postal code.');
  const response = await fetchWithTimeout(
    `https://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(
      trimmedAddress,
    )}&method=2`,
    10000,
  );
  if (!response.ok) throw new Error('That location could not be found.');
  const payload = await response.json();
  const data = payload?.data;
  const latitude = Number(data?.meta?.latitude);
  const longitude = Number(data?.meta?.longitude);
  if (
    !data?.timings ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error('That location could not be found.');
  }

  const calculated = calculatePrayerSchedule({ latitude, longitude });
  const timings = Object.fromEntries(
    prayerNames.map(name => {
      const cleaned = cleanApiTime(data.timings[name]);
      return [name, displayClockTime(cleaned) || cleaned];
    }),
  ) as PrayerTimings;
  return {
    schedule: {
      ...calculated,
      timings,
      readableDate: data.date?.readable ?? calculated.readableDate,
      hijriDate: data.date?.hijri?.date ?? calculated.hijriDate,
      methodName: data.meta?.method?.name ?? 'ISNA calculation',
    },
    locationLabel: data.meta?.timezone
      ? `${trimmedAddress} · ${String(data.meta.timezone).replace(/_/g, ' ')}`
      : trimmedAddress,
  };
}

function normalizedMosqueName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(
      /\b(mosque|masjid|islamic|muslim|centre|center|community|jamia|jami)\b/g,
      ' ',
    )
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim();
}

function mosqueNameScore(left: string, right: string) {
  const leftName = normalizedMosqueName(left);
  const rightName = normalizedMosqueName(right);
  if (leftName && leftName === rightName) return 1;
  const leftTokens = new Set(leftName.split(' ').filter(Boolean));
  const rightTokens = new Set(rightName.split(' ').filter(Boolean));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const shared = [...leftTokens].filter(token => rightTokens.has(token)).length;
  return shared / Math.max(leftTokens.size, rightTokens.size);
}

function displayClockTime(value: unknown) {
  const match = String(value ?? '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return '';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function addMinutesToDisplayTime(value: string, offset: number) {
  const match = value.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return '';
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3]?.toUpperCase();
  if (suffix) {
    hour = (hour % 12) + (suffix === 'PM' ? 12 : 0);
  }
  const totalMinutes = (hour * 60 + minute + offset + 1440) % 1440;
  return displayClockTime(
    `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(
      2,
      '0',
    )}`,
  );
}

async function publishedMaghribTimeFromOffset(mosque: Mosque, offset: number) {
  try {
    const response = await fetchWithTimeout(
      `https://api.aladhan.com/v1/timings?latitude=${mosque.latitude}&longitude=${mosque.longitude}&method=2`,
      8000,
    );
    if (!response.ok) return '';
    const payload = await response.json();
    const sunset = displayClockTime(
      cleanApiTime(payload?.data?.timings?.Maghrib),
    );
    return sunset ? addMinutesToDisplayTime(sunset, offset) : '';
  } catch {
    return '';
  }
}

export async function fetchMosqueIqamahSchedule(
  mosque: Mosque,
  adhanTimings?: PrayerTimings,
): Promise<MosqueIqamahSchedule | null> {
  const response = await fetchWithTimeout(
    `https://takbeertime.com/api/mosques/nearby?lat=${mosque.latitude}&lng=${mosque.longitude}&radius=2500&limit=20`,
    8000,
  );
  if (!response.ok) return null;
  const payload = await response.json();
  const candidates: any[] = Array.isArray(payload?.data) ? payload.data : [];
  const matches: IqamahCandidateMatch[] = candidates
    .map(
      (candidate: any): IqamahCandidateMatch => ({
        candidate,
        nameScore: mosqueNameScore(mosque.name, String(candidate.name ?? '')),
        distanceMeters: Number(
          candidate.distanceMeters ?? Number.POSITIVE_INFINITY,
        ),
      }),
    )
    .filter(
      match =>
        match.distanceMeters <= 2500 &&
        (match.nameScore >= 0.6 ||
          (match.nameScore >= 0.4 && match.distanceMeters <= 120) ||
          match.distanceMeters <= 35),
    )
    .sort(
      (left, right) =>
        right.nameScore - left.nameScore ||
        left.distanceMeters - right.distanceMeters,
    );

  for (const match of matches) {
    const candidate = match.candidate;
    const activeSchedule = Array.isArray(candidate.prayerSchedules)
      ? candidate.prayerSchedules.find(
          (schedule: any) => schedule.verificationStatus === 'verified',
        ) ?? candidate.prayerSchedules[0]
      : null;
    const raw = candidate.effectiveTimings ?? activeSchedule?.timings;
    if (!raw || typeof raw !== 'object') continue;

    const timings: MosqueIqamahSchedule['timings'] = {};
    const mappedValues: Array<
      [keyof MosqueIqamahSchedule['timings'], unknown]
    > = [
      ['Fajr', raw.fajr],
      ['Dhuhr', raw.dhuhr ?? raw.zuhr],
      ['Asr', raw.asr],
      ['Isha', raw.isha],
    ];
    for (const [name, value] of mappedValues) {
      const displayValue = displayClockTime(value);
      if (displayValue) timings[name] = displayValue;
    }
    const hasMaghribOffset =
      raw.maghribOffset !== null &&
      raw.maghribOffset !== undefined &&
      raw.maghribOffset !== '';
    const maghribOffset = Number(raw.maghribOffset);
    const explicitMaghrib = displayClockTime(raw.maghrib);
    let maghribUsesPublishedOffset = false;
    if (explicitMaghrib) timings.Maghrib = explicitMaghrib;
    else if (
      hasMaghribOffset &&
      Number.isFinite(maghribOffset) &&
      maghribOffset >= -30 &&
      maghribOffset <= 180
    ) {
      const maghribTime = adhanTimings
        ? addMinutesToDisplayTime(adhanTimings.Maghrib, maghribOffset)
        : await publishedMaghribTimeFromOffset(mosque, maghribOffset);
      if (maghribTime) {
        timings.Maghrib = maghribTime;
        maghribUsesPublishedOffset = true;
      }
    }

    const jummahValues: unknown[] = Array.isArray(raw.jummah)
      ? raw.jummah
      : raw.jummah
      ? [raw.jummah]
      : [];
    const jummah: string[] = jummahValues
      .map(value => displayClockTime(value))
      .filter(Boolean)
      .filter(value => {
        const minutes = displayTimeMinutes(value);
        return minutes >= 10 * 60 + 30 && minutes <= 17 * 60 + 30;
      })
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(0, 3);
    if (!Object.keys(timings).length && !jummah.length) continue;

    return {
      timings,
      jummah,
      matchedMosqueName: String(candidate.name),
      maghribUsesPublishedOffset,
      verified:
        candidate.effectiveKeeperIsVerifiedSchedule === true ||
        activeSchedule?.verificationStatus === 'verified',
      updatedAt:
        candidate.effectiveKeeperUpdatedAt ?? activeSchedule?.updatedAt,
    };
  }
  return null;
}

export async function fetchPublishedMosquePrayerSchedule(
  mosque: Mosque,
): Promise<PublishedMosquePrayerSchedule> {
  const [websiteResult, appResult, karbalaResult] = await Promise.allSettled([
    fetchVerifiedMosqueWebsiteSchedule(mosque),
    fetchMosqueIqamahSchedule(mosque),
    isKarbalaMosque(mosque)
      ? fetchAlKafeelKarbalaPrayerSchedule(mosque)
      : Promise.resolve(null),
  ]);

  if (websiteResult.status === 'fulfilled') {
    const website = websiteResult.value;
    if (appResult.status !== 'fulfilled' || !appResult.value) return website;

    const app = appResult.value;
    const iqamah = { ...website.iqamah };
    let usedAppSchedule = false;
    let maghribUsesPublishedOffset = false;
    for (const name of masjidAyeshaPrayerNames) {
      if (!iqamah[name] && app.timings[name]) {
        iqamah[name] = app.timings[name];
        usedAppSchedule = true;
        if (name === 'Maghrib' && app.maghribUsesPublishedOffset) {
          maghribUsesPublishedOffset = true;
        }
      }
    }
    const jummah = website.jummah.length
      ? website.jummah.slice(0, 3)
      : app.jummah.slice(0, 3);
    if (!website.jummah.length && jummah.length) usedAppSchedule = true;

    return {
      ...website,
      iqamah,
      jummah,
      sourceLabel: usedAppSchedule
        ? `${website.sourceLabel} + Takbeer Time`
        : website.sourceLabel,
      verified: website.verified && (!usedAppSchedule || app.verified),
      maghribUsesPublishedOffset,
      fetchedAt: new Date().toISOString(),
    };
  }
  if (appResult.status === 'fulfilled' && appResult.value) {
    const published = appResult.value;
    return {
      adhan: {},
      iqamah: published.timings,
      jummah: published.jummah,
      sourceName: published.matchedMosqueName,
      sourceUrl: 'https://takbeertime.com/',
      sourceLabel: published.verified
        ? 'Verified Takbeer Time schedule'
        : 'Takbeer Time community schedule',
      verified: published.verified,
      maghribUsesPublishedOffset: published.maghribUsesPublishedOffset,
      fetchedAt: published.updatedAt ?? new Date().toISOString(),
    };
  }
  if (karbalaResult.status === 'fulfilled' && karbalaResult.value) {
    return karbalaResult.value;
  }

  throw new Error(
    mosque.website
      ? 'No published prayer schedule was found on this masjid’s website or supported schedule apps.'
      : 'This masjid has no published schedule in a supported app or official website listing.',
  );
}
