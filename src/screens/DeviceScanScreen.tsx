import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DeviceScanScreen() {
  return (
    <View style={styles.container}>
      <Text>Device Scan Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
