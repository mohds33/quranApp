import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme, useThemeStyles } from './DesignSystem';
import { getPrayerHistoryDays, PrayerLog } from '../services/prayerTracking';

export default function PrayerHistoryChart({
  logs,
  days = 7,
}: {
  logs: PrayerLog[];
  days?: number;
}) {
  const { palette } = useAppTheme();
  const theme = useThemeStyles();
  const history = getPrayerHistoryDays(logs, new Date(), days);

  return (
    <View>
      <View style={styles.chart}>
        {history.map(day => (
          <View
            accessibilityLabel={`${day.dateValue.toLocaleDateString(undefined, {
              weekday: 'long',
            })}: ${day.onTime} on time and ${
              day.delayed
            } delayed prayers logged`}
            accessible
            key={day.date}
            style={styles.column}
          >
            <View style={[styles.track, { backgroundColor: palette.line }]}>
              {day.onTime ? (
                <View
                  style={[
                    styles.segment,
                    {
                      backgroundColor: palette.green,
                      height: `${day.onTime * 20}%`,
                    },
                  ]}
                />
              ) : null}
              {day.delayed ? (
                <View
                  style={[
                    styles.segment,
                    {
                      backgroundColor: palette.gold,
                      height: `${day.delayed * 20}%`,
                    },
                  ]}
                />
              ) : null}
            </View>
            <Text style={[styles.day, theme.mutedText]}>
              {day.dateValue.toLocaleDateString(undefined, {
                weekday: 'narrow',
              })}
            </Text>
            <Text style={[styles.date, theme.mutedText]}>
              {day.dateValue.getDate()}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: palette.green }]} />
          <Text style={[styles.legendText, theme.mutedText]}>On time</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: palette.gold }]} />
          <Text style={[styles.legendText, theme.mutedText]}>Delayed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: 146,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  column: { width: 32, alignItems: 'center' },
  track: {
    width: 22,
    height: 104,
    borderRadius: 5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  segment: { width: '100%' },
  day: { fontSize: 10, fontWeight: '700', marginTop: 7 },
  date: { fontSize: 9, marginTop: 2 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10 },
});
