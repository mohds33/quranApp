import hisnMuslim from './hisnMuslim.json';
import { getSurahs, type QuranLanguageCode } from './quran';

/**
 * Duas come from two places:
 * - Hisn al-Muslim (Sa'id al-Qahtani), the standard collection of duas from
 *   the Quran and authentic hadith, bundled offline from hisnmuslim.com.
 *   Its translation is English only.
 * - Duas spoken in the Quran, read from the bundled mushaf so they follow the
 *   reader's chosen translation language.
 */

export type Dua = {
  /** Stable id used for saving: "h<id>" for Hisn al-Muslim, "q<s>:<a>" for Quran. */
  key: string;
  arabic: string;
  transliteration?: string;
  translation: string;
  repeat: number;
  audio?: string;
  source: string;
};

export type DuaChapter = {
  id: number;
  title: string;
  arabicTitle: string;
  duas: Dua[];
};

export type DuaCategoryKey =
  | 'morningEvening'
  | 'sleep'
  | 'prayer'
  | 'daily'
  | 'food'
  | 'travel'
  | 'hardship'
  | 'forgiveness'
  | 'family'
  | 'illness'
  | 'nature'
  | 'hajj';

export type DuaCategory = {
  key: DuaCategoryKey;
  title: string;
  chapters: DuaChapter[];
};

type HisnChapterJSON = {
  id: number;
  title: string;
  arabicTitle: string;
  duas: Array<{
    id: number;
    arabic: string;
    transliteration: string;
    translation: string;
    repeat: number;
    audio?: string;
  }>;
};

const categoryChapters: Array<[DuaCategoryKey, string, number[]]> = [
  ['morningEvening', 'Morning & evening', [27]],
  ['sleep', 'Sleep & waking', [1, 28, 29, 30, 31]],
  [
    'prayer',
    'Prayer & mosque',
    [8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 32, 33],
  ],
  ['daily', 'Home & daily life', [2, 3, 4, 5, 6, 7, 10, 11, 77, 78, 110, 111]],
  ['food', 'Food & fasting', [67, 68, 69, 70, 71, 72, 73, 74, 75, 76]],
  ['travel', 'Travel', [95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105]],
  [
    'hardship',
    'Hardship & protection',
    [
      34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46, 88, 92, 94, 106, 122, 124,
      125, 126, 128,
    ],
  ],
  ['forgiveness', 'Forgiveness & dhikr', [44, 85, 107, 129, 130, 131]],
  [
    'family',
    'Family & others',
    [
      47, 48, 79, 80, 81, 82, 84, 86, 87, 89, 90, 91, 93, 108, 109, 112, 113,
      114, 123, 132,
    ],
  ],
  [
    'illness',
    'Illness & loss',
    [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 83],
  ],
  ['nature', 'Weather & nature', [61, 62, 63, 64, 65, 66]],
  ['hajj', 'Hajj & sacrifice', [115, 116, 117, 118, 119, 120, 121, 127]],
];

export const hisnChapters: DuaChapter[] = (hisnMuslim as HisnChapterJSON[]).map(
  chapter => ({
    id: chapter.id,
    title: chapter.title,
    arabicTitle: chapter.arabicTitle,
    duas: chapter.duas.map(dua => ({
      key: `h${dua.id}`,
      arabic: dua.arabic,
      transliteration: dua.transliteration || undefined,
      translation: dua.translation,
      repeat: dua.repeat,
      audio: dua.audio,
      source: `Hisn al-Muslim · ${chapter.title}`,
    })),
  }),
);

const chaptersById = new Map(
  hisnChapters.map(chapter => [chapter.id, chapter]),
);

export const duaCategories: DuaCategory[] = categoryChapters.map(
  ([key, title, ids]) => ({
    key,
    title,
    chapters: ids
      .map(id => chaptersById.get(id))
      .filter((chapter): chapter is DuaChapter => Boolean(chapter)),
  }),
);

export function categoryDuaCount(category: DuaCategory) {
  return category.chapters.reduce(
    (total, chapter) => total + chapter.duas.length,
    0,
  );
}

/** Supplications made in the Quran, as [surah, first ayah, last ayah]. */
const quranDuaRefs: Array<[number, number, number]> = [
  [1, 6, 7],
  [2, 127, 128],
  [2, 201, 201],
  [2, 250, 250],
  [2, 286, 286],
  [3, 8, 9],
  [3, 16, 16],
  [3, 38, 38],
  [3, 53, 53],
  [3, 147, 147],
  [3, 191, 194],
  [7, 23, 23],
  [7, 47, 47],
  [7, 126, 126],
  [10, 85, 86],
  [12, 101, 101],
  [14, 40, 41],
  [17, 24, 24],
  [17, 80, 80],
  [18, 10, 10],
  [20, 25, 28],
  [20, 114, 114],
  [21, 83, 83],
  [21, 87, 87],
  [21, 89, 89],
  [23, 29, 29],
  [23, 97, 98],
  [23, 109, 109],
  [23, 118, 118],
  [25, 65, 66],
  [25, 74, 74],
  [26, 83, 85],
  [27, 19, 19],
  [28, 16, 16],
  [28, 24, 24],
  [40, 7, 9],
  [46, 15, 15],
  [59, 10, 10],
  [60, 4, 5],
  [66, 8, 8],
  [71, 28, 28],
];

const quranDuaCache = new Map<QuranLanguageCode, Dua[]>();

export function getQuranDuas(language: QuranLanguageCode): Dua[] {
  const cached = quranDuaCache.get(language);
  if (cached) return cached;
  const surahs = getSurahs(language);
  const duas = quranDuaRefs.flatMap(([surahNumber, first, last]) => {
    const surah = surahs[surahNumber - 1];
    const ayahs = surah?.ayahs.slice(first - 1, last) ?? [];
    if (!surah || !ayahs.length) return [];
    const range = first === last ? `${first}` : `${first}–${last}`;
    return [
      {
        key: `q${surahNumber}:${first}`,
        arabic: ayahs.map(ayah => ayah.arabic).join(' ۝ '),
        translation: ayahs.map(ayah => ayah.translation).join(' '),
        repeat: 1,
        source: `${surah.name} · ${surahNumber}:${range}`,
      },
    ];
  });
  quranDuaCache.set(language, duas);
  return duas;
}

export function dailyDua(language: QuranLanguageCode, date = new Date()) {
  const duas = getQuranDuas(language);
  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
  );
  return duas[day % duas.length];
}

export function findDuas(keys: string[], language: QuranLanguageCode) {
  const all = new Map(
    [
      ...hisnChapters.flatMap(chapter => chapter.duas),
      ...getQuranDuas(language),
    ].map(dua => [dua.key, dua]),
  );
  return keys
    .map(key => all.get(key))
    .filter((dua): dua is Dua => Boolean(dua));
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٰٟۖ-ۭ]/g, '')
    .toLowerCase();
}

export type DuaSearchResult = { chapter?: DuaChapter; dua: Dua };

/** Matches chapter titles and dua text (Arabic, transliteration or translation). */
export function searchDuas(
  query: string,
  language: QuranLanguageCode,
  limit = 40,
): DuaSearchResult[] {
  const search = normalize(query.trim());
  if (search.length < 3) return [];
  const results: DuaSearchResult[] = [];
  const matches = (dua: Dua, title = '') =>
    [title, dua.arabic, dua.transliteration ?? '', dua.translation].some(text =>
      normalize(text).includes(search),
    );
  for (const chapter of hisnChapters) {
    for (const dua of chapter.duas) {
      if (matches(dua, chapter.title)) results.push({ chapter, dua });
      if (results.length >= limit) return results;
    }
  }
  for (const dua of getQuranDuas(language)) {
    if (matches(dua)) results.push({ dua });
    if (results.length >= limit) return results;
  }
  return results;
}
