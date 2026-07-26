import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DeviceScanScreen from '../screens/DeviceScanScreen';
import DevicePairingScreen from '../screens/DevicePairingScreen';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  // Later: replace this with a real check — e.g. saved device ID in storage
  const [isPaired, setIsPaired] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isPaired ? (
          <>
            <Stack.Screen name="DeviceScan" component={DeviceScanScreen} />
            <Stack.Screen name="DevicePairing" component={DevicePairingScreen} />
          </>
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
