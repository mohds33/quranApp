import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Home, Clock3, BookOpen, Heart, Settings } from 'lucide-react-native';
import { colors } from '../components/DesignSystem';

const ICONS = {
  Home: Home,
  Prayer: Clock3,
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
          color={isFocused ? colors.green : '#9AA39F'}
          strokeWidth={isFocused ? 2.5 : 2}
        />
        <Text style={[styles.label, isFocused && styles.labelActive]}>
          {route.name}
        </Text>
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
    bottom: 18,
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 26,
    paddingVertical: 11,
    paddingHorizontal: 18,
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
  label: { color: '#9AA39F', fontSize: 9, fontWeight: '600', marginTop: 3 },
  labelActive: { color: colors.green },
});
