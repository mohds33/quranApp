import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import {
  ScreenTitle,
  shared,
  useAppTheme,
  useThemeStyles,
} from '../components/DesignSystem';
import { useAppPreferences } from '../components/AppPreferencesContext';
import PrayerHistoryChart from '../components/PrayerHistoryChart';
import {
  getPrayerHistoryDays,
  trackedPrayerNames,
} from '../services/prayerTracking';

export default function PrayerHistoryScreen({ navigation }: any) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const { preferences } = useAppPreferences();
  const days = getPrayerHistoryDays(preferences.prayerLogs, new Date(), 14);
  const totalOnTime = days.reduce((total, day) => total + day.onTime, 0);
  const totalDelayed = days.reduce((total, day) => total + day.delayed, 0);

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
          title="Prayer history"
          subtitle="Your explicitly logged prayers"
        />

        <View style={[styles.summary, theme.card]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: palette.green }]}>
              {totalOnTime}
            </Text>
            <Text style={[styles.statLabel, theme.mutedText]}>On time</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: palette.line }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: palette.gold }]}>
              {totalDelayed}
            </Text>
            <Text style={[styles.statLabel, theme.mutedText]}>Delayed</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: palette.line }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, theme.text]}>
              {totalOnTime + totalDelayed}
            </Text>
            <Text style={[styles.statLabel, theme.mutedText]}>Logged</Text>
          </View>
        </View>

        <View style={[styles.chartCard, theme.card]}>
          <Text style={[styles.sectionTitle, theme.text]}>Last 7 days</Text>
          <PrayerHistoryChart logs={preferences.prayerLogs} />
        </View>

        <Text style={[styles.sectionTitle, theme.text]}>Daily log</Text>
        <View style={[styles.days, theme.card]}>
          {[...days].reverse().map(day => (
            <View key={day.date} style={[styles.dayRow, theme.border]}>
              <View style={styles.dayCopy}>
                <Text style={[styles.dayName, theme.text]}>
                  {day.dateValue.toLocaleDateString(undefined, {
                    weekday: 'short',
                  })}
                </Text>
                <Text style={[styles.dayDate, theme.mutedText]}>
                  {day.dateValue.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.prayerDots}>
                {trackedPrayerNames.map(prayer => {
                  const status = day.logs[prayer];
                  return (
                    <View key={prayer} style={styles.dotColumn}>
                      <View
                        accessibilityLabel={`${prayer}: ${
                          status ?? 'not logged'
                        }`}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              status === 'onTime'
                                ? palette.green
                                : status === 'delayed'
                                ? palette.gold
                                : palette.line,
                          },
                        ]}
                      />
                      <Text style={[styles.dotLabel, theme.mutedText]}>
                        {prayer[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
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
  summary: {
    flexDirection: 'row',
    paddingVertical: 18,
    marginBottom: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 25, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 4 },
  divider: { width: 1 },
  chartCard: { padding: 17, marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  days: { overflow: 'hidden' },
  dayRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  dayCopy: { width: 80 },
  dayName: { fontSize: 13, fontWeight: '800' },
  dayDate: { fontSize: 9, marginTop: 3 },
  prayerDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dotColumn: { width: 28, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotLabel: { fontSize: 8, marginTop: 4 },
});
