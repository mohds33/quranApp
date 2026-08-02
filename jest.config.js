module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|lucide-react-native|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-worklets)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
