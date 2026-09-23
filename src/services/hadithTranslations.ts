import type { QuranLanguageCode } from '../data/quran';

/**
 * Translated hadith from the open hadith-api collection, which numbers its
 * hadith the same way as the Arabic/English books the reader already loads,
 * so a translation can be matched to a hadith by its number.
 *
 * Only the languages and books published there can be translated; anything
 * else keeps the English text the book ships with.
 */

const translationLanguages: Partial<Record<QuranLanguageCode, string>> = {
  bn: 'ben',
  fr: 'fra',
  id: 'ind',
  ru: 'rus',
  tr: 'tur',
  ur: 'urd',
};

const translationBooks: Record<string, string> = {
  bukhari: 'bukhari',
  muslim: 'muslim',
  abudawud: 'abudawud',
  tirmidhi: 'tirmidhi',
  nasai: 'nasai',
  ibnmajah: 'ibnmajah',
  muwatta: 'malik',
  nawawi40: 'nawawi',
  qudsi40: 'qudsi',
  shahwaliullah40: 'dehlawi',
};

/** Books published in each language, from the collection's own index. */
const missingTranslations: Record<string, string[]> = {
  ben: ['qudsi', 'dehlawi'],
  fra: ['tirmidhi'],
  ind: ['nawawi', 'qudsi', 'dehlawi'],
  rus: ['tirmidhi', 'nasai', 'ibnmajah', 'malik', 'nawawi', 'qudsi', 'dehlawi'],
  tur: ['qudsi', 'dehlawi'],
  urd: ['nawawi', 'qudsi', 'dehlawi'],
};

export function hadithTranslationEdition(
  bookId: string,
  language: QuranLanguageCode,
) {
  const languageCode = translationLanguages[language];
  const book = translationBooks[bookId];
  if (!languageCode || !book) return null;
  if (missingTranslations[languageCode]?.includes(book)) return null;
  return `${languageCode}-${book}`;
}

type ChapterTranslations = Record<number, string>;

const cache = new Map<string, ChapterTranslations>();
const requests = new Map<string, Promise<ChapterTranslations>>();

/** The translated text of one chapter, keyed by hadith number. */
export async function fetchHadithChapterTranslations(
  edition: string,
  chapter: number,
): Promise<ChapterTranslations> {
  const key = `${edition}:${chapter}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const active = requests.get(key);
  if (active) return active;

  const request = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(
        `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition}/sections/${chapter}.min.json`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error('No translation for this chapter.');
      const payload = await response.json();
      const translations: ChapterTranslations = {};
      for (const hadith of payload?.hadiths ?? []) {
        const number = Number(hadith?.hadithnumber);
        const text = String(hadith?.text ?? '').trim();
        if (Number.isInteger(number) && text) translations[number] = text;
      }
      cache.set(key, translations);
      return translations;
    } catch {
      // Remember the miss so a chapter without a translation is asked for once.
      cache.set(key, {});
      return {};
    } finally {
      clearTimeout(timeout);
      requests.delete(key);
    }
  })();
  requests.set(key, request);
  return request;
}

export function clearHadithTranslationCache() {
  cache.clear();
  requests.clear();
}
