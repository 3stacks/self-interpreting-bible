// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // data/ is written by tools/app-data.mjs.
    ignores: ['dist/*', 'data/*'],
  },
]);
