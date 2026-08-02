/* eslint-env jest */

jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView } = require('react-native');
  return {
    __esModule: true,
    default: { View, Text, ScrollView },
    useAnimatedStyle: callback => callback(),
    withSpring: value => value,
  };
});

jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  getCurrentPosition: jest.fn((success, error) =>
    error?.({ message: 'Location unavailable in tests' }),
  ),
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    { __esModule: true },
    {
      get: (target, property) =>
        property === '__esModule' ? target.__esModule : View,
    },
  );
});

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMap = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }, props.children),
  );
  return {
    __esModule: true,
    default: MockMap,
    Marker: View,
  };
});
