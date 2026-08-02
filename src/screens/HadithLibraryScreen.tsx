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
import { colors, ScreenTitle, shared } from '../components/DesignSystem';
import { HadithCategory, hadithCollections } from '../data/hadith';

const filters: Array<'All' | HadithCategory> = [
  'All',
  'Canonical',
  'Classics',
  'Character',
];

export default function HadithLibraryScreen({ navigation }: any) {
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
      const matchesFilter = filter === 'All' || book.category === filter;
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
    <SafeAreaView style={shared.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ScreenTitle
            title="Hadith"
            subtitle="The major collections in one library"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show saved Hadith books"
            onPress={() => setSavedOnly(value => !value)}
            style={[styles.savedButton, savedOnly && styles.savedButtonActive]}
          >
            <Bookmark
              size={20}
              color={savedOnly ? colors.white : colors.green}
              fill={savedOnly ? colors.white : 'transparent'}
            />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <LibraryBig size={25} color={colors.gold} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Hadith library</Text>
            <Text style={styles.heroText}>
              {hadithCollections.length} trusted classical collections
            </Text>
          </View>
          <Text style={styles.heroArabic}>الحديث</Text>
        </View>

        <View style={styles.search}>
          <Search size={19} color={colors.muted} />
          <TextInput
            accessibilityLabel="Search Hadith books"
            value={query}
            onChangeText={setQuery}
            placeholder="Search books or compilers"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="search"
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery('')}
            >
              <X size={18} color={colors.muted} />
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
              style={[styles.filter, filter === item && styles.filterActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.section}>
          {savedOnly ? 'SAVED COLLECTIONS' : `${results.length} COLLECTIONS`}
        </Text>
        <View style={styles.list}>
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
                style={styles.row}
              >
                <View style={styles.monogram}>
                  <Text style={styles.monogramText}>
                    {book.title.slice(0, 1)}
                  </Text>
                </View>
                <View style={styles.copy}>
                  <Text style={styles.title}>{book.title}</Text>
                  <Text style={styles.meta}>
                    {book.compiler} · {book.sizeLabel}
                  </Text>
                  <Text style={styles.category}>{book.category}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.arabic}>{book.arabicTitle}</Text>
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
                    <ChevronRight size={16} color={colors.muted} />
                  </View>
                </View>
              </Pressable>
            );
          })}
          {!results.length ? (
            <Text style={styles.empty}>No collections match your search.</Text>
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
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
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
  category: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  right: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  arabic: { color: colors.ink, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  empty: { color: colors.muted, padding: 28, textAlign: 'center' },
});
