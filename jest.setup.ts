import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US" }],
}));

jest.mock(
  "@react-native-async-storage/async-storage",
  () => mockAsyncStorage,
);

jest.mock("react-native-onesignal", () => ({
  OneSignal: {
    Notifications: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      requestPermission: jest.fn().mockResolvedValue(false),
    },
    User: {
      pushSubscription: {
        optIn: jest.fn(),
        optOut: jest.fn(),
      },
    },
    initialize: jest.fn(),
    setConsentGiven: jest.fn(),
    setConsentRequired: jest.fn(),
  },
}));
