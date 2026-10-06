module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*|@react-native-community)/)',
  ],
  setupFiles: [
    'react-native-gesture-handler/jestSetup',
    './jest.setup.js',
  ],
};
