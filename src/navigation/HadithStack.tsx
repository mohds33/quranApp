import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HadithLibraryScreen from '../screens/HadithLibraryScreen';
import HadithBookScreen from '../screens/HadithBookScreen';

const Stack = createNativeStackNavigator();

export default function HadithStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HadithLibrary" component={HadithLibraryScreen} />
      <Stack.Screen name="HadithBook" component={HadithBookScreen} />
    </Stack.Navigator>
  );
}
