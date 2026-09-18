import {
  getSurahs,
  globalAyahNumber,
  surahs,
  totalAyahCount,
} from '../src/data/quran';
import { validSavedPreferences } from '../src/components/AppPreferencesContext';
import {
  parseAyahReference,
  searchQuranVerses,
  toggleAyahBookmark,
  validAyahBookmarks,
} from '../src/services/quranReading';

describe('Quran reading progress', () => {
  it('maps surah verses to mushaf-wide ayah numbers', () => {
    expect(globalAyahNumber('1', '1')).toBe(1);
    expect(globalAyahNumber('2', '255')).toBe(262);
    expect(globalAyahNumber('114', '6')).toBe(totalAyahCount);
  });

  it('uses Persian letter forms in the Farsi translation', () => {
    const farsi = getSurahs('fa');
    const text = farsi.flatMap(surah => surah.ayahs.map(a => a.translation));
    expect(text).toHaveLength(totalAyahCount);
    expect(text.some(line => /[يىك]/.test(line))).toBe(false);
    expect(farsi[1].ayahs[254].translation).toContain('کرسی');
  });

  it('parses verse references that exist', () => {
    expect(parseAyahReference('2:255', surahs)).toEqual({
      surah: '2',
      ayah: '255',
    });
    expect(parseAyahReference(' 36 . 1 ', surahs)).toEqual({
      surah: '36',
      ayah: '1',
    });
    expect(parseAyahReference('1:8', surahs)).toBeNull();
    expect(parseAyahReference('115:1', surahs)).toBeNull();
    expect(parseAyahReference('mercy', surahs)).toBeNull();
  });

  it('searches verse text and jumps straight to references', () => {
    expect(searchQuranVerses('2:255', surahs)).toHaveLength(1);
    expect(searchQuranVerses('ab', surahs)).toEqual([]);
    const results = searchQuranVerses('throne', surahs);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(40);
    expect(results.every(r => /throne/i.test(r.translation))).toBe(true);
  });

  it('toggles bookmarks without duplicates', () => {
    const verse = { surah: '2', ayah: '255' };
    const saved = toggleAyahBookmark([], verse);
    expect(saved).toEqual([verse]);
    expect(toggleAyahBookmark(saved, { ...verse })).toEqual([]);
  });

  it('drops invalid or duplicate saved bookmarks and last read', () => {
    expect(
      validAyahBookmarks(
        [
          { surah: '2', ayah: '255' },
          { surah: '2', ayah: '255' },
          { surah: '1', ayah: '99' },
          { surah: 2, ayah: 3 },
          null,
        ],
        surahs,
      ),
    ).toEqual([{ surah: '2', ayah: '255' }]);
    const restored = validSavedPreferences({
      quranLastRead: { surah: '18', ayah: '10' },
      quranBookmarks: 'nope',
    });
    expect(restored.quranLastRead).toEqual({ surah: '18', ayah: '10' });
    expect(restored.quranBookmarks).toEqual([]);
    expect(
      validSavedPreferences({ quranLastRead: { surah: '1', ayah: '0' } })
        .quranLastRead,
    ).toBeNull();
  });
});
