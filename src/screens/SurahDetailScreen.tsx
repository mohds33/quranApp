import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowUp, Bookmark, Play } from 'lucide-react-native';
import {
  colors,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { Ayah, getSurahs } from '../data/quran';
import { useAppPreferences } from '../components/AppPreferencesContext';
import { getSurahRecitationUrl } from '../services/quranAudio';

export default function SurahDetailScreen({ navigation, route }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences } = useAppPreferences();
  const localizedSurahs = getSurahs(preferences.quranLanguage);
  const surah =
    localizedSurahs.find(item => item.number === route.params?.surahNumber) ??
    localizedSurahs[0];
  const [openingRecitation, setOpeningRecitation] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef<FlatList<Ayah>>(null);
  const toggleBookmark = (number: string) =>
    setBookmarks(items =>
      items.includes(number)
        ? items.filter(item => item !== number)
        : [...items, number],
    );
  const openRecitation = async () => {
    setOpeningRecitation(true);
    try {
      await Linking.openURL(getSurahRecitationUrl(surah.number));
    } catch {
      Alert.alert(
        'Recitation unavailable',
        'Could not open the Quran audio stream. Check your connection and try again.',
      );
    } finally {
      setOpeningRecitation(false);
    }
  };

  const renderAyah = ({ item: ayah }: { item: Ayah }) => {
    const saved = bookmarks.includes(ayah.number);
    return (
      <View style={[styles.ayah, theme.card]}>
        <View style={styles.ayahTop}>
          <View style={[styles.number, { backgroundColor: palette.mint }]}>
            <Text style={[styles.numberText, { color: palette.green }]}>
              {ayah.number}
            </Text>
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
              color={palette.gold}
              fill={saved ? palette.gold : 'transparent'}
            />
          </Pressable>
        </View>
        <Text style={[styles.arabic, theme.text]}>{ayah.arabic}</Text>
        <Text
          style={[
            styles.english,
            theme.mutedText,
            preferences.quranLanguage === 'fa' && styles.rtlTranslation,
          ]}
        >
          {ayah.translation}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <FlatList
        ref={listRef}
        contentContainerStyle={shared.content}
        data={surah.ayahs}
        extraData={preferences.quranLanguage}
        initialNumToRender={8}
        keyExtractor={ayah => ayah.number}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        renderItem={renderAyah}
        onScroll={event =>
          setShowScrollTop(event.nativeEvent.contentOffset.y > 600)
        }
        scrollEventThrottle={100}
        windowSize={7}
        ListHeaderComponent={
          <>
            <View style={styles.top}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to Quran"
                onPress={() => navigation.goBack()}
                style={[styles.button, theme.card]}
              >
                <ArrowLeft size={20} color={palette.ink} />
              </Pressable>
              <View style={styles.heading}>
                <Text style={[styles.title, theme.text]}>{surah.name}</Text>
                <Text style={[styles.subtitle, theme.mutedText]}>
                  {surah.meaning} · {surah.verseCount} verses ·{' '}
                  {surah.revelationType}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${surah.name} recitation`}
                disabled={openingRecitation}
                onPress={openRecitation}
                style={[
                  styles.button,
                  theme.card,
                  openingRecitation && styles.buttonActive,
                ]}
              >
                {openingRecitation ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Play size={19} color={palette.green} />
                )}
              </Pressable>
            </View>
            <View style={styles.bismillah}>
              <Text style={styles.bismillahArabic}>
                {surah.number !== '1' && surah.number !== '9'
                  ? 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ'
                  : surah.arabicName}
              </Text>
              <Text style={styles.playing}>Mishary Alafasy recitation</Text>
            </View>
          </>
        }
      />
      {showScrollTop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scroll to the top of the surah"
          onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
          style={[styles.scrollTop, { backgroundColor: palette.green }]}
        >
          <ArrowUp size={20} color={colors.white} />
        </Pressable>
      ) : null}
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
  subtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },
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
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
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
  rtlTranslation: { textAlign: 'right', writingDirection: 'rtl' },
  scrollTop: {
    position: 'absolute',
    right: 20,
    bottom: 92,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
});
