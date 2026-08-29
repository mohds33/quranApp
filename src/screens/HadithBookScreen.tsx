import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ExternalLink,
  RefreshCw,
  Search,
  Share2,
  X,
} from 'lucide-react-native';
import {
  colors,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import {
  getHadithSampleTranslation,
  hadithCollections,
  HadithSample,
} from '../data/hadith';
import { quranLanguageOptions } from '../data/quran';
import { useAppPreferences } from '../components/AppPreferencesContext';
import {
  fetchFullSahihBook,
  FullHadith,
  FullHadithBook,
  getFullSahihSource,
} from '../services/hadith';

const PAGE_SIZE = 20;

export default function HadithBookScreen({ navigation, route }: any) {
  const { palette, isDark } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences } = useAppPreferences();
  const activeLanguage =
    quranLanguageOptions.find(
      option => option.code === preferences.quranLanguage,
    ) ?? quranLanguageOptions[0];
  const book =
    hadithCollections.find(item => item.id === route.params?.bookId) ??
    hadithCollections[0];
  const source = getFullSahihSource(book.id);
  const [fullBook, setFullBook] = useState<FullHadithBook | null>(null);
  const [loading, setLoading] = useState(Boolean(source));
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    if (!source) {
      setLoading(false);
      setFullBook(null);
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError('');
    fetchFullSahihBook(book.id)
      .then(value => {
        if (active) setFullBook(value);
      })
      .catch(() => {
        if (active)
          setLoadError(
            'The full collection could not be downloaded. Check your connection and try again.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [book.id, loadAttempt, source]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredQuery, selectedChapter]);

  const chapterMap = useMemo(
    () =>
      new Map(fullBook?.chapters.map(chapter => [chapter.id, chapter]) ?? []),
    [fullBook],
  );
  const filteredHadiths = useMemo(() => {
    if (!fullBook) return [];
    const term = deferredQuery.trim().toLowerCase();
    return fullBook.hadiths.filter(hadith => {
      if (selectedChapter && hadith.chapterId !== selectedChapter) return false;
      if (!term) return true;
      const chapter = chapterMap.get(hadith.chapterId);
      return [
        hadith.idInBook,
        hadith.arabic,
        hadith.english.narrator,
        hadith.english.text,
        chapter?.arabic,
        chapter?.english,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [chapterMap, deferredQuery, fullBook, selectedChapter]);
  const visibleHadiths = useMemo(
    () => filteredHadiths.slice(0, visibleCount),
    [filteredHadiths, visibleCount],
  );

  const toggleSaved = (number: string) =>
    setSaved(items =>
      items.includes(number)
        ? items.filter(item => item !== number)
        : [...items, number],
    );
  const shareHadith = (translation: string, number: string) =>
    Share.share({ message: `${translation}\n\n${book.title} · ${number}` });
  const loadMore = useCallback(() => {
    setVisibleCount(count =>
      Math.min(count + PAGE_SIZE, filteredHadiths.length),
    );
  }, [filteredHadiths.length]);

  const heading = (
    <>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Hadith library"
          onPress={() => navigation.goBack()}
          style={[styles.button, theme.card]}
        >
          <ArrowLeft size={20} color={palette.ink} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={[styles.title, theme.text]}>{book.title}</Text>
          <Text style={[styles.subtitle, theme.mutedText]}>
            {book.compiler}
          </Text>
        </View>
        <View style={[styles.button, theme.card]}>
          <BookOpen size={19} color={palette.green} />
        </View>
      </View>
      <View style={styles.cover}>
        <Text style={styles.arabicTitle}>{book.arabicTitle}</Text>
        <Text style={styles.coverTitle}>{book.title}</Text>
        <Text style={styles.coverMeta}>
          {book.sizeLabel} · {book.category}
        </Text>
      </View>
      <Text style={[styles.description, theme.mutedText]}>
        {book.description}
      </Text>
    </>
  );

  const renderFullHadith = ({ item }: { item: FullHadith }) => {
    const number = String(item.idInBook);
    const isSaved = saved.includes(number);
    const chapter = chapterMap.get(item.chapterId);
    return (
      <View style={[styles.hadith, theme.card]}>
        <View style={styles.hadithTop}>
          <View style={styles.numberAndChapter}>
            <View style={[styles.number, { backgroundColor: palette.mint }]}>
              <Text style={[styles.numberText, { color: palette.green }]}>
                {number}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[styles.chapterName, theme.mutedText]}
            >
              {chapter?.english ?? `Book ${item.chapterId}`}
            </Text>
          </View>
          <View style={styles.hadithActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Share Hadith ${number}`}
              onPress={() => shareHadith(item.english.text, number)}
            >
              <Share2 size={18} color={palette.muted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isSaved ? 'Remove Hadith bookmark' : 'Bookmark Hadith'
              }
              onPress={() => toggleSaved(number)}
            >
              <Bookmark
                size={19}
                color={palette.gold}
                fill={isSaved ? palette.gold : 'transparent'}
              />
            </Pressable>
          </View>
        </View>
        <View style={[styles.languageHeader, theme.border]}>
          <Text style={[styles.languageLabel, { color: palette.green }]}>
            Arabic
          </Text>
          <Text style={[styles.languageLabel, theme.mutedText]}>
            English translation
          </Text>
        </View>
        <Text style={[styles.arabic, theme.text]}>{item.arabic}</Text>
        {item.english.narrator ? (
          <Text style={[styles.narratorLead, { color: palette.green }]}>
            {item.english.narrator.replace(/\s+/g, ' ').trim()}
          </Text>
        ) : null}
        <Text style={[styles.translation, theme.text]}>
          {item.english.text.replace(/\s+/g, ' ').trim()}
        </Text>
        {chapter?.arabic ? (
          <Text style={[styles.chapterArabic, theme.mutedText]}>
            {chapter.arabic}
          </Text>
        ) : null}
      </View>
    );
  };

  if (!source) {
    return (
      <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
        <ScrollView
          contentContainerStyle={shared.content}
          showsVerticalScrollIndicator={false}
        >
          {heading}
          <View
            style={[
              styles.previewNote,
              isDark ? styles.previewNoteDark : styles.previewNoteLight,
            ]}
          >
            <Text style={styles.previewTitle}>OFFLINE READER PREVIEW</Text>
            <Text style={[styles.previewText, theme.text]}>
              This collection currently includes a curated preview. The two
              Sahih collections contain their complete Arabic and English
              readers. Preview translations follow your selected app language.
            </Text>
          </View>
          {book.samples.map(hadith => (
            <SampleHadithCard
              bookTitle={book.title}
              hadith={hadith}
              isSaved={saved.includes(hadith.number)}
              key={hadith.number}
              onSave={() => toggleSaved(hadith.number)}
              onShare={() =>
                shareHadith(
                  getHadithSampleTranslation(hadith, preferences.quranLanguage),
                  hadith.number,
                )
              }
              translation={getHadithSampleTranslation(
                hadith,
                preferences.quranLanguage,
              )}
              translationLabel={`${activeLanguage.label} translation`}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading || loadError || !fullBook) {
    return (
      <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
        <ScrollView contentContainerStyle={shared.content}>
          {heading}
          <View style={[styles.loadCard, theme.card]}>
            {loading ? (
              <>
                <ActivityIndicator color={palette.green} />
                <Text style={[styles.loadTitle, theme.text]}>
                  Loading the full collection…
                </Text>
                <Text style={[styles.loadText, theme.mutedText]}>
                  The first download is about 12 MB. It stays cached while the
                  app is open.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.loadTitle, theme.text]}>
                  Couldn’t open the full reader
                </Text>
                <Text style={[styles.loadText, theme.mutedText]}>
                  {loadError}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading full Hadith collection"
                  onPress={() => setLoadAttempt(attempt => attempt + 1)}
                  style={styles.retry}
                >
                  <RefreshCw size={17} color={colors.white} />
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const listHeader = (
    <>
      {heading}
      <View style={[styles.fullNote, { backgroundColor: palette.mint }]}>
        <View style={styles.fullNoteTop}>
          <Text style={[styles.fullLabel, { color: palette.green }]}>
            FULL SAHIH COLLECTION
          </Text>
          <Text style={[styles.fullCount, { color: palette.green }]}>
            {fullBook.length.toLocaleString()} hadith
          </Text>
        </View>
        <Text style={[styles.fullText, theme.text]}>
          Arabic with English translation · {fullBook.chapters.length} books ·
          search the complete collection below.
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Open Hadith data source"
          onPress={() => Linking.openURL(source.sourceUrl)}
          style={styles.sourceLink}
        >
          <ExternalLink size={13} color={palette.green} />
          <Text style={[styles.sourceText, { color: palette.green }]}>
            Data source: hadith-json {source.version}
          </Text>
        </Pressable>
      </View>
      <View style={[styles.search, theme.card]}>
        <Search size={18} color={palette.muted} />
        <TextInput
          accessibilityLabel={`Search ${book.title}`}
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search Arabic, English, narrator, book, or hadith #"
          placeholderTextColor={palette.muted}
          style={[styles.searchInput, theme.text]}
          value={query}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear Hadith search"
            onPress={() => setQuery('')}
          >
            <X size={18} color={palette.muted} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        contentContainerStyle={styles.chapterFilters}
        showsHorizontalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show all Hadith books"
          onPress={() => setSelectedChapter(null)}
          style={[
            styles.chapterChip,
            selectedChapter === null ? styles.chapterChipActive : theme.card,
          ]}
        >
          <Text
            style={[
              styles.chapterChipText,
              selectedChapter === null
                ? styles.chapterChipTextActive
                : theme.text,
            ]}
          >
            All books
          </Text>
        </Pressable>
        {fullBook.chapters.map(chapter => {
          const active = chapter.id === selectedChapter;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${chapter.english}`}
              key={chapter.id}
              onPress={() => setSelectedChapter(chapter.id)}
              style={[
                styles.chapterChip,
                active ? styles.chapterChipActive : theme.card,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.chapterChipText,
                  active ? styles.chapterChipTextActive : theme.text,
                ]}
              >
                {chapter.id}. {chapter.english}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[styles.results, theme.mutedText]}>
        {filteredHadiths.length.toLocaleString()} RESULTS
      </Text>
    </>
  );

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <FlatList
        contentContainerStyle={shared.content}
        data={visibleHadiths}
        initialNumToRender={6}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={[styles.empty, theme.mutedText]}>
            No hadith match this search.
          </Text>
        }
        ListFooterComponent={
          visibleHadiths.length < filteredHadiths.length ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Load more Hadith"
              onPress={loadMore}
              style={[styles.loadMore, theme.card]}
            >
              <Text style={[styles.loadMoreText, { color: palette.green }]}>
                Load 20 more · showing {visibleHadiths.length.toLocaleString()}{' '}
                of {filteredHadiths.length.toLocaleString()}
              </Text>
            </Pressable>
          ) : null
        }
        ListHeaderComponent={listHeader}
        maxToRenderPerBatch={8}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        renderItem={renderFullHadith}
        showsVerticalScrollIndicator={false}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

function SampleHadithCard({
  hadith,
  isSaved,
  onSave,
  onShare,
  translation,
  translationLabel,
}: {
  bookTitle: string;
  hadith: HadithSample;
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
  translation: string;
  translationLabel: string;
}) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  return (
    <View style={[styles.hadith, theme.card]}>
      <View style={styles.hadithTop}>
        <View style={[styles.number, { backgroundColor: palette.mint }]}>
          <Text style={[styles.numberText, { color: palette.green }]}>
            {hadith.number}
          </Text>
        </View>
        <View style={styles.hadithActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share Hadith"
            onPress={onShare}
          >
            <Share2 size={18} color={palette.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isSaved ? 'Remove Hadith bookmark' : 'Bookmark Hadith'
            }
            onPress={onSave}
          >
            <Bookmark
              size={19}
              color={palette.gold}
              fill={isSaved ? palette.gold : 'transparent'}
            />
          </Pressable>
        </View>
      </View>
      <View style={[styles.languageHeader, theme.border]}>
        <Text style={[styles.languageLabel, { color: palette.green }]}>
          Arabic
        </Text>
        <Text style={[styles.languageLabel, theme.mutedText]}>
          {translationLabel}
        </Text>
      </View>
      <Text style={[styles.arabic, theme.text]}>{hadith.arabic}</Text>
      <Text style={[styles.translation, theme.text]}>{translation}</Text>
      <Text style={[styles.narrator, theme.mutedText]}>{hadith.narrator}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  cover: {
    backgroundColor: colors.green,
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
  },
  arabicTitle: { color: colors.white, fontSize: 29, lineHeight: 44 },
  coverTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  coverMeta: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 7,
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    margin: 20,
  },
  previewNote: { borderRadius: 18, padding: 16, marginBottom: 14 },
  previewNoteLight: { backgroundColor: '#EFE6D3' },
  previewNoteDark: { backgroundColor: '#29271F' },
  previewTitle: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  previewText: {
    color: colors.ink,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  fullNote: { borderRadius: 19, padding: 16, marginBottom: 12 },
  fullNoteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  fullLabel: {
    color: colors.green,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  fullCount: { color: colors.green, fontSize: 9, fontWeight: '800' },
  fullText: { color: colors.ink, fontSize: 11, lineHeight: 17, marginTop: 7 },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },
  sourceText: { color: colors.green, fontSize: 9, fontWeight: '700' },
  search: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 9,
  },
  searchInput: { color: colors.ink, flex: 1, height: 50, fontSize: 12 },
  chapterFilters: { gap: 8, paddingVertical: 12 },
  chapterChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 36,
    justifyContent: 'center',
    maxWidth: 210,
  },
  chapterChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  chapterChipText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  chapterChipTextActive: { color: colors.white },
  results: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  loadCard: {
    ...shared.card,
    minHeight: 190,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
  },
  loadText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 7,
  },
  retry: {
    backgroundColor: colors.green,
    borderRadius: 15,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  retryText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  hadith: { ...shared.card, padding: 19, marginBottom: 12 },
  hadithTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberAndChapter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  number: {
    backgroundColor: colors.mint,
    borderRadius: 10,
    minWidth: 34,
    height: 30,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: colors.green, fontSize: 10, fontWeight: '800' },
  chapterName: { color: colors.muted, flex: 1, fontSize: 9 },
  hadithActions: { flexDirection: 'row', gap: 17 },
  languageHeader: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 9,
  },
  languageLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  arabic: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 43,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 17,
    marginBottom: 15,
  },
  narratorLead: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 7,
  },
  translation: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 23,
    writingDirection: 'ltr',
  },
  narrator: { color: colors.muted, fontSize: 10, marginTop: 12 },
  chapterArabic: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 13,
  },
  empty: { textAlign: 'center', paddingVertical: 45 },
  loadMore: {
    ...shared.card,
    alignItems: 'center',
    padding: 15,
    marginTop: 2,
  },
  loadMoreText: { color: colors.green, fontSize: 10, fontWeight: '800' },
});
