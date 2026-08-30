import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpenText,
  ChevronDown,
  CircleDot,
  Hand,
  PersonStanding,
} from 'lucide-react-native';
import {
  colors,
  ScreenTitle,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { useAppPreferences } from '../components/AppPreferencesContext';
import {
  prayerGuideSteps,
  PrayerGuidePosture,
  rakahPatterns,
} from '../data/prayerGuide';

function StepIcon({
  posture,
  color,
}: {
  posture: PrayerGuidePosture;
  color: string;
}) {
  const props = { color, size: 20 };
  switch (posture) {
    case 'recite':
      return <BookOpenText {...props} />;
    case 'bow':
      return <ArrowDown {...props} />;
    case 'rise':
      return <ArrowUp {...props} />;
    case 'prostrate':
      return <CircleDot {...props} />;
    case 'sit':
      return <Hand {...props} />;
    case 'finish':
      return <ArrowLeft {...props} />;
    default:
      return <PersonStanding {...props} />;
  }
}

export default function PrayerGuideScreen({ navigation }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences } = useAppPreferences();
  const [selectedRakah, setSelectedRakah] = useState(2);
  const [expanded, setExpanded] = useState('fatiha');
  const meaningLanguage = preferences.quranLanguage === 'fa' ? 'fa' : 'en';

  return (
    <SafeAreaView style={[shared.screen, theme.screen]} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityLabel="Back to prayer times"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={[styles.back, theme.card]}
        >
          <ArrowLeft size={20} color={palette.ink} />
        </Pressable>
        <ScreenTitle
          title="How to pray"
          subtitle="Movements, recitations, and their meaning"
        />

        <View style={styles.patternSection}>
          <Text style={[styles.sectionTitle, theme.text]}>Prayer pattern</Text>
          <View style={[styles.segmented, { backgroundColor: palette.line }]}>
            {rakahPatterns.map(pattern => {
              const active = selectedRakah === pattern.count;
              return (
                <Pressable
                  accessibilityLabel={`${pattern.count} rak'ah, ${pattern.prayers}`}
                  accessibilityRole="button"
                  key={pattern.count}
                  onPress={() => setSelectedRakah(pattern.count)}
                  style={[
                    styles.segmentButton,
                    active && { backgroundColor: palette.green },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentNumber,
                      { color: active ? colors.white : palette.ink },
                    ]}
                  >
                    {pattern.count}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.segmentLabel,
                      { color: active ? colors.white : palette.muted },
                    ]}
                  >
                    {pattern.prayers}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.rakahFlow}>
            {Array.from({ length: selectedRakah }, (_, index) => {
              const number = index + 1;
              const sitting = number === 2 || number === selectedRakah;
              return (
                <View key={number} style={styles.rakahItem}>
                  <View
                    style={[
                      styles.rakahNumber,
                      { backgroundColor: palette.mint },
                    ]}
                  >
                    <Text
                      style={[styles.rakahNumberText, { color: palette.green }]}
                    >
                      {number}
                    </Text>
                  </View>
                  <Text style={[styles.rakahMeta, theme.mutedText]}>
                    {sitting ? 'Sit' : 'Rise'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.note, { backgroundColor: palette.mint }]}>
          <Text style={[styles.noteText, { color: palette.green }]}>
            This guide uses a widely taught Sunni form. Recitation wording and
            some movements vary between schools; follow the practice you have
            learned from a trusted teacher.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, theme.text]}>Step by step</Text>
        <View style={styles.steps}>
          {prayerGuideSteps.map((step, index) => {
            const isExpanded = expanded === step.id;
            return (
              <View key={step.id} style={[styles.step, theme.card]}>
                <Pressable
                  accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${
                    step.title
                  }`}
                  accessibilityRole="button"
                  onPress={() => setExpanded(isExpanded ? '' : step.id)}
                  style={styles.stepHeader}
                >
                  <View
                    style={[
                      styles.stepNumber,
                      { backgroundColor: palette.mint },
                    ]}
                  >
                    <StepIcon posture={step.posture} color={palette.green} />
                  </View>
                  <View style={styles.stepCopy}>
                    <Text style={[styles.stepIndex, { color: palette.gold }]}>
                      STEP {index + 1}
                    </Text>
                    <Text style={[styles.stepTitle, theme.text]}>
                      {step.title}
                    </Text>
                    <Text style={[styles.stepArabicTitle, theme.mutedText]}>
                      {step.arabicTitle}
                    </Text>
                  </View>
                  <ChevronDown
                    color={palette.muted}
                    size={18}
                    style={isExpanded && styles.chevronExpanded}
                  />
                </Pressable>
                {isExpanded ? (
                  <View style={[styles.detail, theme.border]}>
                    <Text style={[styles.arabic, theme.text]}>
                      {step.arabic}
                    </Text>
                    <Text
                      style={[styles.transliteration, { color: palette.green }]}
                    >
                      {step.transliteration}
                    </Text>
                    <View
                      style={[
                        styles.meaning,
                        { backgroundColor: palette.mint },
                      ]}
                    >
                      <Text
                        style={[styles.meaningLabel, { color: palette.green }]}
                      >
                        MEANING
                      </Text>
                      <Text
                        style={[
                          styles.meaningText,
                          theme.text,
                          meaningLanguage === 'fa' && styles.rtl,
                        ]}
                      >
                        {step.meaning[meaningLanguage]}
                      </Text>
                    </View>
                    <Text style={[styles.stepNote, theme.mutedText]}>
                      {step.note}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  patternSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  segmented: { flexDirection: 'row', padding: 3, borderRadius: 8 },
  segmentButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segmentNumber: { fontSize: 17, fontWeight: '800' },
  segmentLabel: { fontSize: 9, marginTop: 3 },
  rakahFlow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
    marginTop: 16,
  },
  rakahItem: { alignItems: 'center' },
  rakahNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rakahNumberText: { fontSize: 13, fontWeight: '800' },
  rakahMeta: { fontSize: 9, marginTop: 5 },
  note: { padding: 15, borderRadius: 8, marginBottom: 24 },
  noteText: { fontSize: 11, lineHeight: 17 },
  steps: { gap: 10 },
  step: { overflow: 'hidden' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  stepNumber: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCopy: { flex: 1, marginLeft: 12 },
  stepIndex: { fontSize: 8, fontWeight: '900' },
  stepTitle: { fontSize: 14, fontWeight: '800', marginTop: 3 },
  stepArabicTitle: { fontSize: 12, marginTop: 3, textAlign: 'left' },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  detail: { borderTopWidth: 1, padding: 17 },
  arabic: {
    fontSize: 23,
    lineHeight: 42,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transliteration: { fontSize: 12, lineHeight: 20, marginTop: 14 },
  meaning: { borderRadius: 8, padding: 14, marginTop: 14 },
  meaningLabel: { fontSize: 8, fontWeight: '900', marginBottom: 7 },
  meaningText: { fontSize: 12, lineHeight: 20 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  stepNote: { fontSize: 10, lineHeight: 16, marginTop: 13 },
});
