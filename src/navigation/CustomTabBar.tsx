import React from 'react';
import {
  ActivityIndicator,
  View,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Home,
  Clock3,
  BookOpen,
  Heart,
  LibraryBig,
  MapPinned,
  Settings,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react-native';
import { colors, useAppTheme } from '../components/DesignSystem';
import { useQuranAudio } from '../components/QuranAudioContext';
import { surahs } from '../data/quran';
import { RECITER_NAME } from '../services/quranAudio';

const ICONS = {
  Home: Home,
  Prayer: Clock3,
  Quran: BookOpen,
  Hadith: LibraryBig,
  Mosques: MapPinned,
  Duas: Heart,
  Settings: Settings,
};

function TabButton({ route, isFocused, onPress }: any) {
  const { palette } = useAppTheme();
  const Icon = ICONS[route.name as keyof typeof ICONS];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.15 : 1, { damping: 12 }) }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Animated.View style={animatedStyle}>
        <Icon
          size={20}
          color={isFocused ? palette.green : palette.muted}
          strokeWidth={isFocused ? 2.5 : 2}
        />
        <Text
          style={[
            styles.label,
            { color: isFocused ? palette.green : palette.muted },
          ]}
        >
          {route.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function MiniPlayer({ navigation }: any) {
  const { palette } = useAppTheme();
  const {
    current,
    clip,
    paused,
    buffering,
    togglePause,
    stop,
    next,
    previous,
  } = useQuranAudio();
  if (!current && !clip) return null;
  const surah = current
    ? surahs.find(item => item.number === current.surah)
    : undefined;
  const controlColor = palette.green;
  return (
    <View
      style={[
        styles.player,
        { backgroundColor: palette.white, borderColor: palette.line },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          current ? `Open ${surah?.name} verse ${current.ayah}` : clip?.title
        }
        onPress={() =>
          current
            ? navigation.navigate('Quran', {
                screen: 'SurahDetail',
                params: {
                  surahNumber: current.surah,
                  ayahNumber: current.ayah,
                },
              })
            : navigation.navigate('Duas')
        }
        style={styles.playerCopy}
      >
        <Text
          numberOfLines={1}
          style={[styles.playerTitle, { color: palette.ink }]}
        >
          {current ? `${surah?.name} · Verse ${current.ayah}` : clip?.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.playerMeta, { color: palette.muted }]}
        >
          {current ? RECITER_NAME : 'Dua recitation'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous verse"
        disabled={!current}
        hitSlop={8}
        onPress={previous}
        style={styles.playerButton}
      >
        <SkipBack size={18} color={current ? controlColor : palette.line} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Play recitation' : 'Pause recitation'}
        onPress={togglePause}
        style={[styles.playerMain, { backgroundColor: palette.green }]}
      >
        {buffering && !paused ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : paused ? (
          <Play size={17} color={colors.white} fill={colors.white} />
        ) : (
          <Pause size={17} color={colors.white} fill={colors.white} />
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next verse"
        disabled={!current}
        hitSlop={8}
        onPress={next}
        style={styles.playerButton}
      >
        <SkipForward size={18} color={current ? controlColor : palette.line} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stop recitation"
        hitSlop={8}
        onPress={stop}
        style={styles.playerButton}
      >
        <X size={18} color={palette.muted} />
      </Pressable>
    </View>
  );
}

export default function CustomTabBar({ state, navigation }: any) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.container}>
      <MiniPlayer navigation={navigation} />
      <View
        style={[
          styles.pill,
          { backgroundColor: palette.white, borderColor: palette.line },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 26,
    paddingVertical: 11,
    paddingHorizontal: 9,
    justifyContent: 'space-between',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    marginBottom: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  playerCopy: { flex: 1, marginRight: 4 },
  playerTitle: { fontSize: 13, fontWeight: '700' },
  playerMeta: { fontSize: 10, marginTop: 2 },
  playerButton: { padding: 8 },
  playerMain: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#9AA39F', fontSize: 7, fontWeight: '600', marginTop: 3 },
});
