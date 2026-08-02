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
import { colors, ScreenTitle, shared } from '../components/DesignSystem';
import { surahs } from '../data/quran';

export default function SurahListScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedSurahs] = useState(['1', '2']);
  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return surahs.filter(surah => {
      const matchesSearch =
        !search ||
        [surah.name, surah.meaning, surah.arabicName, surah.number].some(
          value => value.toLowerCase().includes(search),
        );
      return (
        matchesSearch && (!savedOnly || savedSurahs.includes(surah.number))
      );
    });
  }, [query, savedOnly, savedSurahs]);

  const openSurah = (surahNumber: string) =>
    navigation.navigate('SurahDetail', { surahNumber });

  return (
    <SafeAreaView style={shared.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <ScreenTitle title="The Quran" subtitle="Read, listen, reflect" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show saved surahs"
            onPress={() => setSavedOnly(value => !value)}
            style={[styles.bookmark, savedOnly && styles.bookmarkActive]}
          >
            <Bookmark
              size={20}
              color={savedOnly ? colors.white : colors.green}
              fill={savedOnly ? colors.white : 'transparent'}
            />
          </Pressable>
        </View>
        <View style={styles.search}>
          <Search size={19} color={colors.muted} />
          <TextInput
            accessibilityLabel="Search surahs"
            value={query}
            onChangeText={setQuery}
            placeholder="Search surahs or verses"
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue reading Al-Baqarah verse 255"
          onPress={() => openSurah('2')}
          style={styles.resume}
        >
          <Text style={styles.resumeLabel}>LAST READ</Text>
          <Text style={styles.resumeTitle}>Al-Baqarah · Ayah 255</Text>
          <Text style={styles.resumeMeta}>Continue from Ayatul Kursi</Text>
        </Pressable>
        <Text style={styles.section}>
          {savedOnly ? 'SAVED SURAHS' : 'SURAH INDEX'}
        </Text>
        <View style={styles.list}>
          {results.map(surah => (
            <Pressable
              key={surah.number}
              style={styles.row}
              onPress={() => openSurah(surah.number)}
            >
              <View style={styles.number}>
                <Text style={styles.numberText}>{surah.number}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{surah.name}</Text>
                <Text style={styles.meta}>
                  {surah.meaning} · {surah.verseCount} verses
                </Text>
              </View>
              <Text style={styles.arabic}>{surah.arabicName}</Text>
              <ChevronRight size={16} color={colors.muted} />
            </Pressable>
          ))}
          {!results.length ? (
            <Text style={styles.empty}>No surahs match “{query}”</Text>
          ) : null}
        </View>
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
    borderBottomColor: colors.line,
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
  arabic: { color: colors.ink, fontSize: 18 },
  empty: { color: colors.muted, textAlign: 'center', padding: 30 },
});
