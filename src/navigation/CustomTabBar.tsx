import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Home, Clock, BookOpen, Heart, Settings } from 'lucide-react-native';

const ICONS = {
  Home: Home,
  Prayer: Clock,
  Quran: BookOpen,
  Duas: Heart,
  Settings: Settings,
};

function TabButton({ route, isFocused, onPress }: any) {
  const Icon = ICONS[route.name as keyof typeof ICONS];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.15 : 1, { damping: 12 }) }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Animated.View style={animatedStyle}>
        <Icon
          size={24}
          color={isFocused ? '#1a1a1a' : '#a0a0a0'}
          strokeWidth={isFocused ? 2.5 : 2}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function CustomTabBar({ state, navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.pill}>
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
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});