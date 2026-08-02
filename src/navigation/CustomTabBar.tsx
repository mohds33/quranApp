import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
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
} from 'lucide-react-native';
import { useAppTheme } from '../components/DesignSystem';

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

export default function CustomTabBar({ state, navigation }: any) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.container}>
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
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#9AA39F', fontSize: 7, fontWeight: '600', marginTop: 3 },
});
