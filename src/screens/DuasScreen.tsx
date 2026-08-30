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
import { useAppPreferences } from '../components/AppPreferencesContext';
import { quranLanguageOptions, type QuranLanguageCode } from '../data/quran';

type LocalizedText = Record<QuranLanguageCode, string>;

type DuaCollection = {
  Icon: React.ComponentType<any>;
  title: string;
  count: string;
  arabic: string;
  translation: LocalizedText;
  source?: string;
};

const dailyDua = {
  arabic: 'رَبِّ زِدْنِي عِلْمًا',
  source: 'Taha · 20:114',
  translation: {
    en: 'My Lord, increase me in knowledge.',
    bn: 'হে আমার রব, আমার জ্ঞান বৃদ্ধি করুন।',
    zh: '我的主啊，求你增加我的知识。',
    es: 'Señor mío, aumenta mi conocimiento.',
    fr: 'Seigneur, augmente mon savoir.',
    fa: 'پروردگارا، دانش مرا افزون کن.',
    id: 'Ya Tuhanku, tambahkanlah ilmuku.',
    ru: 'Господи, увеличь мои знания.',
    sv: 'Min Herre, öka min kunskap.',
    tr: 'Rabbim, ilmimi artır.',
    ur: 'اے میرے رب، میرے علم میں اضافہ فرما۔',
  },
};

const collections: DuaCollection[] = [
  {
    Icon: CloudSun,
    title: 'Morning',
    count: '12 duas',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا',
    translation: {
      en: 'O Allah, by You we enter the morning.',
      bn: 'হে আল্লাহ, আপনার সাহায্যেই আমরা সকালে উপনীত হলাম।',
      zh: '真主啊，凭借你我们进入清晨。',
      es: 'Oh Allah, por Ti llegamos a la mañana.',
      fr: 'O Allah, par Toi nous entrons dans le matin.',
      fa: 'خدایا، به یاری تو وارد صبح شدیم.',
      id: 'Ya Allah, dengan pertolongan-Mu kami memasuki pagi.',
      ru: 'О Аллах, благодаря Тебе мы встретили утро.',
      sv: 'O Allah, genom Dig går vi in i morgonen.',
      tr: 'Allahım, Seninle sabaha eriştik.',
      ur: 'اے اللہ، تیرے ہی ذریعے ہم صبح میں داخل ہوئے۔',
    },
  },
  {
    Icon: Moon,
    title: 'Evening',
    count: '14 duas',
    arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا',
    translation: {
      en: 'O Allah, by You we enter the evening.',
      bn: 'হে আল্লাহ, আপনার সাহায্যেই আমরা সন্ধ্যায় উপনীত হলাম।',
      zh: '真主啊，凭借你我们进入夜晚。',
      es: 'Oh Allah, por Ti llegamos a la noche.',
      fr: 'O Allah, par Toi nous entrons dans le soir.',
      fa: 'خدایا، به یاری تو وارد شام شدیم.',
      id: 'Ya Allah, dengan pertolongan-Mu kami memasuki petang.',
      ru: 'О Аллах, благодаря Тебе мы встретили вечер.',
      sv: 'O Allah, genom Dig går vi in i kvällen.',
      tr: 'Allahım, Seninle akşama eriştik.',
      ur: 'اے اللہ، تیرے ہی ذریعے ہم شام میں داخل ہوئے۔',
    },
  },
  {
    Icon: Shield,
    title: 'Protection',
    count: '9 duas',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ',
    translation: {
      en: 'I seek refuge in the perfect words of Allah.',
      bn: 'আমি আল্লাহর পরিপূর্ণ কথাগুলোর আশ্রয় চাই।',
      zh: '我求真主完美的话语庇护。',
      es: 'Busco refugio en las palabras perfectas de Allah.',
      fr: "Je cherche refuge dans les paroles parfaites d'Allah.",
      fa: 'به کلمات کامل خدا پناه می‌برم.',
      id: 'Aku berlindung dengan kalimat-kalimat Allah yang sempurna.',
      ru: 'Я ищу защиты в совершенных словах Аллаха.',
      sv: 'Jag söker skydd i Allahs fullkomliga ord.',
      tr: 'Allah’ın eksiksiz kelimelerine sığınırım.',
      ur: 'میں اللہ کے کامل کلمات کی پناہ مانگتا ہوں۔',
    },
  },
  {
    Icon: Home,
    title: 'Home & family',
    count: '11 duas',
    arabic:
      'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ',
    translation: {
      en: 'Our Lord, bless us with spouses and offspring who will be the joy of our hearts.',
      bn: 'হে আমাদের রব, আমাদের জীবনসঙ্গী ও সন্তানদের আমাদের চোখের শীতলতা করুন।',
      zh: '我们的主啊，求你使我们的配偶和子孙成为我们眼中的慰藉。',
      es: 'Señor nuestro, concédenos cónyuges e hijos que sean alegría para nuestros corazones.',
      fr: 'Notre Seigneur, accorde-nous des époux et des enfants qui réjouissent nos coeurs.',
      fa: 'پروردگارا، همسران و فرزندانمان را روشنی چشم ما قرار ده.',
      id: 'Ya Tuhan kami, anugerahkanlah kepada kami pasangan dan keturunan yang menyejukkan hati.',
      ru: 'Господи наш, даруй нам супругов и потомство, которые будут радостью для наших сердец.',
      sv: 'Vår Herre, ge oss makar och barn som skänker våra hjärtan glädje.',
      tr: 'Rabbimiz, eşlerimizi ve çocuklarımızı göz aydınlığı kıl.',
      ur: 'اے ہمارے رب، ہمارے شریک حیات اور اولاد کو ہماری آنکھوں کی ٹھنڈک بنا۔',
    },
  },
];

export default function DuasScreen() {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences } = useAppPreferences();
  const activeLanguage =
    quranLanguageOptions.find(
      option => option.code === preferences.quranLanguage,
    ) ?? quranLanguageOptions[0];
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
  const localized = (translation: LocalizedText) =>
    translation[preferences.quranLanguage] ?? translation.en;
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
              <View style={styles.languageHeader}>
                <Text style={styles.languageLabel}>Arabic</Text>
                <Text style={styles.languageMeta}>
                  {activeLanguage.label} translation
                </Text>
              </View>
              <Text style={styles.arabic}>{selectedCollection.arabic}</Text>
              <Text style={styles.translation}>
                {localized(selectedCollection.translation)}
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
                <View style={styles.languageHeader}>
                  <Text style={styles.languageLabel}>Arabic</Text>
                  <Text style={styles.languageMeta}>
                    {activeLanguage.label} translation
                  </Text>
                </View>
                <Text style={styles.arabic}>{dailyDua.arabic}</Text>
                <Text style={styles.translation}>
                  {localized(dailyDua.translation)}
                </Text>
                <Text style={styles.source}>{dailyDua.source}</Text>
              </View>
            ) : null}
            <Text style={[styles.section, theme.mutedText]}>
              {showSaved ? 'FAVOURITES' : 'COLLECTIONS'}
            </Text>
            <View style={styles.grid}>
              {visibleCollections.map(
                ({ Icon, title, count, arabic, translation }) => (
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
                    <Text
                      numberOfLines={2}
                      style={[styles.cardArabic, theme.text]}
                    >
                      {arabic}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[styles.cardTranslation, theme.mutedText]}
                    >
                      {localized(translation)}
                    </Text>
                  </Pressable>
                ),
              )}
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
  languageHeader: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FFFFFF22',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingVertical: 9,
  },
  languageLabel: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  languageMeta: {
    color: '#BCD3CB',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  arabic: {
    color: colors.white,
    fontSize: 29,
    textAlign: 'right',
    lineHeight: 46,
    writingDirection: 'rtl',
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
  card: { ...shared.card, flexBasis: '47%', flexGrow: 1, padding: 17 },
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
  cardArabic: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 13,
    minHeight: 50,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardTranslation: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
  },
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
