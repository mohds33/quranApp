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
import {
  Bookmark,
  ChevronRight,
  LibraryBig,
  Search,
  X,
} from 'lucide-react-native';
import {
  colors,
  ScreenTitle,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { HadithTradition, hadithCollections } from '../data/hadith';

const filters: Array<'All' | HadithTradition> = ['All', 'Sunni', 'Shia'];

export default function HadithLibraryScreen({ navigation }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedBooks, setSavedBooks] = useState<string[]>(['bukhari', 'riyad']);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return hadithCollections.filter(book => {
      const matchesSearch =
        !search ||
        [book.title, book.arabicTitle, book.compiler].some(value =>
          value.toLowerCase().includes(search),
        );
      const matchesFilter = filter === 'All' || book.tradition === filter;
      return (
        matchesSearch &&
        matchesFilter &&
        (!savedOnly || savedBooks.includes(book.id))
      );
    });
  }, [filter, query, savedBooks, savedOnly]);

  const toggleSaved = (id: string) =>
    setSavedBooks(items =>
      items.includes(id) ? items.filter(item => item !== id) : [...items, id],
    );

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ScreenTitle
            title="Hadith"
            subtitle="Major collections across Islamic traditions"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show saved Hadith books"
            onPress={() => setSavedOnly(value => !value)}
            style={[
              styles.savedButton,
              theme.card,
              savedOnly && styles.savedButtonActive,
            ]}
          >
            <Bookmark
              size={20}
              color={savedOnly ? colors.white : palette.green}
              fill={savedOnly ? colors.white : 'transparent'}
            />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <LibraryBig size={25} color={colors.gold} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Hadith library</Text>
            <Text style={styles.heroText}>
              {hadithCollections.length} Sunni and Shia collection references
            </Text>
          </View>
          <Text style={styles.heroArabic}>الحديث</Text>
        </View>

        <View style={[styles.search, theme.card]}>
          <Search size={19} color={palette.muted} />
          <TextInput
            accessibilityLabel="Search Hadith books"
            value={query}
            onChangeText={setQuery}
            placeholder="Search books or compilers"
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map(item => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${item}`}
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.filter,
                theme.card,
                filter === item && styles.filterActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter !== item && theme.mutedText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.section, theme.mutedText]}>
          {savedOnly ? 'SAVED COLLECTIONS' : `${results.length} COLLECTIONS`}
        </Text>
        <View style={[styles.list, theme.card]}>
          {results.map(book => {
            const saved = savedBooks.includes(book.id);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${book.title}`}
                key={book.id}
                onPress={() =>
                  navigation.navigate('HadithBook', { bookId: book.id })
                }
                style={[styles.row, theme.border]}
              >
                <View style={styles.rowTop}>
                  <View
                    style={[styles.monogram, { backgroundColor: palette.mint }]}
                  >
                    <Text
                      style={[styles.monogramText, { color: palette.green }]}
                    >
                      {book.title.slice(0, 1)}
                    </Text>
                  </View>
                  <View style={styles.copy}>
                    <Text style={[styles.title, theme.text]}>{book.title}</Text>
                    <Text style={[styles.meta, theme.mutedText]}>
                      {book.compiler}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        saved
                          ? `Remove ${book.title} bookmark`
                          : `Save ${book.title}`
                      }
                      hitSlop={10}
                      onPress={event => {
                        event.stopPropagation();
                        toggleSaved(book.id);
                      }}
                    >
                      <Bookmark
                        size={17}
                        color={colors.gold}
                        fill={saved ? colors.gold : 'transparent'}
                      />
                    </Pressable>
                    <ChevronRight size={16} color={palette.muted} />
                  </View>
                </View>
                <Text style={[styles.arabic, theme.text]}>
                  {book.arabicTitle}
                </Text>
                <Text style={[styles.description, theme.mutedText]}>
                  {book.description}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.pill, { color: palette.green }]}>
                    {book.sizeLabel}
                  </Text>
                  <Text style={styles.category}>
                    {book.tradition} · {book.category}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {!results.length ? (
            <Text style={[styles.empty, theme.mutedText]}>
              No collections match your search.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  savedButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedButtonActive: { backgroundColor: colors.green },
  hero: {
    backgroundColor: colors.green,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroCopy: { flex: 1, marginLeft: 12 },
  heroTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },
  heroText: { color: '#BCD3CB', fontSize: 11, marginTop: 4 },
  heroArabic: { color: colors.white, fontSize: 23 },
  search: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
  },
  input: { color: colors.ink, fontSize: 14, flex: 1, height: 50 },
  filters: { gap: 8, paddingVertical: 14 },
  filter: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  filterActive: { backgroundColor: colors.green, borderColor: colors.green },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  section: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  list: { ...shared.card, overflow: 'hidden' },
  row: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monogram: {
    width: 42,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { color: colors.green, fontSize: 17, fontWeight: '800' },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 9, marginTop: 4 },
  description: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 11,
  },
  pill: {
    backgroundColor: colors.mint,
    borderRadius: 13,
    color: colors.green,
    fontSize: 9,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  category: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  arabic: {
    color: colors.ink,
    fontSize: 21,
    lineHeight: 34,
    marginTop: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  empty: { color: colors.muted, padding: 28, textAlign: 'center' },
});
