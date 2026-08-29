import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  ChevronRight,
  Compass,
  MapPin,
  Play,
} from 'lucide-react-native';
import {
  colors,
  Eyebrow,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { useSelectedMosque } from '../components/SelectedMosqueContext';
import {
  calculatePrayerSchedule,
  calculateQiblaDirection,
  getNextPrayerOccurrence,
  prayerNames,
} from '../services/prayerTimes';
import type { DailyPrayerSchedule } from '../services/prayerTimes';
import { getAyahRecitationUrl } from '../services/quranAudio';
import { useAppPreferences } from '../components/AppPreferencesContext';
import { getHadithSampleTranslation, hadithCollections } from '../data/hadith';

function formatCountdown(target: Date, now: Date) {
  const diffMs = target.getTime() - now.getTime();
  const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `in ${minutes} min`;
  return `in ${hours} hr ${minutes} min`;
}

function dailyHadith(date: Date) {
  const shortHadiths = hadithCollections
    .flatMap(collection =>
      collection.samples.map(sample => ({ collection, sample })),
    )
    .filter(
      (entry, index, entries) =>
        entry.sample.translation.trim().split(/\s+/).length <= 30 &&
        entries.findIndex(
          candidate => candidate.sample.arabic === entry.sample.arabic,
        ) === index,
    );
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
  );
  return shortHadiths[dayNumber % shortHadiths.length];
}

export default function HomeScreen({ navigation }: any) {
  const { palette, isDark } = useAppTheme();
  const theme = useThemeStyles();
  const { selectedMosque, findingClosestMosque } = useSelectedMosque();
  const { preferences } = useAppPreferences();
  const [openingRecitation, setOpeningRecitation] = useState(false);
  const [schedule, setSchedule] = useState<DailyPrayerSchedule | null>(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    if (!selectedMosque) return;
    setSchedule(calculatePrayerSchedule(selectedMosque, now));
  }, [now, selectedMosque]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); //updates every 30 secondss
    return () => clearInterval(interval);
  }, []);

  const openQuran = (surahNumber = '2') => {
    navigation.navigate('Quran', {
      screen: 'SurahDetail',
      params: { surahNumber },
    });
  };

  const openAyatulKursiRecitation = async () => {
    setOpeningRecitation(true);
    try {
      await Linking.openURL(getAyahRecitationUrl(262));
    } catch {
      Alert.alert(
        'Recitation unavailable',
        'Could not open the Quran audio stream. Check your connection and try again.',
      );
    } finally {
      setOpeningRecitation(false);
    }
  };
  const nextPrayer =
    schedule && selectedMosque
      ? getNextPrayerOccurrence(schedule, selectedMosque, now)
      : null;
  const reflection = dailyHadith(now);

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <View>
            <Text style={[styles.greeting, theme.text]}>Assalamu alaikum</Text>
            <Text style={[styles.currentDate, theme.mutedText]}>
              {schedule?.readableDate ??
                new Intl.DateTimeFormat(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }).format(now)}
            </Text>
            <View style={styles.location}>
              <MapPin size={13} color={palette.muted} />
              <Text style={[styles.locationText, theme.mutedText]}>
                {findingClosestMosque
                  ? 'Finding closest masjid...'
                  : selectedMosque?.name ?? 'No masjid selected'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View full prayer schedule"
          onPress={() => navigation.navigate('Prayer')}
          style={styles.hero}
        >
          <View style={styles.orbitOne} />
          <View style={styles.orbitTwo} />
          <Eyebrow>Next prayer</Eyebrow>
          {nextPrayer ? (
            <>
              <Text style={styles.prayerName}>{nextPrayer.name}</Text>
              <Text style={styles.prayerTime}>{nextPrayer.timing}</Text>
              <View style={styles.heroFooter}>
                <Text style={styles.countdown}>
                  {formatCountdown(nextPrayer.date, now)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Show Qibla direction"
                  onPress={event => {
                    event.stopPropagation();
                    const qibla = selectedMosque
                      ? calculateQiblaDirection(selectedMosque)
                      : null;
                    Alert.alert(
                      'Qibla direction',
                      qibla
                        ? `Face ${Math.round(qibla)}°.`
                        : 'Location unavailable.',
                    );
                  }}
                  style={styles.qibla}
                >
                  <Compass size={15} color={colors.white} />
                  <Text style={styles.qiblaText}>
                    {selectedMosque
                      ? `Qibla ${Math.round(
                          calculateQiblaDirection(selectedMosque),
                        )}°`
                      : 'Qibla —'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.prayerName}>Loading…</Text>
          )}
        </Pressable>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, theme.text]}>Today's prayers</Text>
          <Text style={[styles.date, theme.mutedText]}>
            {schedule?.hijriDate ?? ''}
          </Text>
        </View>
        <View style={styles.times}>
          {prayerNames.map(name => (
            <View key={name} style={styles.timeItem}>
              <Text style={[styles.timeName, theme.mutedText]}>{name}</Text>
              <Text style={[styles.timeValue, theme.text]}>
                {schedule?.timings[name] ?? '—'}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue reading Al-Baqarah"
          onPress={() => openQuran('2')}
          style={[styles.continueCard, theme.card]}
        >
          <View style={[styles.bookIcon, { backgroundColor: palette.mint }]}>
            <BookOpen size={22} color={palette.green} />
          </View>
          <View style={styles.continueCopy}>
            <Text style={styles.overline}>CONTINUE READING</Text>
            <Text style={[styles.surah, theme.text]}>Al-Baqarah</Text>
            <Text style={[styles.ayah, theme.mutedText]}>
              Verse 255 · Ayatul Kursi
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Ayatul Kursi recitation"
            disabled={openingRecitation}
            onPress={event => {
              event.stopPropagation();
              openAyatulKursiRecitation();
            }}
            style={styles.play}
          >
            <Play size={18} fill={colors.white} color={colors.white} />
          </Pressable>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Read ${reflection.collection.title}`}
          onPress={() =>
            navigation.navigate('Hadith', {
              screen: 'HadithBook',
              params: { bookId: reflection.collection.id },
            })
          }
          style={[
            styles.verseCard,
            isDark ? styles.warmCardDark : styles.warmCardLight,
          ]}
        >
          <Text style={styles.verseLabel}>DAILY REFLECTION</Text>
          <Text style={[styles.arabic, theme.text]}>
            {reflection.sample.arabic}
          </Text>
          <Text style={[styles.translation, theme.text]}>
            “
            {getHadithSampleTranslation(
              reflection.sample,
              preferences.quranLanguage,
            )}
            ”
          </Text>
          <View style={styles.verseFoot}>
            <Text style={[styles.reference, theme.mutedText]}>
              {reflection.collection.title} · {reflection.sample.number}
            </Text>
            <ChevronRight size={17} color={colors.gold} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topbar: {
    marginBottom: 22,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.6,
  },
  location: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginTop: 5,
  },
  currentDate: { color: colors.muted, fontSize: 12, marginTop: 5 },
  locationText: { color: colors.muted, fontSize: 13 },
  hero: {
    height: 230,
    backgroundColor: colors.green,
    borderRadius: 30,
    padding: 25,
    overflow: 'hidden',
    marginBottom: 27,
  },
  orbitOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: '#FFFFFF20',
    right: -80,
    top: -60,
  },
  orbitTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: '#FFFFFF18',
    right: -12,
    top: 10,
  },
  prayerName: {
    color: colors.white,
    fontSize: 31,
    fontWeight: '600',
    marginTop: 18,
  },
  prayerTime: {
    color: colors.white,
    fontSize: 47,
    fontWeight: '300',
    letterSpacing: -1,
    marginTop: -2,
  },
  period: { fontSize: 17, fontWeight: '600' },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  countdown: { color: '#D8E7E1', fontSize: 13 },
  qibla: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: '#FFFFFF18',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
  },
  qiblaText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  date: { color: colors.muted, fontSize: 13 },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 27,
  },
  timeItem: { alignItems: 'center', gap: 7 },
  timeName: { color: colors.muted, fontSize: 10 },
  timeValue: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  continueCard: {
    ...shared.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bookIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCopy: { flex: 1, marginLeft: 13 },
  overline: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  surah: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 3 },
  ayah: { color: colors.muted, fontSize: 11, marginTop: 2 },
  play: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  verseCard: { backgroundColor: '#EFE6D3', padding: 22, borderRadius: 24 },
  warmCardLight: { backgroundColor: '#EFE6D3' },
  warmCardDark: { backgroundColor: '#29271F' },
  verseLabel: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  arabic: {
    color: colors.ink,
    fontSize: 25,
    textAlign: 'right',
    marginVertical: 17,
    lineHeight: 41,
  },
  translation: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  verseFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  reference: { color: colors.muted, fontSize: 11, fontWeight: '600' },
});
