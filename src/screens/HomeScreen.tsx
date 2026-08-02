import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  BookOpen,
  ChevronRight,
  Compass,
  MapPin,
  Play,
} from 'lucide-react-native';
import { colors, Eyebrow, shared } from '../components/DesignSystem';

export default function HomeScreen() {
  return (
    <SafeAreaView style={shared.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={shared.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <View>
            <Text style={styles.greeting}>Assalamu alaikum</Text>
            <View style={styles.location}>
              <MapPin size={13} color={colors.muted} />
              <Text style={styles.locationText}>Calgary, Alberta</Text>
            </View>
          </View>
          <Pressable style={styles.iconButton}>
            <Bell size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.orbitOne} />
          <View style={styles.orbitTwo} />
          <Eyebrow>Next prayer</Eyebrow>
          <Text style={styles.prayerName}>Maghrib</Text>
          <Text style={styles.prayerTime}>
            9:18 <Text style={styles.period}>PM</Text>
          </Text>
          <View style={styles.heroFooter}>
            <Text style={styles.countdown}>in 1 hr 24 min</Text>
            <View style={styles.qibla}>
              <Compass size={15} color={colors.white} />
              <Text style={styles.qiblaText}>Qibla 42°</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Today’s prayers</Text>
          <Text style={styles.date}>18 Muharram</Text>
        </View>
        <View style={styles.times}>
          {[
            ['Fajr', '4:06 AM'],
            ['Sunrise', '5:48 AM'],
            ['Dhuhr', '1:38 PM'],
            ['Asr', '5:50 PM'],
            ['Maghrib', '9:18 PM'],
            ['Isha', '10:51 PM'],
          ].map(([name, time]) => (
            <View key={name} style={styles.timeItem}>
              <Text style={styles.timeName}>{name}</Text>
              <Text style={styles.timeValue}>{time}</Text>
            </View>
          ))}
        </View>

        <View style={styles.continueCard}>
          <View style={styles.bookIcon}>
            <BookOpen size={22} color={colors.green} />
          </View>
          <View style={styles.continueCopy}>
            <Text style={styles.overline}>CONTINUE READING</Text>
            <Text style={styles.surah}>Al-Baqarah</Text>
            <Text style={styles.ayah}>Verse 255 · Ayatul Kursi</Text>
          </View>
          <Pressable style={styles.play}>
            <Play size={18} fill={colors.white} color={colors.white} />
          </Pressable>
        </View>

        <Pressable style={styles.verseCard}>
          <Text style={styles.verseLabel}>DAILY REFLECTION</Text>
          <Text style={styles.arabic}>فَإِنَّ مَعَ الْعُسْرِ يُسْرًا</Text>
          <Text style={styles.translation}>
            “Indeed, with hardship comes ease.”
          </Text>
          <View style={styles.verseFoot}>
            <Text style={styles.reference}>Ash-Sharh · 94:5</Text>
            <ChevronRight size={17} color={colors.gold} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  locationText: { color: colors.muted, fontSize: 13 },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
