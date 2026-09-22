import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BedDouble,
  BookOpen,
  ChevronRight,
  CloudRain,
  Heart,
  HeartPulse,
  House,
  Landmark,
  Pause,
  Play,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Users,
  Utensils,
  X,
} from 'lucide-react-native';
import {
  arabicType,
  colors,
  shared,
  useAppTheme,
  useThemeStyles,
  ScreenTitle,
} from '../components/DesignSystem';
import { useAppPreferences } from '../components/AppPreferencesContext';
import { useQuranAudio } from '../components/QuranAudioContext';
import {
  categoryDuaCount,
  dailyDua,
  duaCategories,
  findDuas,
  getQuranDuas,
  hisnChapters,
  searchDuas,
  type Dua,
  type DuaCategoryKey,
} from '../data/duas';

const categoryIcons: Record<DuaCategoryKey, React.ComponentType<any>> = {
  morningEvening: Sunrise,
  sleep: BedDouble,
  prayer: Landmark,
  daily: House,
  food: Utensils,
  travel: Plane,
  hardship: ShieldCheck,
  forgiveness: Sparkles,
  family: Users,
  illness: HeartPulse,
  nature: CloudRain,
  hajj: Landmark,
};

type DuaView =
  | { type: 'home' }
  | { type: 'category'; key: DuaCategoryKey }
  | { type: 'chapter'; id: number }
  | { type: 'quran' }
  | { type: 'saved' };

const rtlLanguages = new Set(['fa', 'ur']);

function DuaCard({
  dua,
  saved,
  onToggleSaved,
  showSource = true,
  rtlTranslation = false,
}: {
  dua: Dua;
  saved: boolean;
  onToggleSaved: () => void;
  showSource?: boolean;
  rtlTranslation?: boolean;
}) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const audio = useQuranAudio();
  const playing = audio.clip?.key === dua.key && !audio.paused;
  return (
    <View style={[styles.dua, theme.card]}>
      {dua.arabic ? (
        <Text
          style={[
            styles.duaArabic,
            // Quranic duas carry the Uthmani marks the mushaf face draws.
            dua.key.startsWith('q') && styles.duaArabicQuran,
            theme.text,
          ]}
        >
          {dua.arabic}
        </Text>
      ) : null}
      {dua.transliteration ? (
        <Text style={[styles.transliteration, { color: palette.green }]}>
          {dua.transliteration}
        </Text>
      ) : null}
      {dua.translation ? (
        <Text
          style={[
            styles.duaTranslation,
            theme.mutedText,
            rtlTranslation && styles.rtl,
          ]}
        >
          {dua.translation}
        </Text>
      ) : null}
      <View style={styles.duaFooter}>
        <View style={styles.duaMeta}>
          {dua.repeat > 1 ? (
            <Text
              style={[
                styles.repeat,
                { backgroundColor: palette.mint, color: palette.green },
              ]}
            >
              ×{dua.repeat}
            </Text>
          ) : null}
          {showSource ? (
            <Text numberOfLines={1} style={[styles.source, theme.mutedText]}>
              {dua.source}
            </Text>
          ) : null}
        </View>
        {dua.audio ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pause dua' : 'Play dua'}
            hitSlop={8}
            onPress={() =>
              audio.clip?.key === dua.key
                ? audio.togglePause()
                : audio.playClip({
                    key: dua.key,
                    url: dua.audio!,
                    title: dua.source.replace(/^Hisn al-Muslim · /, ''),
                  })
            }
          >
            {playing ? (
              <Pause size={19} color={palette.green} fill={palette.green} />
            ) : (
              <Play size={19} color={palette.green} />
            )}
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove saved dua' : 'Save dua'}
          hitSlop={8}
          onPress={onToggleSaved}
        >
          <Heart
            size={19}
            color={palette.gold}
            fill={saved ? palette.gold : 'transparent'}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function DuasScreen() {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences, updatePreferences } = useAppPreferences();
  const language = preferences.quranLanguage;
  const [view, setView] = useState<DuaView>({ type: 'home' });
  const [query, setQuery] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const saved = preferences.savedDuas;
  const toggleSaved = (key: string) =>
    updatePreferences({
      savedDuas: saved.includes(key)
        ? saved.filter(item => item !== key)
        : [...saved, key],
    });
  const go = (next: DuaView) => {
    setView(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const today = useMemo(() => dailyDua(language), [language]);
  const quranDuas = useMemo(() => getQuranDuas(language), [language]);
  const results = useMemo(() => searchDuas(query, language), [language, query]);
  const savedDuas = useMemo(
    () => findDuas(saved, language).reverse(),
    [language, saved],
  );

  const card = (dua: Dua, showSource = true) => (
    <DuaCard
      key={dua.key}
      dua={dua}
      saved={saved.includes(dua.key)}
      onToggleSaved={() => toggleSaved(dua.key)}
      showSource={showSource}
      rtlTranslation={dua.key.startsWith('q') && rtlLanguages.has(language)}
    />
  );

  const back = (label: string, target: DuaView) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
      onPress={() => go(target)}
      style={styles.back}
    >
      <ArrowLeft size={18} color={palette.green} />
      <Text style={[styles.backText, { color: palette.green }]}>{label}</Text>
    </Pressable>
  );

  let content: React.ReactNode;
  if (view.type === 'category') {
    const category = duaCategories.find(item => item.key === view.key)!;
    content = (
      <>
        {back('All duas', { type: 'home' })}
        <ScreenTitle
          title={category.title}
          subtitle={`${categoryDuaCount(category)} duas · Hisn al-Muslim`}
        />
        <View style={[styles.list, theme.card]}>
          {category.chapters.map(chapter => (
            <Pressable
              accessibilityRole="button"
              key={chapter.id}
              onPress={() => go({ type: 'chapter', id: chapter.id })}
              style={[styles.row, theme.border]}
            >
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, theme.text]}>
                  {chapter.title}
                </Text>
                <Text style={[styles.rowMeta, theme.mutedText]}>
                  {chapter.duas.length}{' '}
                  {chapter.duas.length === 1 ? 'dua' : 'duas'}
                </Text>
              </View>
              <ChevronRight size={16} color={palette.muted} />
            </Pressable>
          ))}
        </View>
      </>
    );
  } else if (view.type === 'chapter') {
    const chapter = hisnChapters.find(item => item.id === view.id)!;
    const parent = duaCategories.find(item =>
      item.chapters.some(entry => entry.id === chapter.id),
    );
    content = (
      <>
        {parent && parent.chapters.length > 1
          ? back(parent.title, { type: 'category', key: parent.key })
          : back('All duas', { type: 'home' })}
        <Text style={[styles.chapterArabic, theme.text]}>
          {chapter.arabicTitle}
        </Text>
        <ScreenTitle
          title={chapter.title}
          subtitle={`${chapter.duas.length} ${
            chapter.duas.length === 1 ? 'dua' : 'duas'
          } · Hisn al-Muslim`}
        />
        {language !== 'en' ? (
          <Text style={[styles.note, theme.mutedText]}>
            Hisn al-Muslim translations are in English.
          </Text>
        ) : null}
        {chapter.duas.map(dua => card(dua, false))}
      </>
    );
  } else if (view.type === 'quran') {
    content = (
      <>
        {back('All duas', { type: 'home' })}
        <ScreenTitle
          title="Duas from the Quran"
          subtitle={`${quranDuas.length} supplications in your Quran translation`}
        />
        {quranDuas.map(dua => card(dua))}
      </>
    );
  } else if (view.type === 'saved') {
    content = (
      <>
        {back('All duas', { type: 'home' })}
        <ScreenTitle
          title="Saved duas"
          subtitle={`${savedDuas.length} saved`}
        />
        {savedDuas.map(dua => card(dua))}
        {!savedDuas.length ? (
          <Text style={[styles.empty, theme.mutedText]}>
            Tap the heart on any dua to keep it here.
          </Text>
        ) : null}
      </>
    );
  } else {
    content = (
      <>
        <View style={styles.header}>
          <ScreenTitle title="Duas" subtitle="Words for every moment" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show saved duas"
            onPress={() => go({ type: 'saved' })}
            style={[styles.savedButton, theme.card]}
          >
            <Heart
              size={20}
              color={palette.gold}
              fill={saved.length ? palette.gold : 'transparent'}
            />
          </Pressable>
        </View>
        <View style={[styles.search, theme.card]}>
          <Search size={19} color={palette.muted} />
          <TextInput
            accessibilityLabel="Search duas"
            value={query}
            onChangeText={setQuery}
            placeholder="Search duas, e.g. travel, anxiety, rain"
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            style={[styles.input, theme.text]}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery('')}
            >
              <X size={18} color={palette.muted} />
            </Pressable>
          ) : null}
        </View>

        {query.trim().length >= 3 ? (
          <>
            <Text style={[styles.section, theme.mutedText]}>
              {results.length
                ? `${results.length === 40 ? '40+' : results.length} RESULTS`
                : 'NO RESULTS'}
            </Text>
            {results.map(({ dua }) => card(dua))}
          </>
        ) : (
          <>
            <View style={styles.feature}>
              <Text style={styles.label}>DUA OF THE DAY</Text>
              <Text style={styles.featureArabic}>{today.arabic}</Text>
              <Text
                style={[
                  styles.featureTranslation,
                  rtlLanguages.has(language) && styles.rtl,
                ]}
              >
                {today.translation}
              </Text>
              <View style={styles.featureFooter}>
                <Text style={styles.featureSource}>{today.source}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    saved.includes(today.key)
                      ? 'Remove saved dua'
                      : 'Save dua of the day'
                  }
                  hitSlop={8}
                  onPress={() => toggleSaved(today.key)}
                >
                  <Heart
                    size={18}
                    color={colors.gold}
                    fill={
                      saved.includes(today.key) ? colors.gold : 'transparent'
                    }
                  />
                </Pressable>
              </View>
            </View>

            <Text style={[styles.section, theme.mutedText]}>
              HISN AL-MUSLIM
            </Text>
            <View style={styles.grid}>
              {duaCategories.map(category => {
                const Icon = categoryIcons[category.key];
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${category.title} duas`}
                    key={category.key}
                    onPress={() =>
                      category.chapters.length === 1
                        ? go({ type: 'chapter', id: category.chapters[0].id })
                        : go({ type: 'category', key: category.key })
                    }
                    style={[styles.card, theme.card]}
                  >
                    <View
                      style={[styles.icon, { backgroundColor: palette.mint }]}
                    >
                      <Icon size={20} color={palette.green} />
                    </View>
                    <Text style={[styles.title, theme.text]}>
                      {category.title}
                    </Text>
                    <Text style={[styles.count, theme.mutedText]}>
                      {categoryDuaCount(category)} duas
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open duas from the Quran"
              onPress={() => go({ type: 'quran' })}
              style={[styles.quranRow, theme.card]}
            >
              <View style={[styles.icon, { backgroundColor: palette.mint }]}>
                <BookOpen size={20} color={palette.green} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, theme.text]}>
                  Duas from the Quran
                </Text>
                <Text style={[styles.rowMeta, theme.mutedText]}>
                  {quranDuas.length} supplications · Rabbana and more
                </Text>
              </View>
              <ChevronRight size={16} color={palette.muted} />
            </Pressable>
          </>
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={shared.content}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  savedButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 18,
  },
  input: { color: colors.ink, fontSize: 14, flex: 1, height: 50 },
  feature: {
    backgroundColor: colors.green,
    borderRadius: 26,
    padding: 22,
    marginBottom: 24,
  },
  label: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  featureArabic: {
    ...arabicType.ayah,
    color: colors.white,
    marginTop: 14,
  },
  featureTranslation: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  featureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  featureSource: { color: '#BCD3CB', fontSize: 11 },
  section: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  card: { ...shared.card, flexBasis: '47%', flexGrow: 1, padding: 16 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 12 },
  count: { color: colors.muted, fontSize: 11, marginTop: 3 },
  quranRow: {
    ...shared.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  back: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: { color: colors.green, fontWeight: '700' },
  list: { ...shared.card, overflow: 'hidden' },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  rowMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  chapterArabic: {
    ...arabicType.title,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 4,
  },
  note: { color: colors.muted, fontSize: 11, marginBottom: 12 },
  dua: {
    ...shared.card,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 10,
  },
  duaArabic: { ...arabicType.body, color: colors.ink },
  duaArabicQuran: arabicType.ayah,
  transliteration: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 8,
  },
  duaTranslation: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  duaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 12,
  },
  duaMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  repeat: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  source: { color: colors.muted, fontSize: 11, flexShrink: 1 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
});
