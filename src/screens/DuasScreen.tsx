import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CloudSun,
  Heart,
  Home,
  Moon,
  Shield,
} from 'lucide-react-native';
import {
  colors,
  ScreenTitle,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';

const collections = [
  {
    Icon: CloudSun,
    title: 'Morning',
    count: '12 duas',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا',
    translation: 'O Allah, by You we enter the morning.',
  },
  {
    Icon: Moon,
    title: 'Evening',
    count: '14 duas',
    arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا',
    translation: 'O Allah, by You we enter the evening.',
  },
  {
    Icon: Shield,
    title: 'Protection',
    count: '9 duas',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ',
    translation: 'I seek refuge in the perfect words of Allah.',
  },
  {
    Icon: Home,
    title: 'Home & family',
    count: '11 duas',
    arabic:
      'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ',
    translation:
      'Our Lord, bless us with spouses and offspring who will be the joy of our hearts.',
  },
];

export default function DuasScreen() {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const [selected, setSelected] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<string[]>(['Morning']);
  const [showSaved, setShowSaved] = useState(false);
  const visibleCollections = useMemo(
    () =>
      showSaved
        ? collections.filter(item => favourites.includes(item.title))
        : collections,
    [showSaved, favourites],
  );
  const selectedCollection = collections.find(item => item.title === selected);
  const toggleFavourite = (title: string) =>
    setFavourites(items =>
      items.includes(title)
        ? items.filter(item => item !== title)
        : [...items, title],
    );

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView contentContainerStyle={shared.content}>
        <ScreenTitle
          title={
            selectedCollection?.title ?? (showSaved ? 'Saved duas' : 'Duas')
          }
          subtitle={
            selectedCollection
              ? selectedCollection.count
              : showSaved
              ? `${favourites.length} favourites`
              : 'Words for every moment'
          }
        />
        {selectedCollection ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Dua collections"
              onPress={() => setSelected(null)}
              style={styles.back}
            >
              <ArrowLeft size={18} color={palette.green} />
              <Text style={[styles.backText, { color: palette.green }]}>
                All collections
              </Text>
            </Pressable>
            <View style={styles.feature}>
              <Text style={styles.label}>
                {selectedCollection.title.toUpperCase()}
              </Text>
              <Text style={styles.arabic}>{selectedCollection.arabic}</Text>
              <Text style={styles.translation}>
                {selectedCollection.translation}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle favourite"
                onPress={() => toggleFavourite(selectedCollection.title)}
                style={styles.favourite}
              >
                <Heart
                  size={18}
                  color={colors.gold}
                  fill={
                    favourites.includes(selectedCollection.title)
                      ? colors.gold
                      : 'transparent'
                  }
                />
                <Text style={styles.favouriteText}>
                  {favourites.includes(selectedCollection.title)
                    ? 'Saved'
                    : 'Save dua'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {!showSaved ? (
              <View style={styles.feature}>
                <Text style={styles.label}>DUA OF THE DAY</Text>
                <Text style={styles.arabic}>رَبِّ زِدْنِي عِلْمًا</Text>
                <Text style={styles.translation}>
                  My Lord, increase me in knowledge.
                </Text>
                <Text style={styles.source}>Taha · 20:114</Text>
              </View>
            ) : null}
            <Text style={[styles.section, theme.mutedText]}>
              {showSaved ? 'FAVOURITES' : 'COLLECTIONS'}
            </Text>
            <View style={styles.grid}>
              {visibleCollections.map(({ Icon, title, count }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${title} duas`}
                  onPress={() => setSelected(title)}
                  key={title}
                  style={[styles.card, theme.card]}
                >
                  <View
                    style={[styles.icon, { backgroundColor: palette.mint }]}
                  >
                    <Icon size={22} color={palette.green} />
                  </View>
                  <Text style={[styles.title, theme.text]}>{title}</Text>
                  <Text style={[styles.count, theme.mutedText]}>{count}</Text>
                </Pressable>
              ))}
            </View>
            {showSaved && !visibleCollections.length ? (
              <Text style={[styles.empty, theme.mutedText]}>
                No saved duas yet.
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showSaved ? 'Show all Dua collections' : 'Show saved Duas'
              }
              onPress={() => setShowSaved(value => !value)}
              style={[
                styles.saved,
                theme.card,
                showSaved && styles.savedActive,
              ]}
            >
              <Heart
                size={20}
                color={showSaved ? colors.white : colors.gold}
                fill={showSaved ? colors.white : 'transparent'}
              />
              <View>
                <Text
                  style={[
                    styles.savedTitle,
                    !showSaved && theme.text,
                    showSaved && styles.savedTitleActive,
                  ]}
                >
                  {showSaved ? 'All collections' : 'Saved duas'}
                </Text>
                <Text
                  style={[
                    styles.savedMeta,
                    !showSaved && theme.mutedText,
                    showSaved && styles.savedMetaActive,
                  ]}
                >
                  {favourites.length} favourites
                </Text>
              </View>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  feature: {
    backgroundColor: colors.green,
    borderRadius: 28,
    padding: 24,
    marginBottom: 26,
  },
  label: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  arabic: {
    color: colors.white,
    fontSize: 29,
    textAlign: 'right',
    lineHeight: 46,
    marginTop: 17,
  },
  translation: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
  source: { color: '#BCD3CB', fontSize: 11, marginTop: 12 },
  back: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: { color: colors.green, fontWeight: '700' },
  section: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  card: { ...shared.card, width: '48%', padding: 17 },
  icon: {
    width: 41,
    height: 41,
    borderRadius: 14,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 14 },
  count: { color: colors.muted, fontSize: 11, marginTop: 3 },
  saved: {
    ...shared.card,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  savedActive: { backgroundColor: colors.green },
  savedTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  savedTitleActive: { color: colors.white },
  savedMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  savedMetaActive: { color: '#BCD3CB' },
  empty: { color: colors.muted, textAlign: 'center', marginBottom: 20 },
  favourite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
  },
  favouriteText: { color: colors.gold, fontWeight: '700', fontSize: 12 },
});
