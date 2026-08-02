import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from './CustomTabBar';

import HomeScreen from '../screens/HomeScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import QuranStack from './QuranStack';
import HadithStack from './HadithStack';
import MosqueStack from './MosqueStack';
import DuasScreen from '../screens/DuasScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const renderTabBar = (props: any) => <CustomTabBar {...props} />;

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Prayer" component={PrayerTimesScreen} />
      <Tab.Screen name="Quran" component={QuranStack} />
      <Tab.Screen name="Hadith" component={HadithStack} />
      <Tab.Screen name="Mosques" component={MosqueStack} />
      <Tab.Screen name="Duas" component={DuasScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
