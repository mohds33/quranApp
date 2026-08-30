import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import PrayerGuideScreen from '../screens/PrayerGuideScreen';
import PrayerHistoryScreen from '../screens/PrayerHistoryScreen';

const Stack = createNativeStackNavigator();

export default function PrayerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} />
      <Stack.Screen name="PrayerGuide" component={PrayerGuideScreen} />
      <Stack.Screen name="PrayerHistory" component={PrayerHistoryScreen} />
    </Stack.Navigator>
  );
}
