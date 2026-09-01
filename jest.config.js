module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.mjs$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(react-native|@react-native|@openingshq|expo|@expo|@expo-google-fonts|expo-router|@react-navigation|nativewind|react-native-css-interop))",
  ],
};
