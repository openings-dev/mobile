jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US" }],
}));
