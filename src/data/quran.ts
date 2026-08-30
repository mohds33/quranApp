import quranBengali from 'quran-json/dist/quran_bn.json';
import quranChinese from 'quran-json/dist/quran_zh.json';
import quranEnglish from 'quran-json/dist/quran_en.json';
import quranFrench from 'quran-json/dist/quran_fr.json';
import quranIndonesian from 'quran-json/dist/quran_id.json';
import quranRussian from 'quran-json/dist/quran_ru.json';
import quranSpanish from 'quran-json/dist/quran_es.json';
import quranSwedish from 'quran-json/dist/quran_sv.json';
import quranTurkish from 'quran-json/dist/quran_tr.json';
import quranUrdu from 'quran-json/dist/quran_ur.json';
import quranPersian from './quran_fa.json';

export type Ayah = {
  number: string;
  arabic: string;
  translation: string;
};

export type Surah = {
  number: string;
  name: string;
  meaning: string;
  arabicName: string;
  verseCount: string;
  revelationType: 'Meccan' | 'Medinan';
  ayahs: Ayah[];
};

type QuranVerseJSON = {
  id: number;
  text: string;
  translation: string;
};

type QuranChapterJSON = {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: 'meccan' | 'medinan';
  total_verses: number;
  verses: QuranVerseJSON[];
};

type PersianQuranJSON = {
  surahs: Array<{
    ayahs: Array<{ numberInSurah: number; text: string }>;
  }>;
};

export const quranLanguageOptions = [
  { code: 'en', label: 'English', translator: 'Saheeh International' },
  { code: 'bn', label: 'Bengali', translator: 'Muhiuddin Khan' },
  { code: 'zh', label: 'Chinese', translator: 'Muhammad Makin' },
  { code: 'es', label: 'Spanish', translator: 'Muhammad Isa García' },
  { code: 'fr', label: 'French', translator: 'Muhammad Hamidullah' },
  {
    code: 'fa',
    label: 'Farsi',
    translator: 'Mohammad Mahdi Fooladvand',
  },
  {
    code: 'id',
    label: 'Indonesian',
    translator: 'Indonesian Ministry of Religious Affairs',
  },
  { code: 'ru', label: 'Russian', translator: 'Elmir Kuliev' },
  { code: 'sv', label: 'Swedish', translator: 'Knut Bernström' },
  {
    code: 'tr',
    label: 'Turkish',
    translator: 'Directorate of Religious Affairs',
  },
  { code: 'ur', label: 'Urdu', translator: "Abul A'la Maududi" },
] as const;

export type QuranLanguageCode = (typeof quranLanguageOptions)[number]['code'];

export const quranReadingTraditions = [
  { key: 'hafs', label: 'Hafs ‘an ‘Asim', available: true },
  { key: 'shubah', label: 'Shu‘bah ‘an ‘Asim', available: false },
  { key: 'warsh', label: 'Warsh ‘an Nafi‘', available: false },
  { key: 'qalun', label: 'Qalun ‘an Nafi‘', available: false },
  { key: 'duri_abu_amr', label: 'Al-Duri ‘an Abi ‘Amr', available: false },
  { key: 'susi', label: 'Al-Susi ‘an Abi ‘Amr', available: false },
  { key: 'bazzi', label: 'Al-Bazzi ‘an Ibn Kathir', available: false },
  { key: 'qunbul', label: 'Qunbul ‘an Ibn Kathir', available: false },
  { key: 'hisham', label: 'Hisham ‘an Ibn ‘Amir', available: false },
  { key: 'ibn_dhakwan', label: 'Ibn Dhakwan ‘an Ibn ‘Amir', available: false },
] as const;

const persianEdition = (quranEnglish as QuranChapterJSON[]).map(
  (chapter, chapterIndex) => ({
    ...chapter,
    verses: chapter.verses.map((verse, verseIndex) => ({
      ...verse,
      translation:
        (quranPersian as PersianQuranJSON).surahs[chapterIndex]?.ayahs[
          verseIndex
        ]?.text ?? verse.translation,
    })),
  }),
);

const quranEditions: Record<QuranLanguageCode, QuranChapterJSON[]> = {
  bn: quranBengali as QuranChapterJSON[],
  zh: quranChinese as QuranChapterJSON[],
  en: quranEnglish as QuranChapterJSON[],
  es: quranSpanish as QuranChapterJSON[],
  fr: quranFrench as QuranChapterJSON[],
  fa: persianEdition,
  id: quranIndonesian as QuranChapterJSON[],
  ru: quranRussian as QuranChapterJSON[],
  sv: quranSwedish as QuranChapterJSON[],
  tr: quranTurkish as QuranChapterJSON[],
  ur: quranUrdu as QuranChapterJSON[],
};

function buildSurahs(edition: QuranChapterJSON[]): Surah[] {
  return edition.map(chapter => ({
    number: String(chapter.id),
    name: chapter.transliteration,
    meaning: chapter.translation,
    arabicName: chapter.name,
    verseCount: String(chapter.total_verses),
    revelationType: chapter.type === 'meccan' ? 'Meccan' : 'Medinan',
    ayahs: chapter.verses.map(verse => ({
      number: String(verse.id),
      arabic: verse.text,
      translation: verse.translation,
    })),
  }));
}

const editions = Object.fromEntries(
  Object.entries(quranEditions).map(([code, edition]) => [
    code,
    buildSurahs(edition),
  ]),
) as Record<QuranLanguageCode, Surah[]>;

export const surahs = editions.en;

export function getSurahs(language: QuranLanguageCode = 'en') {
  return editions[language] ?? editions.en;
}

export const totalAyahCount = surahs.reduce(
  (total, surah) => total + surah.ayahs.length,
  0,
);
