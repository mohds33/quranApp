import type { Surah } from '../data/quran';

export type AyahReference = {
  surah: string;
  ayah: string;
};

export type QuranVerseResult = AyahReference & {
  surahName: string;
  translation: string;
};

const MAX_BOOKMARKS = 500;
const MAX_VERSE_RESULTS = 40;

export function sameAyah(left: AyahReference, right: AyahReference) {
  return left.surah === right.surah && left.ayah === right.ayah;
}

export function validAyahReference(
  value: unknown,
  surahs: Surah[],
): AyahReference | null {
  const reference = value as Partial<AyahReference> | null;
  if (
    typeof reference?.surah !== 'string' ||
    typeof reference?.ayah !== 'string'
  ) {
    return null;
  }
  const surah = surahs.find(item => item.number === reference.surah);
  if (!surah?.ayahs.some(ayah => ayah.number === reference.ayah)) return null;
  return { surah: reference.surah, ayah: reference.ayah };
}

export function validAyahBookmarks(
  value: unknown,
  surahs: Surah[],
): AyahReference[] {
  if (!Array.isArray(value)) return [];
  const bookmarks: AyahReference[] = [];
  value.forEach(item => {
    const reference = validAyahReference(item, surahs);
    if (
      reference &&
      !bookmarks.some(existing => sameAyah(existing, reference))
    ) {
      bookmarks.push(reference);
    }
  });
  return bookmarks.slice(-MAX_BOOKMARKS);
}

export function toggleAyahBookmark(
  bookmarks: AyahReference[],
  reference: AyahReference,
) {
  return bookmarks.some(item => sameAyah(item, reference))
    ? bookmarks.filter(item => !sameAyah(item, reference))
    : [...bookmarks, reference].slice(-MAX_BOOKMARKS);
}

/** Parses "2:255", "2 255" or "2.255" into a verse that exists. */
export function parseAyahReference(
  query: string,
  surahs: Surah[],
): AyahReference | null {
  const match = query.trim().match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  if (!match) return null;
  return validAyahReference(
    { surah: String(Number(match[1])), ayah: String(Number(match[2])) },
    surahs,
  );
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٰٟۖ-ۭ]/g, '')
    .toLowerCase();
}

/** Full-text search across translations and Arabic, plus "surah:ayah" lookups. */
export function searchQuranVerses(
  query: string,
  surahs: Surah[],
  limit = MAX_VERSE_RESULTS,
): QuranVerseResult[] {
  const toResult = (surah: Surah, ayahNumber: string) => ({
    surah: surah.number,
    ayah: ayahNumber,
    surahName: surah.name,
    translation:
      surah.ayahs.find(ayah => ayah.number === ayahNumber)?.translation ?? '',
  });
  const reference = parseAyahReference(query, surahs);
  if (reference) {
    const surah = surahs.find(item => item.number === reference.surah)!;
    return [toResult(surah, reference.ayah)];
  }
  const search = normalize(query.trim());
  if (search.length < 3) return [];
  const results: QuranVerseResult[] = [];
  for (const surah of surahs) {
    for (const ayah of surah.ayahs) {
      if (
        normalize(ayah.translation).includes(search) ||
        normalize(ayah.arabic).includes(search)
      ) {
        results.push(toResult(surah, ayah.number));
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}
