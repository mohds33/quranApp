import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SurahListScreen from '../screens/SurahListScreen';
import SurahDetailScreen from '../screens/SurahDetailScreen';

const Stack = createNativeStackNavigator();

export default function QuranStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SurahList" component={SurahListScreen} options={{ title: 'Quran' }} />
      <Stack.Screen name="SurahDetail" component={SurahDetailScreen} options={{ title: 'Surah' }} />
    </Stack.Navigator>
  );
}