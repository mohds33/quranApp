import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bookmark, Play } from 'lucide-react-native';
import { colors, shared } from '../components/DesignSystem';

const ayahs = [
  [
    '١',
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'In the name of Allah, the Most Compassionate, Most Merciful.',
  ],
  [
    '٢',
    'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    'All praise is for Allah—Lord of all worlds.',
  ],
  ['٣', 'الرَّحْمَٰنِ الرَّحِيمِ', 'The Most Compassionate, Most Merciful.'],
];
export default function SurahDetailScreen({ navigation }: any) {
  return (
    <SafeAreaView style={shared.screen} edges={['top']}>
      <ScrollView contentContainerStyle={shared.content}>
        <View style={styles.top}>
          <Pressable onPress={() => navigation.goBack()} style={styles.button}>
            <ArrowLeft size={20} color={colors.ink} />
          </Pressable>
          <View style={styles.heading}>
            <Text style={styles.title}>Al-Fatihah</Text>
            <Text style={styles.subtitle}>The Opening · 7 verses</Text>
          </View>
          <Pressable style={styles.button}>
            <Play size={19} color={colors.green} />
          </Pressable>
        </View>
        <View style={styles.bismillah}>
          <Text style={styles.bismillahArabic}>
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </Text>
        </View>
        {ayahs.map(([n, ar, en]) => (
          <View key={n} style={styles.ayah}>
            <View style={styles.ayahTop}>
              <View style={styles.number}>
                <Text style={styles.numberText}>{n}</Text>
              </View>
              <Bookmark size={18} color={colors.gold} />
            </View>
            <Text style={styles.arabic}>{ar}</Text>
            <Text style={styles.english}>{en}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { flex: 1, alignItems: 'center' },
  title: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  bismillah: {
    backgroundColor: colors.green,
    borderRadius: 24,
    padding: 23,
    marginBottom: 14,
  },
  bismillahArabic: {
    color: colors.white,
    fontSize: 25,
    textAlign: 'center',
    lineHeight: 40,
  },
  ayah: { ...shared.card, padding: 19, marginBottom: 12 },
  ayahTop: { flexDirection: 'row', justifyContent: 'space-between' },
  number: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: colors.green, fontWeight: '700' },
  arabic: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 46,
    textAlign: 'right',
    marginVertical: 16,
  },
  english: { color: colors.muted, fontSize: 13, lineHeight: 21 },
});
