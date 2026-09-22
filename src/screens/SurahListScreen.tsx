import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bookmark, ChevronRight, X } from 'lucide-react-native';
import {
  arabicType,
  colors,
  shared,
  useAppTheme,
  useThemeStyles,
  ScreenTitle,
} from '../components/DesignSystem';
import { totalAyahCount } from '../data/quran';
import { getSurahs, quranLanguageOptions } from '../data/quran';
import { useAppPreferences } from '../components/AppPreferencesContext';
import { searchQuranVerses } from '../services/quranReading';

export default function SurahListScreen({ navigation }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences } = useAppPreferences();
  const localizedSurahs = getSurahs(preferences.quranLanguage);
  const language =
    quranLanguageOptions.find(
      option => option.code === preferences.quranLanguage,
    ) ?? quranLanguageOptions[0];
  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const bookmarks = preferences.quranBookmarks;
  const savedSurahs = useMemo(
    () => new Set(bookmarks.map(bookmark => bookmark.surah)),
    [bookmarks],
  );
  const lastRead = preferences.quranLastRead;
  const lastReadSurah = lastRead
    ? localizedSurahs.find(surah => surah.number === lastRead.surah)
    : undefined;
  const verseResults = useMemo(
    () => (savedOnly ? [] : searchQuranVerses(query, localizedSurahs)),
    [localizedSurahs, query, savedOnly],
  );
  const savedVerses = useMemo(
    () =>
      bookmarks
        .map(bookmark => {
          const surah = localizedSurahs.find(
            item => item.number === bookmark.surah,
          );
          const ayah = surah?.ayahs.find(item => item.number === bookmark.ayah);
          return surah && ayah
            ? {
                ...bookmark,
                surahName: surah.name,
                translation: ayah.translation,
              }
            : null;
        })
        .filter(item => item !== null)
        .reverse(),
    [bookmarks, localizedSurahs],
  );
  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return localizedSurahs.filter(surah => {
      const matchesSearch =
        !search ||
        [surah.name, surah.meaning, surah.arabicName, surah.number].some(
          value => value.toLowerCase().includes(search),
        );
      return matchesSearch && (!savedOnly || savedSurahs.has(surah.number));
    });
  }, [localizedSurahs, query, savedOnly, savedSurahs]);

  const openSurah = (surahNumber: string, ayahNumber?: string) =>
    navigation.navigate('SurahDetail', { surahNumber, ayahNumber });
  const verseList = savedOnly ? savedVerses : verseResults;

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <ScreenTitle
            title="The Quran"
            subtitle={`114 surahs · ${totalAyahCount.toLocaleString()} ayahs · ${
              language.label
            } offline`}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              savedOnly ? 'Show all surahs' : 'Show bookmarked verses'
            }
            onPress={() => setSavedOnly(value => !value)}
            style={[
              styles.bookmark,
              theme.card,
              savedOnly && styles.bookmarkActive,
            ]}
          >
            <Bookmark
              size={20}
              color={savedOnly ? colors.white : palette.green}
              fill={savedOnly ? colors.white : 'transparent'}
            />
          </Pressable>
        </View>
        <View style={[styles.search, theme.card]}>
          <Search size={19} color={palette.muted} />
          <TextInput
            accessibilityLabel="Search surahs"
            value={query}
            onChangeText={setQuery}
            placeholder="Search surahs, verses or 2:255"
            placeholderTextColor={palette.muted}
            style={[styles.input, theme.text]}
            returnKeyType="search"
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery('')}
            >
              <X size={18} color={palette.muted} />
            </Pressable>
          ) : null}
        </View>
        {!query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              lastRead && lastReadSurah
                ? `Continue reading ${lastReadSurah.name} verse ${lastRead.ayah}`
                : 'Start reading Al-Fatihah'
            }
            onPress={() =>
              lastRead
                ? openSurah(lastRead.surah, lastRead.ayah)
                : openSurah('1')
            }
            style={styles.resume}
          >
            <Text style={styles.resumeLabel}>
              {lastRead ? 'LAST READ' : 'BEGIN READING'}
            </Text>
            <Text style={styles.resumeTitle}>
              {lastRead && lastReadSurah
                ? `${lastReadSurah.name} · Ayah ${lastRead.ayah}`
                : 'Al-Fatihah · Ayah 1'}
            </Text>
            <Text style={styles.resumeMeta}>
              {lastRead
                ? 'Continue where you left off'
                : 'Your place is saved automatically as you read'}
            </Text>
          </Pressable>
        ) : null}
        {verseList.length || savedOnly ? (
          <>
            <Text style={[styles.section, theme.mutedText]}>
              {savedOnly ? 'BOOKMARKED VERSES' : 'MATCHING VERSES'}
            </Text>
            <View style={[styles.list, styles.verseList, theme.card]}>
              {verseList.map(verse => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${verse.surahName} verse ${verse.ayah}`}
                  key={`${verse.surah}:${verse.ayah}`}
                  style={[styles.verseRow, theme.border]}
                  onPress={() => openSurah(verse.surah, verse.ayah)}
                >
                  <Text style={[styles.verseRef, { color: palette.green }]}>
                    {verse.surahName} · {verse.surah}:{verse.ayah}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[styles.meta, styles.verseText, theme.mutedText]}
                  >
                    {verse.translation}
                  </Text>
                </Pressable>
              ))}
              {!verseList.length ? (
                <Text style={[styles.empty, theme.mutedText]}>
                  Tap the bookmark on any verse to save it here.
                </Text>
              ) : null}
            </View>
          </>
        ) : null}
        {results.length || !verseList.length ? (
          <>
            <Text style={[styles.section, theme.mutedText]}>
              {savedOnly ? 'SURAHS WITH BOOKMARKS' : 'SURAH INDEX'}
            </Text>
            <View style={[styles.list, theme.card]}>
              {results.map(surah => (
                <Pressable
                  key={surah.number}
                  style={[styles.row, theme.border]}
                  onPress={() => openSurah(surah.number)}
                >
                  <View
                    style={[styles.number, { backgroundColor: palette.mint }]}
                  >
                    <Text style={[styles.numberText, { color: palette.green }]}>
                      {surah.number}
                    </Text>
                  </View>
                  <View style={styles.copy}>
                    <Text style={[styles.name, theme.text]}>{surah.name}</Text>
                    <Text style={[styles.meta, theme.mutedText]}>
                      {surah.meaning} · {surah.verseCount} verses ·{' '}
                      {surah.revelationType}
                    </Text>
                  </View>
                  <Text style={[styles.arabic, theme.text]}>
                    {surah.arabicName}
                  </Text>
                  <ChevronRight size={16} color={palette.muted} />
                </Pressable>
              ))}
              {!results.length ? (
                <Text style={[styles.empty, theme.mutedText]}>
                  {query
                    ? `No surahs match “${query}”`
                    : 'No bookmarked verses yet.'}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  bookmark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkActive: { backgroundColor: colors.green },
  search: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 14,
  },
  input: { color: colors.ink, fontSize: 14, flex: 1, height: 50 },
  resume: {
    backgroundColor: colors.green,
    borderRadius: 23,
    padding: 20,
    marginBottom: 25,
  },
  resumeLabel: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  resumeTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 9,
  },
  resumeMeta: { color: '#C9DCD5', fontSize: 12, marginTop: 4 },
  section: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 11,
  },
  list: { ...shared.card, overflow: 'hidden' },
  row: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  number: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: colors.green, fontWeight: '800', fontSize: 12 },
  copy: { flex: 1 },
  name: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  arabic: { ...arabicType.title, color: colors.ink },
  verseList: { marginBottom: 25 },
  verseRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  verseRef: { fontSize: 12, fontWeight: '800' },
  verseText: { fontSize: 12, lineHeight: 18 },
  empty: { color: colors.muted, textAlign: 'center', padding: 30 },
});
