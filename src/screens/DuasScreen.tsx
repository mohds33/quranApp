import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloudSun, Heart, Home, Moon, Shield } from 'lucide-react-native';
import { colors, ScreenTitle, shared } from '../components/DesignSystem';

const items = [
  [CloudSun, 'Morning', '12 duas'],
  [Moon, 'Evening', '14 duas'],
  [Shield, 'Protection', '9 duas'],
  [Home, 'Home & family', '11 duas'],
] as const;
export default function DuasScreen() {
  return (
    <SafeAreaView style={shared.screen} edges={['top']}>
      <ScrollView contentContainerStyle={shared.content}>
        <ScreenTitle title="Duas" subtitle="Words for every moment" />
        <View style={styles.feature}>
          <Text style={styles.label}>DUA OF THE DAY</Text>
          <Text style={styles.arabic}>رَبِّ زِدْنِي عِلْمًا</Text>
          <Text style={styles.translation}>
            My Lord, increase me in knowledge.
          </Text>
          <Text style={styles.source}>Taha · 20:114</Text>
        </View>
        <Text style={styles.section}>COLLECTIONS</Text>
        <View style={styles.grid}>
          {items.map(([Icon, title, count]) => (
            <View key={title} style={styles.card}>
              <View style={styles.icon}>
                <Icon size={22} color={colors.green} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.count}>{count}</Text>
            </View>
          ))}
        </View>
        <View style={styles.saved}>
          <Heart size={20} color={colors.gold} />
          <View>
            <Text style={styles.savedTitle}>Saved duas</Text>
            <Text style={styles.savedMeta}>3 favourites</Text>
          </View>
        </View>
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
  savedTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  savedMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
});
