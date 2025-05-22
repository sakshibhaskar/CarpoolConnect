const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Reduce memory usage by limiting workers and disabling minification
config.maxWorkers = 1;

// Disable minification entirely to prevent memory issues
config.transformer.minifierConfig = {
  compress: false,
  mangle: false
};

module.exports = config;