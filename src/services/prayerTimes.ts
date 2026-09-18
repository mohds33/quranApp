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

// Maybe if I had like a radius of 30km, I could find the closest mosque and then use that to get the prayer times.
// and it'll be more or less generalized times for that rough area. That way if we get a specific mosque but no prayer times
// we can stil get prayer times for that area.

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

export type NextPrayerOccurrence = {
  name: PrayerName;
  date: Date;
  timing: string;
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
export const DARUL_ILMI_EDMONTON_WEBSITE_URL =
  'https://www.darulilmimasjid.ca/';
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

const timeFormatters = new Map<string, Intl.DateTimeFormat>();

function formatTime(date: Date, timeZone?: string) {
  if (Number.isNaN(date.getTime())) return '—';
  const key = timeZone ?? '';
  let formatter = timeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    });
    timeFormatters.set(key, formatter);
  }
  return formatter.format(date);
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
  /** Show times in this zone (the chosen city's) instead of the device's. */
  timeZone?: string,
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
      prayerNames.map(name => [name, formatTime(dates[name], timeZone)]),
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

export function getNextPrayerOccurrence(
  schedule: DailyPrayerSchedule,
  origin: Coordinates,
  now = new Date(),
  method: CalculationMethodKey = 'northAmerica',
  timeZone?: string,
): NextPrayerOccurrence {
  const upcoming = prayerNames
    .map(name => ({
      name,
      date: schedule.dates[name],
      timing: schedule.timings[name],
    }))
    .find(entry => entry.date > now);

  if (upcoming) return upcoming;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowSchedule = calculatePrayerSchedule(
    origin,
    tomorrow,
    method,
    timeZone,
  );
  return {
    name: 'Fajr',
    date: tomorrowSchedule.dates.Fajr,
    timing: tomorrowSchedule.timings.Fajr,
  };
}

export function calculateQiblaDirection(origin: Coordinates) {
  return Qibla(new AdhanCoordinates(origin.latitude, origin.longitude));
}

const WEBSITE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init: RequestInit = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Many mosque sites sit behind bot protection that rejects bare requests.
    const headers = new Headers(init.headers);
    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', WEBSITE_USER_AGENT);
    }
    if (!headers.has('Accept-Language')) {
      headers.set('Accept-Language', 'en;q=0.9,*;q=0.8');
    }
    return await fetch(url, { ...init, headers, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function settleWithin<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      value => {
        clearTimeout(timeout);
        resolve(value);
      },
      failure => {
        clearTimeout(timeout);
        reject(failure);
      },
    );
  });
}

function normalizeLocalizedWebsiteText(value: string) {
  const digitSets = [
    '٠١٢٣٤٥٦٧٨٩',
    '۰۱۲۳۴۵۶۷۸۹',
    '০১২৩৪৫৬৭৮৯',
    '०१२३४५६७८९',
    '੦੧੨੩੪੫੬੭੮੯',
    '૦૧૨૩૪૫૬૭૮૯',
    '୦୧୨୩୪୫୬୭୮୯',
    '௦௧௨௩௪௫௬௭௮௯',
    '౦౧౨౩౪౫౬౭౮౯',
    '೦೧೨೩೪೫೬೭೮೯',
    '൦൧൨൩൪൫൬൭൮൯',
    '๐๑๒๓๔๕๖๗๘๙',
    '໐໑໒໓໔໕໖໗໘໙',
    '၀၁၂၃၄၅၆၇၈၉',
    '០១២៣៤៥៦៧៨៩',
  ];
  return value
    .normalize('NFKD')
    .replace(/\p{Nd}/gu, digit => {
      for (const set of digitSets) {
        const index = set.indexOf(digit);
        if (index >= 0) return String(index);
      }
      return digit;
    })
    .replace(
      /[\u0300-\u036f\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g,
      '',
    )
    .replace(/[ıİ]/g, 'i')
    .replace(/ß/g, 'ss');
}

function websiteHtmlToText(html: string) {
  const chunks: string[] = [];
  const ignoredTags = new Set(['script', 'style', 'template']);
  const blockTags = new Set([
    'address',
    'article',
    'br',
    'div',
    'dl',
    'dt',
    'dd',
    'figcaption',
    'footer',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'li',
    'main',
    'p',
    'section',
    'table',
    'tr',
    'ul',
  ]);
  const cellTags = new Set(['td', 'th']);
  let ignoredDepth = 0;
  const decodeEntities = (text: string) => {
    const namedEntities: Record<string, string> = {
      amp: '&',
      apos: "'",
      gt: '>',
      hellip: '…',
      laquo: '«',
      ldquo: '“',
      lsquo: '‘',
      lt: '<',
      mdash: '—',
      nbsp: ' ',
      ndash: '–',
      quot: '"',
      raquo: '»',
      rdquo: '”',
      rsquo: '’',
    };
    return text.replace(
      /&(?:#(\d+)|#x([0-9a-f]+)|([a-z][a-z0-9]+));/gi,
      (entity, decimal: string, hexadecimal: string, name: string) => {
        const codePoint = decimal
          ? Number(decimal)
          : hexadecimal
          ? Number.parseInt(hexadecimal, 16)
          : NaN;
        if (
          Number.isFinite(codePoint) &&
          codePoint > 0 &&
          codePoint <= 0x10ffff
        ) {
          try {
            return String.fromCodePoint(codePoint);
          } catch {
            return entity;
          }
        }
        return namedEntities[name?.toLocaleLowerCase()] ?? entity;
      },
    );
  };
  const appendText = (text: string) => {
    if (!ignoredDepth && text) chunks.push(decodeEntities(text));
  };
  const tagEnd = (start: number) => {
    let quote = '';
    for (let index = start; index < html.length; index += 1) {
      const character = html[index];
      if (quote) {
        if (character === quote) quote = '';
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        return index;
      }
    }
    return html.length - 1;
  };

  let cursor = 0;
  while (cursor < html.length) {
    const opening = html.indexOf('<', cursor);
    if (opening < 0) {
      appendText(html.slice(cursor));
      break;
    }
    appendText(html.slice(cursor, opening));
    if (html.startsWith('<!--', opening)) {
      const commentEnd = html.indexOf('-->', opening + 4);
      cursor = commentEnd < 0 ? html.length : commentEnd + 3;
      continue;
    }
    const closing = tagEnd(opening + 1);
    const rawTag = html.slice(opening + 1, closing).trim();
    const isClosing = rawTag.startsWith('/');
    const name = rawTag
      .replace(/^\//, '')
      .match(/^([a-z][a-z0-9:-]*)/i)?.[1]
      ?.toLocaleLowerCase();
    if (name) {
      if (isClosing && ignoredTags.has(name)) {
        ignoredDepth = Math.max(0, ignoredDepth - 1);
      } else if (!isClosing && ignoredTags.has(name)) {
        ignoredDepth += 1;
      } else if (!ignoredDepth) {
        if (isClosing && cellTags.has(name)) chunks.push(' | ');
        else if (blockTags.has(name)) chunks.push('\n');
      }
    }
    cursor = closing + 1;
  }

  return normalizeLocalizedWebsiteText(chunks.join(''))
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
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

function escapeRegexLiteral(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const websitePrayerAliasValues: Record<
  MasjidAyeshaPrayerName,
  readonly string[]
> = {
  Fajr: [
    'Fajr',
    'Fadjr',
    'Fadschr',
    'Fadjer',
    'Fayr',
    'Zora',
    'Sabah namazi',
    'Asuba',
    'Fajer',
    'Fajir',
    'Fedzr',
    'Fedjr',
    'Fecr',
    'Subh',
    'Sobh',
    'Subuh',
    'Subax',
    'Sabah',
    'Sabahu',
    'Alfajiri',
    'الفجر',
    'فجر',
    'الصبح',
    'صبح',
    'نماز صبح',
    'ফজর',
    'Фаджр',
    '晨礼',
    '晨禮',
    'ファジュル',
    'ファジル',
    'फ़ज्र',
    'फज्र',
    'सुबह',
    'ഫജർ',
    'ஃபஜ்ர்',
  ],
  Dhuhr: [
    'Dhuhr',
    'Dohr',
    'Dhohor',
    'Dhouhr',
    'Dhoehr',
    'Dhuhur',
    'Zuhor',
    'Azahar',
    'Duhur',
    'Duhr',
    'Zuhr',
    'Zuhur',
    'Dzuhur',
    'Zohar',
    'Zohor',
    'Zohr',
    'Dhohr',
    'Dhor',
    'Ogle',
    'Podne',
    'Dreke',
    'Noon',
    'Midday',
    'Midi',
    'Adhuhuri',
    'Mchana',
    'الظهر',
    'ظهر',
    'ظہر',
    'জোহর',
    'যোহর',
    'Зухр',
    '晌礼',
    '晌禮',
    '午礼',
    '午禮',
    'ズフル',
    'ज़ुहर',
    'जुहर',
    'दोपहर',
    'ളുഹർ',
    'லுஹர்',
  ],
  Asr: [
    'Asr',
    'Assr',
    'Laasar',
    'Asar',
    'Ashar',
    'Casar',
    'Ikindi',
    'Ikindija',
    'Ikindia',
    'Alasiri',
    'العصر',
    'عصر',
    'আসর',
    'Аср',
    '晡礼',
    '晡禮',
    'アスル',
    'अस्र',
    'അസർ',
    'அஸர்',
  ],
  Maghrib: [
    'Maghrib',
    'Magreb',
    'Maghribi',
    'Magariba',
    'Maghreb',
    'Magrib',
    'Maqrib',
    'Aksam',
    'Aksham',
    'Akshami',
    'Magharibi',
    'المغرب',
    'مغرب',
    'মাগরিব',
    'Магриб',
    '昏礼',
    '昏禮',
    'マグリブ',
    'मग़रिब',
    'मगरिब',
    'മഗ്‌രിബ്',
    'மஃரிப்',
  ],
  Isha: [
    'Isha',
    'Isja',
    'Ischaa',
    'Ichaa',
    'عشا',
    'Ishaa',
    'Esha',
    'Eshaa',
    'Icha',
    'Ischa',
    'Isya',
    'Isyak',
    'Cisho',
    'Yatsi',
    'Jacija',
    'Jacia',
    'العشاء',
    'عشاء',
    'ইশা',
    'এশা',
    'Иша',
    '宵礼',
    '宵禮',
    'イシャー',
    'イシャ',
    'इशा',
    'ഇശാ',
    'இஷா',
  ],
};

const normalizedPrayerAliasValues = Object.fromEntries(
  Object.entries(websitePrayerAliasValues).map(([name, aliases]) => [
    name,
    aliases.map(alias =>
      normalizeLocalizedWebsiteText(alias).toLocaleLowerCase(),
    ),
  ]),
) as Record<MasjidAyeshaPrayerName, string[]>;

const websitePrayerAliases = Object.fromEntries(
  Object.entries(normalizedPrayerAliasValues).map(([name, aliases]) => [
    name,
    aliases.map(escapeRegexLiteral).join('|'),
  ]),
) as Record<MasjidAyeshaPrayerName, string>;

const websiteJummahAliasValues = [
  'Jummah',
  'Jumuah',
  'Jumua',
  'Jouma',
  'Joumoua',
  'Yumuah',
  'Friday Prayer',
  'Friday Prayers',
  'Friday Salah',
  'Freitagsgebet',
  'Cuma',
  'Vendredi',
  'Priere du vendredi',
  'Jumat',
  'Jumaat',
  'Dzuma',
  'Xhuma',
  'Jimco',
  'Oracion del viernes',
  'Oracao de sexta',
  'Джума',
  'Пятничная молитва',
  'الجمعة',
  'جمعه',
  'جمعہ',
  'জুমা',
  '主麻',
  '聚礼',
  '聚禮',
  'ジュムア',
];
const normalizedJummahAliasValues = websiteJummahAliasValues.map(alias =>
  normalizeLocalizedWebsiteText(alias).toLocaleLowerCase(),
);
const normalizedJummahDataAliases = normalizedJummahAliasValues.map(
  normalizedWebsiteDataKey,
);
const websiteJummahAliases = normalizedJummahAliasValues
  .map(escapeRegexLiteral)
  .join('|');

const websiteTimePattern =
  /(?:(?:上午|下午|午前|午後)\s*)?(?:[01]?\d|2[0-3])[:.][0-5]\d\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|[صم]|上午|下午|午前|午後)?/gi;
const websiteScheduleWords =
  /(?:(?:prayer|salah|salat)[\s_-]*(?:times?|timings?|timetable|schedule)|iqamah|jamaat|jamat|jummah|jumuah|timetable|namaz|vaktija|namaska\s+vremena|orari\s+i\s+namazit|(?:ramadan|monthly|yearly)\s+(?:prayer\s+)?schedule|horaires?\s+(?:de\s+)?priere|heures?\s+(?:de\s+)?priere|gebetszeiten|gebetsplan|tiempos?\s+de\s+oracion|horarios?\s+de\s+oracion|horarios?\s+de\s+reza|orari[oa]\s+(?:di\s+)?preghier[ae]|gebedstijden|namaz\s+(?:vakitleri|saatleri|vremena)|waktu\s+(?:solat|salat|sholat|sembahyang)|waqtiyada\s+salaadda|nyakati\s+za\s+(?:swala|sala)|молитвенн?ое?\s+время|время\s+(?:намаза|молитв)|расписание\s+(?:намаза|молитв)|مواقيت\s*(?:الصلاة|الصلاه)|اوقات\s*(?:الصلاة|الصلاه)|اوقات\s*نماز|نماز\s*کے\s*اوقات|নামাজের\s*সময়|नमाज़?\s+का\s+समय|礼拜时间|禮拜時間|祈祷时间|祈禱時間|礼拝時刻|礼拝時間|awqat-salat|namaz-sutra|tiempos-de-oracion|horaires-de-priere|orario-di-preghiera|demen-nimeje|waktu-solat|namaz-vakitleri|waktu-sholat|waqtiyada-salaadda|namaaz-ke-auqat|casy-modlitieb|namajera-samaya|imaidoket|reihai-jikan|bon-?tider|bonnetider|vremya-molitv|neram-pattiyal)/i;

function normalizeWebsiteTime(value: string, prayer?: MasjidAyeshaPrayerName) {
  let localizedSuffix = '';
  const cleaned = normalizeLocalizedWebsiteText(value)
    .replace(/(\d)\.(?=\d)/g, '$1:')
    .replace(/^(上午|午前)\s*/i, () => {
      localizedSuffix = 'A';
      return '';
    })
    .replace(/^(下午|午後)\s*/i, () => {
      localizedSuffix = 'P';
      return '';
    })
    .replace(/\s*(上午|午前)$/i, () => {
      localizedSuffix = 'A';
      return '';
    })
    .replace(/\s*(下午|午後)$/i, () => {
      localizedSuffix = 'P';
      return '';
    })
    .replace(/\s+/g, ' ')
    .trim();
  const match = cleaned.match(
    /^(\d{1,2}):(\d{2})\s*(?:(A|P)\.?\s*M\.?|([صم]))?$/i,
  );
  if (!match) return '';
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const explicitSuffix =
    localizedSuffix ||
    (match[3]?.toUpperCase() ??
      (match[4] === 'ص' ? 'A' : match[4] === 'م' ? 'P' : undefined));
  if (minute > 59 || hour > 23) return '';
  if (explicitSuffix) {
    if (hour < 1 || hour > 12) return '';
    return `${String(hour).padStart(2, '0')}:${match[2]} ${explicitSuffix}M`;
  }
  if (hour <= 12 && prayer) {
    // Without AM/PM: Fajr is morning; Dhuhr is late morning (10-11) or
    // afternoon; Isha written as 12:xx has passed midnight.
    const morning =
      prayer === 'Fajr' ||
      (prayer === 'Dhuhr' && hour >= 10 && hour < 12) ||
      (prayer === 'Isha' && hour === 12);
    const suffix = morning ? 'AM' : 'PM';
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
      ? /(?:adhaan|adhan|athaan|athan|azzan|azan|ezan|salah|start|begin|debut|inicio|beginn|heure|horaire|zeit|vakit|waqt|waktu|tiempo|mwanzo|начало|время|时间|時間|入时|入時|時刻|開始|समय|সময়|اذان|أذان|وقت)/i
      : /(?:iqamah|iqama|iqaamah|jamaat|jamat|jamaah|congregation|kamet|ikamet|икамат|成班礼|成班禮|جماعت|জামাত|اقامة|إقامة|جماعة)/i;

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
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_|_$/g, '');
}

function websiteDataKeyContainsPart(key: string, part: string) {
  return (
    key === part ||
    key.startsWith(`${part}_`) ||
    key.endsWith(`_${part}`) ||
    key.includes(`_${part}_`)
  );
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
        websiteDataKeyContainsPart(key, prayerAlias),
      ) &&
      roleAliases.some(roleAlias => websiteDataKeyContainsPart(key, roleAlias))
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
  for (const name of masjidAyeshaPrayerNames) {
    if (normalizedPrayerAliasValues[name].includes(label)) return name;
  }
  return null;
}

const websitePrayerNameFields = [
  'name',
  'prayer',
  'salah',
  'salat',
  'namaz',
  'label',
  'молитва',
  'намаз',
  '礼拜',
  '禮拜',
  '礼拝',
  'نماز',
  'الصلاة',
];
const websiteAdhanFields = [
  'adhan',
  'athan',
  'athaan',
  'azan',
  'azzan',
  'start',
  'starts',
  'time',
  'timing',
  'inicio',
  'debut',
  'beginn',
  'начало',
  'время',
  '时间',
  '時間',
  '入时',
  '入時',
  '時刻',
  'समय',
  'সময়',
  'وقت',
];
const websiteIqamahFields = [
  'iqamah',
  'iqama',
  'iqaamah',
  'ikamet',
  'jamaat',
  'jamat',
  'jamaah',
  'congregation',
  'икамат',
  '成班礼',
  '成班禮',
  'جماعت',
  'জামাত',
  'اقامة',
  'إقامة',
];

function localizedWebsiteObjectValue(
  value: Record<string, unknown>,
  fields: string[],
) {
  const normalizedFields = fields.map(normalizedWebsiteDataKey);
  for (const [key, item] of Object.entries(value)) {
    if (normalizedFields.includes(normalizedWebsiteDataKey(key))) return item;
  }
  return undefined;
}

function findPublishedPrayerRows(value: unknown, depth = 0): any[] {
  if (depth > 6 || !value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    const labelled = value.filter(
      item =>
        item &&
        typeof item === 'object' &&
        publishedPrayerName(
          localizedWebsiteObjectValue(item, websitePrayerNameFields),
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
        localizedWebsiteObjectValue(row, websitePrayerNameFields),
      );
      if (!name) continue;
      const adhanTime = normalizeWebsiteTime(
        String(localizedWebsiteObjectValue(row, websiteAdhanFields) ?? ''),
        name,
      );
      const iqamahTime = normalizeWebsiteTime(
        String(localizedWebsiteObjectValue(row, websiteIqamahFields) ?? ''),
        name,
      );
      if (adhanTime) adhan[name] = adhanTime;
      if (iqamahTime) iqamah[name] = iqamahTime;
    }
    if (Object.keys(adhan).length >= 3 || Object.keys(iqamah).length >= 3) {
      const flattenedRows = flattenWebsiteData(payload);
      const jummah = [...flattenedRows]
        .filter(([key]) =>
          normalizedJummahDataAliases.some(alias =>
            websiteDataKeyContainsPart(key, alias),
          ),
        )
        .map(([, value]) => normalizeWebsiteTime(String(value ?? ''), 'Dhuhr'))
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
  const aliases = Object.fromEntries(
    masjidAyeshaPrayerNames.map(name => [
      name,
      normalizedPrayerAliasValues[name].map(normalizedWebsiteDataKey),
    ]),
  ) as Record<MasjidAyeshaPrayerName, string[]>;
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
    'start time',
    'beginning',
    'debut',
    'inicio',
    'hora',
    'heure',
    'horaire',
    'beginn',
    'zeit',
    'vakit',
    'waqt',
    'waktu',
    'tiempo',
    'mwanzo',
    'начало',
    'время',
    '时间',
    '時間',
    '入时',
    '入時',
    '時刻',
    '開始',
    'समय',
    'সময়',
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
    'jamaah',
    'berjamaah',
    'congregation',
    'congregational',
    'kamet',
    'ikamet',
    'икамат',
    '成班礼',
    '成班禮',
    ' الجماعة',
    'جماعت',
    'জামাত',
    'اقامة',
    'إقامة',
    'جماعة',
  ];
  const normalizedAdhanRoles = adhanRoles.map(normalizedWebsiteDataKey);
  const normalizedIqamahRoles = iqamahRoles.map(normalizedWebsiteDataKey);
  let prayerCount = 0;

  for (const name of masjidAyeshaPrayerNames) {
    const adhanTime = genericWebsiteDataTime(
      flattened,
      aliases[name],
      normalizedAdhanRoles,
      name,
    );
    const iqamahTime = genericWebsiteDataTime(
      flattened,
      aliases[name],
      normalizedIqamahRoles,
      name,
    );
    if (adhanTime) adhan[name] = adhanTime;
    if (iqamahTime) iqamah[name] = iqamahTime;
    if (adhanTime || iqamahTime) prayerCount += 1;
  }

  const jummah = [...flattened]
    .filter(([key]) =>
      normalizedJummahDataAliases.some(alias =>
        websiteDataKeyContainsPart(key, alias),
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
  for (const tag of html.matchAll(
    /<script\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi,
  )) {
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

// Month names as they appear in published timetables, normalized the same way
// as website text (accents and Arabic diacritics removed, lower case).
const timetableMonthNames: string[][] = [
  [
    'january',
    'jan',
    'janvier',
    'janv',
    'januar',
    'enero',
    'ene',
    'gennaio',
    'januari',
    'ocak',
    'janeiro',
    'janar',
    'يناير',
    'كانون الثاني',
    'ژانویه',
    'جنوری',
    'январь',
    'января',
  ],
  [
    'february',
    'feb',
    'fevrier',
    'fevr',
    'fev',
    'februar',
    'febrero',
    'febbraio',
    'februari',
    'subat',
    'fevereiro',
    'shkurt',
    'فبراير',
    'شباط',
    'فوریه',
    'فروری',
    'февраль',
    'февраля',
  ],
  [
    'march',
    'mar',
    'mars',
    'marz',
    'marzo',
    'maart',
    'maret',
    'mart',
    'marco',
    'مارس',
    'آذار',
    'مارچ',
    'март',
    'марта',
  ],
  [
    'april',
    'apr',
    'avril',
    'avr',
    'abril',
    'aprile',
    'nisan',
    'prill',
    'أبريل',
    'ابريل',
    'نيسان',
    'آوریل',
    'اپریل',
    'апрель',
    'апреля',
  ],
  [
    'may',
    'mai',
    'mayo',
    'maggio',
    'mei',
    'mayis',
    'maio',
    'maj',
    'مايو',
    'أيار',
    'مه',
    'مئی',
    'май',
    'мая',
  ],
  [
    'june',
    'jun',
    'juin',
    'juni',
    'junio',
    'giugno',
    'haziran',
    'junho',
    'qershor',
    'يونيو',
    'حزيران',
    'ژوئن',
    'جون',
    'июнь',
    'июня',
  ],
  [
    'july',
    'jul',
    'juillet',
    'juil',
    'juli',
    'julio',
    'luglio',
    'temmuz',
    'julho',
    'korrik',
    'يوليو',
    'تموز',
    'ژوئیه',
    'جولائی',
    'июль',
    'июля',
  ],
  [
    'august',
    'aug',
    'aout',
    'agosto',
    'agustus',
    'augustus',
    'agustos',
    'gusht',
    'أغسطس',
    'اغسطس',
    'آب',
    'اوت',
    'اگست',
    'август',
    'августа',
  ],
  [
    'september',
    'sep',
    'sept',
    'septembre',
    'septiembre',
    'settembre',
    'eylul',
    'setembro',
    'shtator',
    'سبتمبر',
    'أيلول',
    'سپتامبر',
    'ستمبر',
    'сентябрь',
    'сентября',
  ],
  [
    'october',
    'oct',
    'octobre',
    'oktober',
    'okt',
    'octubre',
    'ottobre',
    'ekim',
    'outubro',
    'tetor',
    'أكتوبر',
    'اكتوبر',
    'تشرين الأول',
    'اکتبر',
    'اکتوبر',
    'октябрь',
    'октября',
  ],
  [
    'november',
    'nov',
    'novembre',
    'noviembre',
    'kasim',
    'novembro',
    'nentor',
    'نوفمبر',
    'تشرين الثاني',
    'نوامبر',
    'نومبر',
    'ноябрь',
    'ноября',
  ],
  [
    'december',
    'dec',
    'decembre',
    'dezember',
    'dez',
    'diciembre',
    'dic',
    'dicembre',
    'desember',
    'aralik',
    'dezembro',
    'dhjetor',
    'ديسمبر',
    'كانون الأول',
    'دسامبر',
    'دسمبر',
    'декабрь',
    'декабря',
  ],
].map(names =>
  names.map(name => normalizeLocalizedWebsiteText(name).toLocaleLowerCase()),
);

function timetableMonthIndex(word: string) {
  const normalized = word.replace(/\.$/, '');
  return timetableMonthNames.findIndex(names => names.includes(normalized));
}

type TimetableDateOrder = 'dm' | 'md' | 'unknown';

/** Reads a date written in a timetable cell. Returns [month (1-12), day, year?]. */
function timetableCellDate(
  text: string,
  order: TimetableDateOrder,
): Array<[number, number, number | undefined]> {
  const value = normalizeLocalizedWebsiteText(text).toLocaleLowerCase();
  const results: Array<[number, number, number | undefined]> = [];
  const year = (raw?: string) =>
    raw ? (raw.length === 2 ? 2000 + Number(raw) : Number(raw)) : undefined;
  const iso = value.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) return [[Number(iso[2]), Number(iso[3]), Number(iso[1])]];
  const numeric = value.match(/\b(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    if (order !== 'md') results.push([second, first, year(numeric[3])]);
    if (order !== 'dm') results.push([first, second, year(numeric[3])]);
    return results;
  }
  const words = value.match(/[\p{L}]+\.?/gu) ?? [];
  const day = value.match(/\b(\d{1,2})(?:st|nd|rd|th|er|e|\.)?\b/)?.[1];
  const yearMatch = value.match(/\b(\d{4})\b/)?.[1];
  // Two-word Arabic month names such as "كانون الثاني" are joined first.
  for (let index = 0; index < words.length; index += 1) {
    for (const candidate of [
      `${words[index]} ${words[index + 1] ?? ''}`.trim(),
      words[index],
    ]) {
      const month = timetableMonthIndex(candidate);
      if (month >= 0 && day) {
        return [[month + 1, Number(day), year(yearMatch)]];
      }
    }
  }
  return results;
}

function timetableDateOrder(dateCells: string[]): TimetableDateOrder {
  for (const cell of dateCells) {
    const numeric = normalizeLocalizedWebsiteText(cell).match(
      /\b(\d{1,2})[/.-](\d{1,2})(?:[/.-]\d{2,4})?\b/,
    );
    if (!numeric) continue;
    if (Number(numeric[1]) > 12) return 'dm';
    if (Number(numeric[2]) > 12) return 'md';
  }
  return 'unknown';
}

const timetableIqamahWords =
  /iqa+ma|ikamet|ikama|jama+t|jama+h|jamaah|jamat|congregation|jemaah|jamaa|اقامة|إقامة|اقامه|جماعت|জামাত|икамат|prayer\s*time|salah|salat/i;
const timetableAdhanWords =
  /begin|start|adhan|athan|azan|ezan|debut|beginn|inicio|awal|entry|اذان|أذان|آذان|اول|azaan|mithl|shafi|hanafi/i;

type TimetableColumn = {
  prayer?: MasjidAyeshaPrayerName;
  imsak?: boolean;
  kind?: 'adhan' | 'iqamah';
};

function timetableHeaderPrayer(text: string) {
  const value = normalizeLocalizedWebsiteText(text).toLocaleLowerCase();
  for (const name of masjidAyeshaPrayerNames) {
    if (new RegExp(`(?:${websitePrayerAliases[name]})`, 'i').test(value)) {
      return name;
    }
  }
  return undefined;
}

/** Table rows as text cells, with colspan and rowspan expanded into a grid. */
function timetableRows(tableHTML: string) {
  const carried: Array<{ text: string; rows: number } | undefined> = [];
  return [...tableHTML.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(row => {
    const cells: string[] = [];
    const takeCarried = () => {
      while (carried[cells.length]?.rows) {
        const cell = carried[cells.length]!;
        cell.rows -= 1;
        cells.push(cell.text);
      }
    };
    for (const cell of row[1].matchAll(
      /<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    )) {
      takeCarried();
      const span = (name: string) =>
        Math.min(
          8,
          Math.max(
            1,
            Number(
              cell[2].match(
                new RegExp(`${name}\\s*=\\s*["']?(\\d+)`, 'i'),
              )?.[1],
            ) || 1,
          ),
        );
      const text = websiteHtmlToText(cell[3]).replace(/\s+/g, ' ').trim();
      const rowSpan = span('rowspan');
      for (let index = 0; index < span('colspan'); index += 1) {
        if (rowSpan > 1) carried[cells.length] = { text, rows: rowSpan - 1 };
        cells.push(text);
      }
    }
    takeCarried();
    return cells;
  });
}

/**
 * Reads today's row from a daily, monthly or yearly timetable table: columns
 * named after prayers (in any supported language), optionally split into
 * start and jama'ah/iqamah times, and rows labelled with a date.
 */
export function parseTimetableTablesForDate(
  html: string,
  date = new Date(),
): Pick<PublishedMosquePrayerSchedule, 'adhan' | 'iqamah'> | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const pageText = normalizeLocalizedWebsiteText(
    html.replace(/<[^>]+>/g, ' '),
  ).toLocaleLowerCase();
  const pageMentionsMonth = timetableMonthNames[month - 1].some(
    name => name.length > 3 && pageText.includes(name),
  );
  let best: Pick<PublishedMosquePrayerSchedule, 'adhan' | 'iqamah'> | null =
    null;
  let bestCount = 0;

  for (const table of html.matchAll(/<table\b[\s\S]*?<\/table>/gi)) {
    const rows = timetableRows(table[0]);
    const isTimeRow = (cells: string[]) =>
      cells.filter(cell => /^\D{0,6}\d{1,2}[:.]\d{2}/.test(cell)).length >= 3;
    const firstDataRow = rows.findIndex(isTimeRow);
    if (firstDataRow < 1) continue;

    const columns: TimetableColumn[] = [];
    for (const header of rows.slice(
      Math.max(0, firstDataRow - 3),
      firstDataRow,
    )) {
      header.forEach((cell, index) => {
        const column = (columns[index] ??= {});
        const prayer = timetableHeaderPrayer(cell);
        if (prayer) column.prayer = prayer;
        else if (/imsak|imsaak|امساک|امساك/i.test(cell)) column.imsak = true;
        if (
          /sunrise|shuruq|shurooq|chourouk|gunes|terbit|sonnenaufgang|شروق/i.test(
            cell,
          )
        ) {
          column.prayer = undefined;
          column.imsak = false;
        }
        if (timetableIqamahWords.test(cell.replace(/['’`]/g, ''))) {
          column.kind = 'iqamah';
        } else if (!column.kind && timetableAdhanWords.test(cell)) {
          column.kind = 'adhan';
        }
      });
    }
    // Turkish and Indonesian tables label Fajr as Imsak when there is no Subuh column.
    if (!columns.some(column => column.prayer === 'Fajr')) {
      const imsak = columns.find(column => column.imsak);
      if (imsak) imsak.prayer = 'Fajr';
    }
    if (
      new Set(columns.map(column => column.prayer).filter(Boolean)).size < 3
    ) {
      continue;
    }

    const dataRows = rows.slice(firstDataRow).filter(isTimeRow);
    const order = timetableDateOrder(
      dataRows.map(cells => cells.slice(0, 3).join(' ')),
    );
    const dayOnlyTable =
      pageMentionsMonth && dataRows.length >= 28 && dataRows.length <= 31;
    const matching = dataRows.filter(cells => {
      const label = cells.slice(0, 3).join(' ');
      const dates = timetableCellDate(label, order);
      if (dates.length) {
        return dates.some(
          ([cellMonth, cellDay, cellYear]) =>
            cellMonth === month &&
            cellDay === day &&
            (cellYear === undefined || cellYear === year),
        );
      }
      return (
        dayOnlyTable &&
        new RegExp(`(?:^|\\D)${day}(?:\\D|$)`).test(cells[0]) &&
        /^\D{0,12}\d{1,2}\D{0,12}$/.test(cells[0])
      );
    });
    const todayRow =
      matching.length === 1
        ? matching[0]
        : dataRows.length === 1 && firstDataRow > 0
        ? dataRows[0]
        : undefined;
    if (!todayRow) continue;

    const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
    const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
    const unlabeled: Partial<Record<MasjidAyeshaPrayerName, string[]>> = {};
    todayRow.forEach((cell, index) => {
      const column = columns[index];
      if (!column?.prayer) return;
      const time = cell.match(websiteTimePattern)?.[0];
      const value = time ? normalizeWebsiteTime(time, column.prayer) : '';
      if (!value) return;
      if (column.kind === 'iqamah') iqamah[column.prayer] ??= value;
      else if (column.kind === 'adhan') adhan[column.prayer] ??= value;
      else (unlabeled[column.prayer] ??= []).push(value);
    });
    for (const name of masjidAyeshaPrayerNames) {
      const values = unlabeled[name] ?? [];
      if (!adhan[name] && values.length) adhan[name] = values.shift();
      if (!iqamah[name] && values.length) iqamah[name] = values.shift();
    }
    const count = masjidAyeshaPrayerNames.filter(
      name => adhan[name] || iqamah[name],
    ).length;
    if (count > bestCount) {
      best = { adhan, iqamah };
      bestCount = count;
    }
  }
  return bestCount >= 3 ? best : null;
}

export function parsePublishedMosqueWebsiteHTML(
  html: string,
  mosque: Mosque,
): PublishedMosquePrayerSchedule {
  const text = websiteHtmlToText(html);
  const table = parseTimetableTablesForDate(html);
  const adhan: PublishedMosquePrayerSchedule['adhan'] = { ...table?.adhan };
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {
    ...table?.iqamah,
  };
  let publishedPrayerCount = 0;

  for (const name of masjidAyeshaPrayerNames) {
    if (table && (adhan[name] || iqamah[name])) {
      publishedPrayerCount += 1;
      continue;
    }
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

/**
 * Finds today's slide in an Athan+ (Masjidal) widget. Current widgets mark it
 * as the active carousel item; older ones used numbered table_div_N sections.
 */
function athanPlusTodaySection(html: string) {
  const sectionBetween = (start: number, pattern: RegExp) => {
    const rest = html.slice(start + 1);
    const next = rest.search(pattern);
    return html.slice(start, next < 0 ? html.length : start + 1 + next);
  };
  const legacyId = html.match(
    /<div\b[^>]*class\s*=\s*["'][^"']*carousel-item[^"']*\bactive\b[^"']*["'][^>]*data-id\s*=\s*["'](\d+)["']/i,
  )?.[1];
  const legacyStart = html.search(
    new RegExp(
      `<div\\b[^>]*\\bid\\s*=\\s*["']table_div_${legacyId ?? '0'}["'][^>]*>`,
      'i',
    ),
  );
  if (legacyStart >= 0) {
    return sectionBetween(
      legacyStart,
      /<div\b[^>]*\bid\s*=\s*["']table_div_\d+["'][^>]*>/i,
    );
  }
  const slidePattern = /<div\b[^>]*class\s*=\s*["'][^"']*\bcarousel-item\b/gi;
  const slides = [...html.matchAll(slidePattern)].map(match =>
    sectionBetween(
      match.index ?? 0,
      /<div\b[^>]*class\s*=\s*["'][^"']*\bcarousel-item\b/i,
    ),
  );
  const today = new Date();
  const todayLabel = new RegExp(
    `\\b${today.toLocaleDateString('en-US', {
      month: 'short',
    })}\\w*\\.?\\s+${today.getDate()}\\b`,
    'i',
  );
  const section =
    slides.find(slide => todayLabel.test(websiteHtmlToText(slide))) ??
    slides.find(slide => /^<div\b[^>]*\bactive\b/i.test(slide));
  if (!section) {
    throw new Error('The Athan+ timetable for today was not found.');
  }
  return section;
}

export function parseAthanPlusPrayerScheduleHTML(
  html: string,
  mosque: Mosque,
  sourceUrl: string,
): PublishedMosquePrayerSchedule {
  const section = athanPlusTodaySection(html);
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

function isDarulIlmiEdmonton(mosque: Mosque) {
  const identity = normalizeLocalizedWebsiteText(
    `${mosque.name} ${mosque.address}`,
  ).toLocaleLowerCase();
  return (
    /dar(?:ul| al)?[\s-]*ilm(?:i)?|دار\s*العلم/i.test(identity) &&
    /edmonton|t5w\s*1a5|4225\s+118/i.test(identity)
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

function isSocialWebsiteHost(hostname: string) {
  const host = hostname.toLocaleLowerCase().replace(/^www\./, '');
  return /^(?:[^.]+\.)?(?:facebook|instagram|youtube|twitter|x|tiktok|linkedin)\.com$/.test(
    host,
  );
}

function isRejectedWebsiteSearchHost(hostname: string) {
  const host = hostname.toLocaleLowerCase().replace(/^www\./, '');
  return (
    /^(?:duckduckgo|google|bing|yahoo)\./.test(host) ||
    isSocialWebsiteHost(host) ||
    /(?:^|\.)(?:yelp|mapquest|yellowpages|findglocal|canada-listing|informalberta|timesofsalah|globalprayertimes|prayersconnect|prayercalctime|islamicfinder|muslimandquran|salatomatic|esalah|jammat|masjidway|mapcarta|tripadvisor|waze|wikipedia|praysalat|cybo|travelsetu|adequatetravel|ancient-history-sites|islamicdates|muslimapp|alummahai|prayer-times)\./.test(
      host,
    ) ||
    /(?:^|\.)(?:211\.ca|maps\.apple\.com)$/.test(host)
  );
}

function decodedOfficialWebsiteValue(value: string, sourceUrl: string) {
  let decoded = decodeWebsiteSearchValue(value.trim()).replace(/\\\//g, '/');
  if (!decoded) return '';
  if (decoded.startsWith('//')) decoded = `https:${decoded}`;
  try {
    let parsed = new URL(decoded, sourceUrl);
    if (isSocialWebsiteHost(parsed.hostname)) {
      const redirected =
        parsed.searchParams.get('u') ??
        parsed.searchParams.get('url') ??
        parsed.searchParams.get('q') ??
        parsed.searchParams.get('target');
      if (!redirected) return '';
      parsed = new URL(decodeURIComponent(redirected));
    }
    if (
      !/^https?:$/.test(parsed.protocol) ||
      isRejectedWebsiteSearchHost(parsed.hostname)
    ) {
      return '';
    }
    return parsed.href.replace(/#.*$/, '');
  } catch {
    return '';
  }
}

export function extractOfficialWebsiteLinks(html: string, sourceUrl: string) {
  const prioritized: string[] = [];
  const candidates: string[] = [];
  const officialLinkWords =
    /(?:official\s+(?:website|site)|website|homepage|site\s+officiel|sitio\s+oficial|site\s+oficial|offizielle\s+webseite|sito\s+ufficiale|resmi\s+(?:web\s+)?sitesi|situs\s+resmi|الموقع\s+الرسمي|وب\s*سائٹ|ওয়েবসাইট|वेबसाइट|官方网站|官方網站|公式サイト|официальный\s+сайт)/i;
  const addCandidate = (rawValue: string, label = '') => {
    const website = decodedOfficialWebsiteValue(rawValue, sourceUrl);
    if (
      !website ||
      prioritized.includes(website) ||
      candidates.includes(website)
    ) {
      return;
    }
    if (officialLinkWords.test(label)) prioritized.push(website);
    else candidates.push(website);
  };

  for (const anchor of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
    const href = anchor[0].match(
      /\b(?:href|data-lynx-uri)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i,
    );
    addCandidate(
      href?.[1] ?? href?.[2] ?? href?.[3] ?? '',
      websiteHtmlToText(anchor[0]),
    );
  }

  const decodedHTML = decodeWebsiteSearchValue(html).replace(/\\\//g, '/');
  for (const match of decodedHTML.matchAll(/https?:\/\/[^\s"'<>]+/gi)) {
    addCandidate(match[0]);
  }
  return [...prioritized, ...candidates].slice(0, 8);
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
  return normalizeLocalizedWebsiteText(value)
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
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

function websiteStrongLocationMatchesSelectedMosque(
  html: string,
  mosque: Mosque,
) {
  const pageText = websiteHtmlToText(html);
  const normalizedPageText = normalizedIdentityText(pageText);
  const city = normalizedIdentityText(mosqueCity(mosque));
  const cityMatches = containsNormalizedPhrase(normalizedPageText, city);
  const postalCode = mosque.address.match(/\b([A-Z]\d[A-Z])\s?(\d[A-Z]\d)\b/i);
  const normalizedPostalCode = postalCode
    ? `${postalCode[1]}${postalCode[2]}`.toLocaleLowerCase()
    : '';
  const compactPageText = pageText
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
  const streetNumber = mosque.address.match(/\b(\d{3,6})\b/)?.[1] ?? '';
  return (
    Boolean(
      normalizedPostalCode && compactPageText.includes(normalizedPostalCode),
    ) || Boolean(streetNumber && cityMatches && pageText.includes(streetNumber))
  );
}

function publishedScheduleScore(schedule: PublishedMosquePrayerSchedule) {
  return masjidAyeshaPrayerNames.reduce(
    (total, name) =>
      total + (schedule.adhan[name] ? 1 : 0) + (schedule.iqamah[name] ? 2 : 0),
    Math.min(schedule.jummah.length, 3) * 2,
  );
}

function mergePublishedSchedules(
  schedules: PublishedMosquePrayerSchedule[],
): PublishedMosquePrayerSchedule {
  const ranked = [...schedules].sort(
    (left, right) =>
      publishedScheduleScore(right) - publishedScheduleScore(left),
  );
  const best = ranked[0];
  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  for (const schedule of ranked) {
    for (const name of masjidAyeshaPrayerNames) {
      if (!adhan[name] && schedule.adhan[name]) {
        adhan[name] = schedule.adhan[name];
      }
      if (!iqamah[name] && schedule.iqamah[name]) {
        iqamah[name] = schedule.iqamah[name];
      }
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

function hasCompletePublishedSchedule(schedule: PublishedMosquePrayerSchedule) {
  const adhanCount = masjidAyeshaPrayerNames.filter(
    name => schedule.adhan[name],
  ).length;
  const iqamahCount = masjidAyeshaPrayerNames.filter(
    name => schedule.iqamah[name],
  ).length;
  return adhanCount >= 4 && iqamahCount >= 4;
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
  const response = await fetchWithTimeout(sourceUrl, 6500);
  let html: string;
  let resolvedSourceUrl = response.url || sourceUrl;
  if (response.ok) {
    html = await response.text();
  } else if (
    // Bot protection answers plain requests with a challenge page; a real
    // web view can usually pass it.
    [403, 429, 503].includes(response.status) &&
    Platform.OS === 'ios' &&
    NativeAppleMapsSearch
  ) {
    resolvedSourceUrl = sourceUrl.replace(/^http:/i, 'https:');
    html = await NativeAppleMapsSearch.extractRenderedWebsiteHTML(
      resolvedSourceUrl,
    );
  } else {
    throw new Error('The official website could not be reached.');
  }
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
      websiteStrongLocationMatchesSelectedMosque(html, mosque)
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
  if (schedules.some(hasCompletePublishedSchedule)) {
    return mergePublishedSchedules(schedules);
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
    const linkedResponse = await fetchWithTimeout(link, 5500);
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
        const dataResponse = await fetchWithTimeout(endpoint, 5000);
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
        const scriptResponse = await fetchWithTimeout(scriptUrl, 5500);
        if (!scriptResponse.ok) {
          throw new Error('The mosque website application could not be read.');
        }
        const script = await scriptResponse.text();
        const endpoints = extractPrayerDataEndpoints(script, resolvedSourceUrl);
        if (!endpoints.length) {
          throw new Error(
            'No prayer data endpoint was found in the website app.',
          );
        }
        const endpointResults = await Promise.allSettled(
          endpoints.map(async endpoint => {
            const dataResponse = await fetchWithTimeout(endpoint, 5000);
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
          websiteStrongLocationMatchesSelectedMosque(renderedHTML, mosque)
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

  return mergePublishedSchedules(schedules);
}

type WebsiteScheduleResult = {
  schedule: PublishedMosquePrayerSchedule;
  website: string;
};

type DiscoveredWebsiteScheduleResult = WebsiteScheduleResult & {
  foundBySearch: boolean;
};

const discoveredMosqueWebsiteCache = new Map<string, string>();
const discoveredMosqueWebsiteRequests = new Map<string, Promise<string>>();

function mosqueWebsiteCacheKey(mosque: Mosque) {
  return `${normalizedMosqueName(mosque.name)}:${mosque.latitude.toFixed(
    4,
  )}:${mosque.longitude.toFixed(4)}`;
}

export function knownOfficialMosqueWebsite(mosque: Mosque) {
  if (isMasjidAyesha(mosque)) return MASJID_AYESHA_PRAYER_TIMES_URL;
  if (isAlFaruqCentre(mosque)) return AL_FARUQ_CENTRE_WEBSITE_URL;
  if (isDarulIlmiEdmonton(mosque)) return DARUL_ILMI_EDMONTON_WEBSITE_URL;
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

function firstSuccessfulRequest<T>(requests: Promise<T>[]) {
  return new Promise<T>((resolve, reject) => {
    if (!requests.length) {
      reject(new Error('No requests were available.'));
      return;
    }
    let failures = 0;
    let lastFailure: unknown;
    for (const request of requests) {
      request.then(resolve, failure => {
        failures += 1;
        lastFailure = failure;
        if (failures === requests.length) reject(lastFailure);
      });
    }
  });
}

async function verifyOfficialMosqueWebsite(mosque: Mosque, website: string) {
  const response = await fetchWithTimeout(website, 5500, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language':
        'en,ar;q=0.9,fr;q=0.8,es;q=0.8,ur;q=0.8,ru;q=0.8,zh;q=0.7',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    },
  });
  if (!response.ok) throw new Error('The mosque website could not be reached.');
  const html = await response.text();
  if (
    !websiteMatchesSelectedMosque(html, mosque) &&
    !websiteStrongLocationMatchesSelectedMosque(html, mosque)
  ) {
    throw new Error('The website identity did not match the selected mosque.');
  }
  return response.url || website;
}

function socialWebsiteValues(mosque: Mosque) {
  return [mosque.website, ...(mosque.websiteCandidates ?? [])].filter(
    (value, index, values): value is string => {
      if (!value || values.indexOf(value) !== index) return false;
      try {
        return isSocialWebsiteHost(new URL(value).hostname);
      } catch {
        return false;
      }
    },
  );
}

async function websitesLinkedFromSocialPages(mosque: Mosque) {
  const results = await Promise.allSettled(
    socialWebsiteValues(mosque)
      .slice(0, 3)
      .map(async socialWebsite => {
        const response = await fetchWithTimeout(socialWebsite, 5000, {
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': '*',
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
          },
        });
        if (!response.ok) return [];
        return extractOfficialWebsiteLinks(
          await response.text(),
          response.url || socialWebsite,
        );
      }),
  );
  return results.flatMap(result =>
    result.status === 'fulfilled' ? result.value : [],
  );
}

/**
 * Official websites recorded for the mosque in open data: OpenStreetMap tags
 * (via Nominatim), the Wikidata "official website" of a tagged item, and the
 * site the mosque lists on Mawaqit. These beat web search, which is often
 * blocked or confused by short names.
 */
async function websitesFromOpenData(mosque: Mosque) {
  const openStreetMap = (async () => {
    const span = 0.02;
    const viewbox = [
      mosque.longitude - span,
      mosque.latitude + span,
      mosque.longitude + span,
      mosque.latitude - span,
    ].join(',');
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&bounded=1&limit=3&viewbox=${viewbox}&q=${encodeURIComponent(
        mosque.name,
      )}`,
      6000,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Sakinah/1.0 (prayer times app)',
        },
      },
    );
    if (!response.ok) return [];
    const places: any[] = await response.json();
    const websites: string[] = [];
    const wikidataIds: string[] = [];
    for (const place of Array.isArray(places) ? places : []) {
      const tags = place?.extratags ?? {};
      for (const key of [
        'website',
        'contact:website',
        'url',
        'contact:facebook',
        'facebook',
      ]) {
        if (typeof tags[key] === 'string') websites.push(tags[key]);
      }
      if (/^Q\d+$/.test(tags.wikidata ?? '')) wikidataIds.push(tags.wikidata);
    }
    const wikidataWebsites = await Promise.allSettled(
      wikidataIds.slice(0, 2).map(async id => {
        const entity = await fetchWithTimeout(
          `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`,
          6000,
          { headers: { Accept: 'application/json' } },
        );
        if (!entity.ok) return [];
        const payload = await entity.json();
        const claims = payload?.entities?.[id]?.claims?.P856 ?? [];
        return claims
          .map((claim: any) => claim?.mainsnak?.datavalue?.value)
          .filter(
            (value: unknown): value is string => typeof value === 'string',
          );
      }),
    );
    return [
      ...websites,
      ...wikidataWebsites.flatMap(result =>
        result.status === 'fulfilled' ? result.value : [],
      ),
    ];
  })();
  const mawaqit = fetchMawaqitNearbyCandidates(mosque).then(matches =>
    matches
      .map(match => match.candidate.site)
      .filter((site): site is string => typeof site === 'string' && !!site),
  );
  const results = await Promise.allSettled([openStreetMap, mawaqit]);
  return results.flatMap(result =>
    result.status === 'fulfilled' ? result.value : [],
  );
}

export async function findOfficialMosqueWebsite(mosque: Mosque) {
  const cacheKey = mosqueWebsiteCacheKey(mosque);
  const cached = discoveredMosqueWebsiteCache.get(cacheKey);
  if (cached) return cached;
  const activeRequest = discoveredMosqueWebsiteRequests.get(cacheKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const listedWebsites = uniqueWebsiteCandidates([
      knownOfficialMosqueWebsite(mosque),
      mosque.website,
      ...(mosque.websiteCandidates ?? []),
    ]);
    const listedRequest = firstSuccessfulRequest(
      listedWebsites.map(website =>
        verifyOfficialMosqueWebsite(mosque, website),
      ),
    );
    const discoveryRequest = (async () => {
      const discoveries = await Promise.allSettled([
        websitesFromOpenData(mosque),
        websitesLinkedFromSocialPages(mosque),
        searchForOfficialMosqueWebsites(mosque),
      ]);
      const websites = uniqueWebsiteCandidates(
        discoveries.flatMap(result =>
          result.status === 'fulfilled' ? result.value : [],
        ),
      ).filter(website => !listedWebsites.includes(website));
      return firstSuccessfulRequest(
        websites
          .slice(0, 8)
          .map(website => verifyOfficialMosqueWebsite(mosque, website)),
      );
    })();
    const website = await firstSuccessfulRequest([
      listedRequest,
      discoveryRequest,
    ]);
    discoveredMosqueWebsiteCache.set(cacheKey, website);
    return website;
  })().finally(() => {
    if (discoveredMosqueWebsiteRequests.get(cacheKey) === request) {
      discoveredMosqueWebsiteRequests.delete(cacheKey);
    }
  });
  discoveredMosqueWebsiteRequests.set(cacheKey, request);
  return request;
}

async function searchForOfficialMosqueWebsites(mosque: Mosque) {
  const city = mosqueCity(mosque);
  const identity = [mosque.name, city].filter(Boolean).join(' ');
  const qualifiers = ['official website prayer times'];
  if (/\p{Script=Latin}/u.test(identity)) {
    qualifiers.push(
      '"site officiel" OR "sitio oficial" OR "site oficial" OR "offizielle Webseite" OR "sito ufficiale" OR "resmi web sitesi" OR "situs resmi"',
    );
  }
  if (/[\u0600-\u06ff]/.test(identity) || isKarbalaMosque(mosque)) {
    qualifiers.push(
      'الموقع الرسمي مواقيت الصلاة OR ویب سائٹ نماز کے اوقات OR وب‌سایت رسمی اوقات نماز',
    );
  }
  if (/[\u0400-\u04ff]/.test(identity)) {
    qualifiers.push('официальный сайт время намаза');
  }
  if (/[\u3400-\u9fff]/.test(identity)) {
    qualifiers.push('官方网站 礼拜时间 OR 官方網站 禮拜時間');
  }
  if (/[\u3040-\u30ff]/.test(identity)) {
    qualifiers.push('公式サイト 礼拝時間');
  }
  if (/[\u0900-\u097f]/.test(identity)) {
    qualifiers.push('आधिकारिक वेबसाइट नमाज़ का समय');
  }
  if (/[\u0980-\u09ff]/.test(identity)) {
    qualifiers.push('অফিসিয়াল ওয়েবসাইট নামাজের সময়');
  }
  if (/[\u0b80-\u0bff]/.test(identity)) {
    qualifiers.push('அதிகாரப்பூர்வ இணையதளம் தொழுகை நேரம்');
  }
  if (/[\u0e00-\u0e7f]/.test(identity)) {
    qualifiers.push('เว็บไซต์อย่างเป็นทางการ เวลาละหมาด');
  }
  if (/[\uac00-\ud7af]/.test(identity)) {
    qualifiers.push('공식 웹사이트 기도 시간');
  }
  const results = await Promise.allSettled(
    qualifiers.flatMap(qualifier => {
      const query = `${identity} ${qualifier}`.trim();
      return [
        (async () => {
          const response = await fetchWithTimeout(
            `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
            6500,
            {
              headers: {
                Accept: 'text/html,application/xhtml+xml',
                'Accept-Language':
                  'en,ar;q=0.9,fr;q=0.8,es;q=0.8,ur;q=0.8,fa;q=0.8,ru;q=0.8,zh;q=0.7,hi;q=0.7,bn;q=0.7,tr;q=0.7,id;q=0.7',
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
            6500,
            {
              headers: {
                Accept: 'application/rss+xml,application/xml,text/xml',
                'Accept-Language':
                  'en,ar;q=0.9,fr;q=0.8,es;q=0.8,ur;q=0.8,fa;q=0.8,ru;q=0.8,zh;q=0.7,hi;q=0.7,bn;q=0.7,tr;q=0.7,id;q=0.7',
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

  let cancelDelayedSearch: (() => void) | undefined;
  const searchRequest = new Promise<DiscoveredWebsiteScheduleResult>(
    (resolve, reject) => {
      const timeout = setTimeout(async () => {
        cancelDelayedSearch = undefined;
        try {
          const discoveredWebsite = await findOfficialMosqueWebsite(mosque);
          if (listedWebsites.includes(discoveredWebsite)) {
            throw new Error('No verified official mosque website was found.');
          }
          const result = await firstSuccessfulWebsiteSchedule(
            [discoveredWebsite],
            mosque,
            true,
          );
          resolve({ ...result, foundBySearch: true });
        } catch (failure) {
          reject(failure);
        }
      }, 1200);
      cancelDelayedSearch = () => {
        clearTimeout(timeout);
        reject(new Error('A listed official website succeeded.'));
      };
    },
  );
  const listedRequest = firstSuccessfulWebsiteSchedule(
    listedWebsites,
    mosque,
  ).then((result): DiscoveredWebsiteScheduleResult => {
    cancelDelayedSearch?.();
    return { ...result, foundBySearch: false };
  });
  const result = await firstSuccessfulRequest([listedRequest, searchRequest]);
  if (result.foundBySearch) {
    discoveredMosqueWebsiteCache.set(cacheKey, result.website);
  }
  return {
    ...result.schedule,
    officialWebsiteUrl: result.website,
    sourceLabel: result.foundBySearch
      ? `${result.schedule.sourceLabel} · found by web search`
      : result.schedule.sourceLabel,
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
  return normalizeLocalizedWebsiteText(value)
    .toLocaleLowerCase()
    .replace(
      /\b(mosque|masjid|islamic|muslim|centre|center|community|jamia|jami|mosquee|moschea|moschee|mezquita|mescit|camii)\b/g,
      ' ',
    )
    .replace(
      /(?:مسجد|جامع|مركز\s+اسلامي|مرکز\s+اسلامی|মসজিদ|मस्जिद|मस्जिद|清真寺|モスク|모스크|мечеть|џамија|xhamia|msikiti)/giu,
      ' ',
    )
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
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

const COMMUNITY_SCHEDULE_MAX_AGE_MS = 35 * 24 * 60 * 60 * 1000;

function minutesInTimeZone(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date);
  const part = (type: string) =>
    Number(parts.find(item => item.type === type)?.value);
  return part('hour') * 60 + part('minute');
}

// How far a published time may sit from the astronomical time, in minutes.
// Wide enough for any calculation method, madhab or jama'ah delay.
const plausibleWindows: Record<MasjidAyeshaPrayerName, [number, number]> = {
  Fajr: [-50, 150],
  Dhuhr: [-20, 180],
  Asr: [-40, 180],
  Maghrib: [-10, 60],
  Isha: [-80, 180],
};

/**
 * Drops published times that cannot belong to today at this mosque, such as a
 * previous season's timetable or another city's times. Returns null when too
 * little survives to be useful.
 */
export function plausiblePublishedSchedule(
  schedule: PublishedMosquePrayerSchedule,
  origin: Coordinates,
  timeZone?: string,
  date = new Date(),
): PublishedMosquePrayerSchedule | null {
  const calculated = calculatePrayerSchedule(origin, date).dates;
  const sunrise = minutesInTimeZone(calculated.Sunrise, timeZone);
  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  for (const name of masjidAyeshaPrayerNames) {
    const expected = minutesInTimeZone(calculated[name], timeZone);
    const [earliest, latest] = plausibleWindows[name];
    const fits = (value?: string) => {
      if (!value) return false;
      const minutes = displayTimeMinutes(value);
      if (!Number.isFinite(minutes)) return false;
      const difference = ((minutes - expected + 2160) % 1440) - 720;
      if (difference < earliest || difference > latest) return false;
      // A Fajr time just before sunrise is almost always Shuruq mislabelled.
      return name !== 'Fajr' || minutes <= sunrise - 10;
    };
    if (fits(schedule.adhan[name])) adhan[name] = schedule.adhan[name];
    if (fits(schedule.iqamah[name])) iqamah[name] = schedule.iqamah[name];
  }
  const kept = masjidAyeshaPrayerNames.filter(
    name => adhan[name] || iqamah[name],
  ).length;
  if (kept < 3 && !(kept && schedule.jummah.length)) return null;
  return { ...schedule, adhan, iqamah };
}

/** Today's times from Mawaqit, which many mosques in Europe and Africa maintain. */
export function parseMawaqitSearchResult(
  candidate: any,
): PublishedMosquePrayerSchedule | null {
  const times: unknown[] = Array.isArray(candidate?.times)
    ? candidate.times
    : [];
  if (times.length < 6) return null;
  const adhan: PublishedMosquePrayerSchedule['adhan'] = {};
  const iqamah: PublishedMosquePrayerSchedule['iqamah'] = {};
  // Usually [Fajr, Shuruq, Dhuhr, Asr, Maghrib, Isha], but some mosques add
  // an extra morning entry, so read the last four from the end.
  const last = times.length - 1;
  const timeIndexes: Array<[MasjidAyeshaPrayerName, number]> = [
    ['Fajr', 0],
    ['Dhuhr', last - 3],
    ['Asr', last - 2],
    ['Maghrib', last - 1],
    ['Isha', last],
  ];
  timeIndexes.forEach(([name, index], iqamaIndex) => {
    const start = displayClockTime(times[index]);
    if (!start) return;
    adhan[name] = start;
    const iqama = String(candidate.iqama?.[iqamaIndex] ?? '').trim();
    if (candidate.iqamaEnabled === false || !iqama) return;
    const offset = iqama.match(/^\+?(\d{1,3})$/);
    iqamah[name] = offset
      ? addMinutesToDisplayTime(start, Number(offset[1]))
      : displayClockTime(iqama);
  });
  if (Object.keys(adhan).length < 5) return null;
  const jummah = [candidate.jumua, candidate.jumua2, candidate.jumua3]
    .map(displayClockTime)
    .filter(Boolean);
  const slug = typeof candidate.slug === 'string' ? candidate.slug : '';
  return {
    adhan,
    iqamah,
    jummah,
    sourceName: String(candidate.name ?? ''),
    sourceUrl: slug ? `https://mawaqit.net/en/${slug}` : 'https://mawaqit.net/',
    officialWebsiteUrl:
      typeof candidate.site === 'string' && candidate.site
        ? candidate.site
        : undefined,
    sourceLabel: 'Mawaqit',
    verified: true,
    fetchedAt: new Date().toISOString(),
  };
}

type MawaqitMatch = { candidate: any; nameScore: number; distance: number };

async function fetchMawaqitNearbyCandidates(mosque: Mosque) {
  const response = await fetchWithTimeout(
    `https://mawaqit.net/api/2.0/mosque/search?lat=${mosque.latitude}&lon=${mosque.longitude}`,
    6000,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) throw new Error('Mawaqit search failed.');
  const payload = await response.json();
  const candidates: any[] = Array.isArray(payload) ? payload : [];
  return candidates
    .map(
      (candidate): MawaqitMatch => ({
        candidate,
        nameScore: Math.max(
          mosqueNameScore(mosque.name, String(candidate.name ?? '')),
          mosqueNameScore(mosque.name, String(candidate.label ?? '')),
        ),
        distance:
          Number.isFinite(candidate.latitude) &&
          Number.isFinite(candidate.longitude)
            ? distanceKm(mosque, {
                latitude: candidate.latitude,
                longitude: candidate.longitude,
              }) * 1000
            : Number(candidate.proximity ?? Number.POSITIVE_INFINITY),
      }),
    )
    .filter(
      match =>
        !match.candidate.closed &&
        (match.distance <= 60 ||
          (match.nameScore >= 0.5 && match.distance <= 1500) ||
          (match.nameScore >= 0.34 && match.distance <= 250)),
    )
    .sort(
      (left, right) =>
        right.nameScore - left.nameScore || left.distance - right.distance,
    );
}

async function fetchMawaqitSchedule(mosque: Mosque) {
  for (const { candidate } of await fetchMawaqitNearbyCandidates(mosque)) {
    const schedule = parseMawaqitSearchResult(candidate);
    if (schedule) return schedule;
  }
  return null;
}

export async function fetchMosqueIqamahSchedule(
  mosque: Mosque,
  adhanTimings?: PrayerTimings,
): Promise<MosqueIqamahSchedule | null> {
  const response = await fetchWithTimeout(
    `https://takbeertime.com/api/mosques/nearby?lat=${mosque.latitude}&lng=${mosque.longitude}&radius=2500&limit=20`,
    5000,
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
    // Unverified community entries are often seeded once and never updated,
    // so after a few weeks they show another season's times.
    const updatedAt = Date.parse(
      candidate.effectiveKeeperUpdatedAt ??
        candidate.prayerSchedules?.[0]?.updatedAt ??
        '',
    );
    const verifiedKeeper =
      candidate.effectiveKeeperIsVerifiedSchedule === true ||
      candidate.prayerSchedules?.some(
        (schedule: any) => schedule.verificationStatus === 'verified',
      );
    if (
      !verifiedKeeper &&
      (!Number.isFinite(updatedAt) ||
        Date.now() - updatedAt > COMMUNITY_SCHEDULE_MAX_AGE_MS)
    ) {
      continue;
    }
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

function takbeerTimeSchedule(
  published: MosqueIqamahSchedule,
): PublishedMosquePrayerSchedule {
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

/** Fills prayers the primary source left blank from the supporting ones. */
function withSupportingSchedules(
  primary: PublishedMosquePrayerSchedule,
  supporting: PublishedMosquePrayerSchedule[],
) {
  const adhan = { ...primary.adhan };
  const iqamah = { ...primary.iqamah };
  let jummah = primary.jummah.slice(0, 3);
  const used = new Set<string>();
  let maghribUsesPublishedOffset = primary.maghribUsesPublishedOffset ?? false;
  for (const schedule of supporting) {
    for (const name of masjidAyeshaPrayerNames) {
      if (!adhan[name] && schedule.adhan[name]) {
        adhan[name] = schedule.adhan[name];
        used.add(schedule.sourceLabel);
      }
      if (!iqamah[name] && schedule.iqamah[name]) {
        iqamah[name] = schedule.iqamah[name];
        used.add(schedule.sourceLabel);
        if (name === 'Maghrib' && schedule.maghribUsesPublishedOffset) {
          maghribUsesPublishedOffset = true;
        }
      }
    }
    if (!jummah.length && schedule.jummah.length) {
      jummah = schedule.jummah.slice(0, 3);
      used.add(schedule.sourceLabel);
    }
  }
  const supportingSchedules = supporting.filter(schedule =>
    used.has(schedule.sourceLabel),
  );
  return {
    ...primary,
    adhan,
    iqamah,
    jummah,
    sourceLabel: [
      primary.sourceLabel,
      ...supportingSchedules.map(schedule =>
        schedule.sourceLabel.replace(
          /^(Verified )?Takbeer Time.*$/,
          'Takbeer Time',
        ),
      ),
    ].join(' + '),
    verified:
      primary.verified &&
      supportingSchedules.every(schedule => schedule.verified),
    maghribUsesPublishedOffset,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchPublishedMosquePrayerScheduleUncached(
  mosque: Mosque,
  timeZone?: string,
): Promise<PublishedMosquePrayerSchedule> {
  const [websiteResult, mawaqitResult, appResult, karbalaResult] =
    await Promise.allSettled([
      settleWithin(
        fetchVerifiedMosqueWebsiteSchedule(mosque),
        20000,
        'The mosque website lookup took too long.',
      ),
      settleWithin(
        fetchMawaqitSchedule(mosque),
        7000,
        'The Mawaqit lookup took too long.',
      ),
      settleWithin(
        fetchMosqueIqamahSchedule(mosque),
        6000,
        'The schedule app lookup took too long.',
      ),
      isKarbalaMosque(mosque)
        ? settleWithin(
            fetchAlKafeelKarbalaPrayerSchedule(mosque),
            6500,
            'The Karbala schedule lookup took too long.',
          )
        : Promise.resolve(null),
    ]);

  // Best source first: the mosque's own website, then Mawaqit (also run by the
  // mosque), then Takbeer Time. Each is checked against the sky before use.
  const candidates = [
    websiteResult.status === 'fulfilled' ? websiteResult.value : null,
    mawaqitResult.status === 'fulfilled' ? mawaqitResult.value : null,
    appResult.status === 'fulfilled' && appResult.value
      ? takbeerTimeSchedule(appResult.value)
      : null,
    karbalaResult.status === 'fulfilled' ? karbalaResult.value : null,
  ]
    .filter((schedule): schedule is PublishedMosquePrayerSchedule =>
      Boolean(schedule),
    )
    .map(schedule => plausiblePublishedSchedule(schedule, mosque, timeZone))
    .filter((schedule): schedule is PublishedMosquePrayerSchedule =>
      Boolean(schedule),
    );

  if (candidates.length) {
    const [primary, ...supporting] = candidates;
    return supporting.length
      ? withSupportingSchedules(primary, supporting)
      : primary;
  }

  throw new Error(
    mosque.website
      ? 'No published prayer schedule was found on this masjid’s website or supported schedule apps.'
      : 'This masjid has no published schedule in a supported app or official website listing.',
  );
}

type PublishedScheduleFetchOptions = {
  forceRefresh?: boolean;
  /** Time zone of the mosque, when it differs from the device's. */
  timeZone?: string;
};

type PublishedScheduleCacheEntry = {
  expiresAt: number;
  schedule: PublishedMosquePrayerSchedule;
};

const PUBLISHED_SCHEDULE_CACHE_TTL_MS = 15 * 60 * 1000;
const publishedScheduleCache = new Map<string, PublishedScheduleCacheEntry>();
const publishedScheduleRequests = new Map<
  string,
  Promise<PublishedMosquePrayerSchedule>
>();

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function publishedScheduleCacheKey(mosque: Mosque) {
  return `${mosqueWebsiteCacheKey(mosque)}:${localDateKey()}`;
}

export function clearPublishedMosquePrayerScheduleCache() {
  publishedScheduleCache.clear();
  publishedScheduleRequests.clear();
}

export async function fetchPublishedMosquePrayerSchedule(
  mosque: Mosque,
  options: PublishedScheduleFetchOptions = {},
): Promise<PublishedMosquePrayerSchedule> {
  const cacheKey = publishedScheduleCacheKey(mosque);
  const cached = publishedScheduleCache.get(cacheKey);
  if (!options.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.schedule;
  }

  const activeRequest = publishedScheduleRequests.get(cacheKey);
  if (!options.forceRefresh && activeRequest) return activeRequest;

  const networkRequest = fetchPublishedMosquePrayerScheduleUncached(
    mosque,
    options.timeZone,
  ).then(schedule => {
    publishedScheduleCache.set(cacheKey, {
      expiresAt: Date.now() + PUBLISHED_SCHEDULE_CACHE_TTL_MS,
      schedule,
    });
    return schedule;
  });
  const boundedRequest = settleWithin(
    networkRequest,
    22000,
    'The published schedule lookup took too long.',
  )
    .catch(failure => {
      if (cached) return cached.schedule;
      throw failure;
    })
    .finally(() => {
      if (publishedScheduleRequests.get(cacheKey) === boundedRequest) {
        publishedScheduleRequests.delete(cacheKey);
      }
    });
  publishedScheduleRequests.set(cacheKey, boundedRequest);
  return boundedRequest;
}
