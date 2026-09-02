const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(projectRoot, "../core"),
  path.resolve(projectRoot, "../design-tokens"),
];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});
