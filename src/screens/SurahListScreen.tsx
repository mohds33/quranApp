import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bookmark, ChevronRight } from 'lucide-react-native';
import { colors, ScreenTitle, shared } from '../components/DesignSystem';

const surahs = [
  ['1', 'Al-Fatihah', 'The Opening', 'الفاتحة', '7'],
  ['2', 'Al-Baqarah', 'The Cow', 'البقرة', '286'],
  ['3', 'Ali ‘Imran', 'Family of Imran', 'آل عمران', '200'],
  ['4', 'An-Nisa', 'The Women', 'النساء', '176'],
  ['5', 'Al-Ma’idah', 'The Table Spread', 'المائدة', '120'],
  ['6', 'Al-An’am', 'The Cattle', 'الأنعام', '165'],
];

export default function SurahListScreen({ navigation }: any) {
  return (
    <SafeAreaView style={shared.screen} edges={['top']}>
      <ScrollView contentContainerStyle={shared.content}>
        <View style={styles.header}>
          <ScreenTitle title="The Quran" subtitle="Read, listen, reflect" />
          <Pressable style={styles.bookmark}>
            <Bookmark size={20} color={colors.green} />
          </Pressable>
        </View>
        <View style={styles.search}>
          <Search size={19} color={colors.muted} />
          <Text style={styles.placeholder}>Search surahs or verses</Text>
        </View>
        <View style={styles.resume}>
          <Text style={styles.resumeLabel}>LAST READ</Text>
          <Text style={styles.resumeTitle}>Al-Baqarah · Ayah 255</Text>
          <Text style={styles.resumeMeta}>Continue from Ayatul Kursi</Text>
        </View>
        <Text style={styles.section}>SURAH INDEX</Text>
        <View style={styles.list}>
          {surahs.map(([n, en, tr, ar, verses]) => (
            <Pressable
              key={n}
              style={styles.row}
              onPress={() => navigation.navigate('SurahDetail')}
            >
              <View style={styles.number}>
                <Text style={styles.numberText}>{n}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{en}</Text>
                <Text style={styles.meta}>
                  {tr} · {verses} verses
                </Text>
              </View>
              <Text style={styles.arabic}>{ar}</Text>
              <ChevronRight size={16} color={colors.muted} />
            </Pressable>
          ))}
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
  search: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
    marginBottom: 14,
  },
  placeholder: { color: colors.muted, fontSize: 14 },
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
    height: 78,
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
});
