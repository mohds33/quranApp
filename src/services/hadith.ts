export type FullSahihId = 'bukhari' | 'muslim';

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

const sources: Record<
  FullSahihId,
  { dataUrl: string; sourceUrl: string; version: string }
> = {
  bukhari: {
    dataUrl:
      'https://raw.githubusercontent.com/AhmedBaset/hadith-json/v1.2.0/db/by_book/the_9_books/bukhari.json',
    sourceUrl: 'https://github.com/AhmedBaset/hadith-json/tree/v1.2.0',
    version: 'v1.2.0',
  },
  muslim: {
    dataUrl:
      'https://raw.githubusercontent.com/AhmedBaset/hadith-json/v1.2.0/db/by_book/the_9_books/muslim.json',
    sourceUrl: 'https://github.com/AhmedBaset/hadith-json/tree/v1.2.0',
    version: 'v1.2.0',
  },
};

const cache: Partial<Record<FullSahihId, FullHadithBook>> = {};

export function getFullSahihSource(bookId: string) {
  return sources[bookId as FullSahihId];
}

export async function fetchFullSahihBook(
  bookId: string,
): Promise<FullHadithBook> {
  const id = bookId as FullSahihId;
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
