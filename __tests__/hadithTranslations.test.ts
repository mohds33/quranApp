import {
  clearHadithTranslationCache,
  fetchHadithChapterTranslations,
  hadithTranslationEdition,
} from '../src/services/hadithTranslations';

describe('hadith translation editions', () => {
  it('maps the app’s books and languages to published editions', () => {
    expect(hadithTranslationEdition('bukhari', 'ur')).toBe('urd-bukhari');
    expect(hadithTranslationEdition('muwatta', 'fr')).toBe('fra-malik');
    expect(
      hadithTranslationEdition('shahwaliullah40', 'ben' as any),
    ).toBeNull();
  });

  it('keeps English where no translation is published', () => {
    // English is the books' own text, and these have no published edition.
    expect(hadithTranslationEdition('bukhari', 'en')).toBeNull();
    expect(hadithTranslationEdition('bukhari', 'fa')).toBeNull();
    expect(hadithTranslationEdition('tirmidhi', 'fr')).toBeNull();
    expect(hadithTranslationEdition('nasai', 'ru')).toBeNull();
    expect(hadithTranslationEdition('riyad', 'ur')).toBeNull();
  });
});

describe('fetching a chapter of translations', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearHadithTranslationCache();
  });

  it('keys the text by hadith number and asks once per chapter', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        hadiths: [
          { hadithnumber: 1, text: ' پہلی حدیث ' },
          { hadithnumber: 2, text: 'دوسری حدیث' },
          { hadithnumber: 3, text: '   ' },
        ],
      }),
    }));
    globalThis.fetch = fetchMock as any;

    const first = await fetchHadithChapterTranslations('urd-bukhari', 1);
    expect(first).toEqual({ 1: 'پہلی حدیث', 2: 'دوسری حدیث' });
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain(
      'editions/urd-bukhari/sections/1',
    );

    await fetchHadithChapterTranslations('urd-bukhari', 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back quietly when a chapter has no translation', async () => {
    globalThis.fetch = jest.fn(async () => ({ ok: false })) as any;
    expect(await fetchHadithChapterTranslations('fra-bukhari', 99)).toEqual({});
  });
});
