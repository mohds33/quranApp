import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MosqueFinderScreen from '../screens/MosqueFinderScreen';
import MosqueDetailScreen from '../screens/MosqueDetailScreen';

const Stack = createNativeStackNavigator();

export default function MosqueStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MosqueFinder" component={MosqueFinderScreen} />
      <Stack.Screen name="MosqueDetail" component={MosqueDetailScreen} />
    </Stack.Navigator>
  );
}
