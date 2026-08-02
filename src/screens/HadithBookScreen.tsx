import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bookmark, Share2 } from 'lucide-react-native';
import { colors, shared } from '../components/DesignSystem';
import { hadithCollections } from '../data/hadith';

export default function HadithBookScreen({ navigation, route }: any) {
  const book =
    hadithCollections.find(item => item.id === route.params?.bookId) ??
    hadithCollections[0];
  const [saved, setSaved] = useState<string[]>([]);
  const toggleSaved = (number: string) =>
    setSaved(items =>
      items.includes(number)
        ? items.filter(item => item !== number)
        : [...items, number],
    );
  const shareHadith = (translation: string, number: string) =>
    Share.share({ message: `${translation}\n\n${book.title} · ${number}` });

  return (
    <SafeAreaView style={shared.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Hadith library"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            <ArrowLeft size={20} color={colors.ink} />
          </Pressable>
          <View style={styles.heading}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.subtitle}>{book.compiler}</Text>
          </View>
          <View style={styles.button}>
            <Bookmark size={19} color={colors.green} />
          </View>
        </View>
        <View style={styles.cover}>
          <Text style={styles.arabicTitle}>{book.arabicTitle}</Text>
          <Text style={styles.coverTitle}>{book.title}</Text>
          <Text style={styles.coverMeta}>
            {book.sizeLabel} · {book.category}
          </Text>
        </View>
        <Text style={styles.description}>{book.description}</Text>
        <View style={styles.previewNote}>
          <Text style={styles.previewTitle}>READER PREVIEW</Text>
          <Text style={styles.previewText}>
            A curated preview is available offline. Full collection text can be
            connected to your preferred verified Hadith data source.
          </Text>
        </View>
        {book.samples.map(hadith => {
          const isSaved = saved.includes(hadith.number);
          return (
            <View key={hadith.number} style={styles.hadith}>
              <View style={styles.hadithTop}>
                <View style={styles.number}>
                  <Text style={styles.numberText}>{hadith.number}</Text>
                </View>
                <View style={styles.hadithActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Share Hadith"
                    onPress={() =>
                      shareHadith(hadith.translation, hadith.number)
                    }
                  >
                    <Share2 size={18} color={colors.muted} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isSaved ? 'Remove Hadith bookmark' : 'Bookmark Hadith'
                    }
                    onPress={() => toggleSaved(hadith.number)}
                  >
                    <Bookmark
                      size={19}
                      color={colors.gold}
                      fill={isSaved ? colors.gold : 'transparent'}
                    />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.arabic}>{hadith.arabic}</Text>
              <Text style={styles.translation}>{hadith.translation}</Text>
              <Text style={styles.narrator}>{hadith.narrator}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
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
  previewNote: {
    backgroundColor: '#EFE6D3',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
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
  hadith: { ...shared.card, padding: 19, marginBottom: 12 },
  hadithTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  hadithActions: { flexDirection: 'row', gap: 17 },
  arabic: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 44,
    textAlign: 'right',
    marginVertical: 17,
  },
  translation: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  narrator: { color: colors.muted, fontSize: 10, marginTop: 12 },
});
