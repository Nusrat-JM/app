module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      // If you still have reanimated, keep the plugin last. If you removed it entirely, you can omit plugins.
      plugins: ['react-native-reanimated/plugin'],
    };
  };
  