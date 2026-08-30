export type FullHadithSourceId =
  | 'bukhari'
  | 'muslim'
  | 'abudawud'
  | 'tirmidhi'
  | 'nasai'
  | 'ibnmajah'
  | 'muwatta'
  | 'musnadahmad'
  | 'darimi'
  | 'riyad'
  | 'shamail'
  | 'bulugh'
  | 'adab'
  | 'mishkat'
  | 'nawawi40'
  | 'qudsi40'
  | 'shahwaliullah40';

export type HadithChapter = {
  id: number;
  arabic: string;
  english: string;
};

export type FullHadith = {
  id: number;
  idInBook: number;
  chapterId: number;
  arabic: string;
  english: {
    narrator: string;
    text: string;
  };
};

export type FullHadithBook = {
  title: string;
  author: string;
  length: number;
  chapters: HadithChapter[];
  hadiths: FullHadith[];
};

const sourceRoot =
  'https://raw.githubusercontent.com/AhmedBaset/hadith-json/v1.2.0/db/by_book';
const sourceUrl = 'https://github.com/AhmedBaset/hadith-json/tree/v1.2.0';
const sourcePaths: Record<FullHadithSourceId, string> = {
  bukhari: 'the_9_books/bukhari.json',
  muslim: 'the_9_books/muslim.json',
  abudawud: 'the_9_books/abudawud.json',
  tirmidhi: 'the_9_books/tirmidhi.json',
  nasai: 'the_9_books/nasai.json',
  ibnmajah: 'the_9_books/ibnmajah.json',
  muwatta: 'the_9_books/malik.json',
  musnadahmad: 'the_9_books/ahmed.json',
  darimi: 'the_9_books/darimi.json',
  riyad: 'other_books/riyad_assalihin.json',
  shamail: 'other_books/shamail_muhammadiyah.json',
  bulugh: 'other_books/bulugh_almaram.json',
  adab: 'other_books/aladab_almufrad.json',
  mishkat: 'other_books/mishkat_almasabih.json',
  nawawi40: 'forties/nawawi40.json',
  qudsi40: 'forties/qudsi40.json',
  shahwaliullah40: 'forties/shahwaliullah40.json',
};

const sources = Object.fromEntries(
  Object.entries(sourcePaths).map(([id, path]) => [
    id,
    { dataUrl: `${sourceRoot}/${path}`, sourceUrl, version: 'v1.2.0' },
  ]),
) as Record<
  FullHadithSourceId,
  { dataUrl: string; sourceUrl: string; version: string }
>;

const cache: Partial<Record<FullHadithSourceId, FullHadithBook>> = {};

export function getFullSahihSource(bookId: string) {
  return sources[bookId as FullHadithSourceId];
}

export async function fetchFullSahihBook(
  bookId: string,
): Promise<FullHadithBook> {
  const id = bookId as FullHadithSourceId;
  const source = sources[id];
  if (!source) throw new Error('A complete reader is not available yet.');
  if (cache[id]) return cache[id];

  const response = await fetch(source.dataUrl);
  if (!response.ok) {
    throw new Error('The full collection could not be downloaded.');
  }
  const payload = await response.json();
  if (!Array.isArray(payload.chapters) || !Array.isArray(payload.hadiths)) {
    throw new Error('The Hadith data returned an unexpected format.');
  }

  const result: FullHadithBook = {
    title: payload.metadata?.english?.title ?? '',
    author: payload.metadata?.english?.author ?? '',
    length: Number(payload.metadata?.length) || payload.hadiths.length,
    chapters: payload.chapters,
    hadiths: payload.hadiths,
  };
  cache[id] = result;
  return result;
}
