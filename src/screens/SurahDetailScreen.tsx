import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowUp, Bookmark, Pause, Play } from 'lucide-react-native';
import {
  arabicType,
  colors,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { Ayah, getSurahs } from '../data/quran';
import { useAppPreferences } from '../components/AppPreferencesContext';
import { useQuranAudio } from '../components/QuranAudioContext';
import { RECITER_NAME } from '../services/quranAudio';
import { sameAyah, toggleAyahBookmark } from '../services/quranReading';

const LAST_READ_SAVE_DELAY_MS = 1200;
const viewabilityConfig = { itemVisiblePercentThreshold: 60 };

export default function SurahDetailScreen({ navigation, route }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences, updatePreferences } = useAppPreferences();
  const localizedSurahs = getSurahs(preferences.quranLanguage);
  const surah =
    localizedSurahs.find(item => item.number === route.params?.surahNumber) ??
    localizedSurahs[0];
  const audio = useQuranAudio();
  const playingHere =
    audio.current?.surah === surah.number ? audio.current.ayah : undefined;
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef<FlatList<Ayah>>(null);
  const targetAyah: string | undefined = route.params?.ayahNumber;
  const [highlightedAyah, setHighlightedAyah] = useState(targetAyah);
  const bookmarks = preferences.quranBookmarks;
  const toggleBookmark = (ayah: string) =>
    updatePreferences({
      quranBookmarks: toggleAyahBookmark(bookmarks, {
        surah: surah.number,
        ayah,
      }),
    });

  // Jump to the requested verse whenever this screen is opened for one.
  useEffect(() => {
    setHighlightedAyah(targetAyah);
    const index = surah.ayahs.findIndex(ayah => ayah.number === targetAyah);
    if (index < 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      return;
    }
    const timer = setTimeout(
      () => listRef.current?.scrollToIndex({ index, viewPosition: 0.1 }),
      250,
    );
    return () => clearTimeout(timer);
  }, [surah, targetAyah]);

  // Remember the verse at the top of the screen, without writing on every scroll.
  const pendingLastRead = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surahNumberRef = useRef(surah.number);
  surahNumberRef.current = surah.number;
  const lastReadRef = useRef(preferences.quranLastRead);
  lastReadRef.current = preferences.quranLastRead;
  const flushLastRead = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const ayah = pendingLastRead.current;
    pendingLastRead.current = null;
    if (!ayah) return;
    const next = { surah: surahNumberRef.current, ayah };
    if (lastReadRef.current && sameAyah(lastReadRef.current, next)) return;
    updatePreferences({ quranLastRead: next });
  }, [updatePreferences]);
  useEffect(() => flushLastRead, [flushLastRead]);
  const topVisibleAyah = useRef(targetAyah ?? '1');
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Ayah>[] }) => {
      const first = viewableItems.find(token => token.isViewable)?.item;
      if (!first) return;
      pendingLastRead.current = first.number;
      topVisibleAyah.current = first.number;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(
        () => flushLastReadRef.current(),
        LAST_READ_SAVE_DELAY_MS,
      );
    },
  ).current;
  const flushLastReadRef = useRef(flushLastRead);
  flushLastReadRef.current = flushLastRead;

  // Follow the recitation: highlight the verse being recited and keep it in view.
  useEffect(() => {
    if (!playingHere) return;
    setHighlightedAyah(playingHere);
    const index = surah.ayahs.findIndex(ayah => ayah.number === playingHere);
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, viewPosition: 0.1 });
    }
  }, [playingHere, surah]);

  const toggleSurahRecitation = () =>
    playingHere
      ? audio.togglePause()
      : audio.play(surah.number, topVisibleAyah.current);
  const surahPlaying = Boolean(playingHere) && !audio.paused;

  const renderAyah = ({ item: ayah }: { item: Ayah }) => {
    const verseActive = playingHere === ayah.number && !audio.paused;
    const saved = bookmarks.some(item =>
      sameAyah(item, { surah: surah.number, ayah: ayah.number }),
    );
    return (
      <View
        style={[
          styles.ayah,
          theme.card,
          highlightedAyah === ayah.number && {
            borderColor: palette.gold,
            ...styles.ayahHighlighted,
          },
        ]}
      >
        <View style={styles.ayahTop}>
          <View style={[styles.number, { backgroundColor: palette.mint }]}>
            <Text style={[styles.numberText, { color: palette.green }]}>
              {ayah.number}
            </Text>
          </View>
          <View style={styles.ayahActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                verseActive
                  ? `Pause verse ${ayah.number}`
                  : `Play from verse ${ayah.number}`
              }
              hitSlop={8}
              onPress={() =>
                playingHere === ayah.number
                  ? audio.togglePause()
                  : audio.play(surah.number, ayah.number)
              }
            >
              {verseActive ? (
                <Pause size={19} color={palette.green} fill={palette.green} />
              ) : (
                <Play size={19} color={palette.green} />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                saved
                  ? `Remove verse ${ayah.number} bookmark`
                  : `Bookmark verse ${ayah.number}`
              }
              hitSlop={8}
              onPress={() => toggleBookmark(ayah.number)}
            >
              <Bookmark
                size={19}
                color={palette.gold}
                fill={saved ? palette.gold : 'transparent'}
              />
            </Pressable>
          </View>
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
        extraData={[
          preferences.quranLanguage,
          bookmarks,
          highlightedAyah,
          playingHere,
          audio.paused,
        ]}
        initialNumToRender={8}
        keyExtractor={ayah => ayah.number}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        renderItem={renderAyah}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({
            offset: index * averageItemLength,
            animated: false,
          });
          setTimeout(
            () => listRef.current?.scrollToIndex({ index, viewPosition: 0.1 }),
            120,
          );
        }}
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
                accessibilityLabel={
                  surahPlaying
                    ? `Pause ${surah.name} recitation`
                    : `Play ${surah.name} recitation`
                }
                onPress={toggleSurahRecitation}
                style={[
                  styles.button,
                  theme.card,
                  playingHere && styles.buttonActive,
                ]}
              >
                {playingHere && audio.buffering && !audio.paused ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : surahPlaying ? (
                  <Pause size={18} color={colors.white} fill={colors.white} />
                ) : (
                  <Play
                    size={19}
                    color={playingHere ? colors.white : palette.green}
                  />
                )}
              </Pressable>
            </View>
            <View style={styles.bismillah}>
              <Text style={styles.bismillahArabic}>
                {surah.number !== '1' && surah.number !== '9'
                  ? 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ'
                  : surah.arabicName}
              </Text>
              <Text style={styles.playing}>
                {RECITER_NAME.toUpperCase()} RECITATION
              </Text>
            </View>
          </>
        }
      />
      {showScrollTop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scroll to the top of the surah"
          onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
          style={[
            styles.scrollTop,
            { backgroundColor: palette.green },
            audio.current && styles.scrollTopAbovePlayer,
          ]}
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
    ...arabicType.ayah,
    color: colors.white,
    textAlign: 'center',
  },
  playing: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 8,
  },
  ayah: {
    ...shared.card,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 10,
  },
  ayahHighlighted: { borderWidth: 1.5 },
  ayahTop: { flexDirection: 'row', justifyContent: 'space-between' },
  ayahActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
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
    ...arabicType.ayah,
    color: colors.ink,
    marginTop: 12,
    marginBottom: 10,
  },
  english: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  rtlTranslation: { textAlign: 'right', writingDirection: 'rtl' },
  scrollTopAbovePlayer: { bottom: 160 },
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
