module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // NOTE: babel-preset-expo (SDK 56) auto-injects the react-native-worklets
    // plugin for Reanimated, so it must not be added manually here.
  };
};
