import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bookmark, Pause, Play } from 'lucide-react-native';
import { colors, shared } from '../components/DesignSystem';
import { surahs } from '../data/quran';

export default function SurahDetailScreen({ navigation, route }: any) {
  const surah =
    surahs.find(item => item.number === route.params?.surahNumber) ?? surahs[0];
  const [playing, setPlaying] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const toggleBookmark = (number: string) =>
    setBookmarks(items =>
      items.includes(number)
        ? items.filter(item => item !== number)
        : [...items, number],
    );

  return (
    <SafeAreaView style={shared.screen} edges={['top']}>
      <ScrollView contentContainerStyle={shared.content}>
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Quran"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            <ArrowLeft size={20} color={colors.ink} />
          </Pressable>
          <View style={styles.heading}>
            <Text style={styles.title}>{surah.name}</Text>
            <Text style={styles.subtitle}>
              {surah.meaning} · {surah.verseCount} verses
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              playing ? 'Pause recitation' : 'Play recitation'
            }
            onPress={() => setPlaying(value => !value)}
            style={[styles.button, playing && styles.buttonActive]}
          >
            {playing ? (
              <Pause size={19} fill={colors.white} color={colors.white} />
            ) : (
              <Play size={19} color={colors.green} />
            )}
          </Pressable>
        </View>
        <View style={styles.bismillah}>
          <Text style={styles.bismillahArabic}>
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </Text>
          {playing ? (
            <Text style={styles.playing}>RECITATION PLAYING</Text>
          ) : null}
        </View>
        {surah.ayahs.map(ayah => {
          const saved = bookmarks.includes(ayah.number);
          return (
            <View key={ayah.number} style={styles.ayah}>
              <View style={styles.ayahTop}>
                <View style={styles.number}>
                  <Text style={styles.numberText}>{ayah.number}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    saved
                      ? `Remove verse ${ayah.number} bookmark`
                      : `Bookmark verse ${ayah.number}`
                  }
                  onPress={() => toggleBookmark(ayah.number)}
                >
                  <Bookmark
                    size={19}
                    color={colors.gold}
                    fill={saved ? colors.gold : 'transparent'}
                  />
                </Pressable>
              </View>
              <Text style={styles.arabic}>{ayah.arabic}</Text>
              <Text style={styles.english}>{ayah.translation}</Text>
            </View>
          );
        })}
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
  buttonActive: { backgroundColor: colors.green },
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
  playing: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 8,
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
