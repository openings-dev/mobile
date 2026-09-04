import {
  grantOneSignalConsentAndRequestPermission,
  initOneSignal,
  resetOneSignalClientForTests,
} from "@/services/notifications/onesignal-client";

const mockSetConsentRequired = jest.fn();
const mockInitialize = jest.fn();
const mockSetConsentGiven = jest.fn();
const mockRequestPermission = jest.fn().mockResolvedValue(true);

jest.mock("react-native-onesignal", () => ({
  OneSignal: {
    Notifications: {
      requestPermission: (...args: unknown[]) => mockRequestPermission(...args),
    },
    initialize: (...args: unknown[]) => mockInitialize(...args),
    setConsentGiven: (...args: unknown[]) => mockSetConsentGiven(...args),
    setConsentRequired: (...args: unknown[]) => mockSetConsentRequired(...args),
  },
}), { virtual: true });

describe("OneSignal client", () => {
  const originalAppId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

  beforeEach(() => {
    resetOneSignalClientForTests();
    mockSetConsentRequired.mockClear();
    mockInitialize.mockClear();
    mockSetConsentGiven.mockClear();
    mockRequestPermission.mockClear();
    delete process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = originalAppId;
  });

  it("does nothing without an App ID", () => {
    expect(initOneSignal("undecided")).toBe(false);
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it("requires privacy consent before initialization", () => {
    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
    expect(initOneSignal("undecided")).toBe(true);
    const consentOrder = mockSetConsentRequired.mock.invocationCallOrder[0];
    const initializeOrder = mockInitialize.mock.invocationCallOrder[0];
    expect(consentOrder).toBeDefined();
    expect(initializeOrder).toBeDefined();
    expect(consentOrder as number).toBeLessThan(initializeOrder as number);
    expect(mockSetConsentGiven).not.toHaveBeenCalledWith(true);
  });

  it("restores granted consent without requesting permission at startup", () => {
    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
    initOneSignal("granted");
    expect(mockSetConsentGiven).toHaveBeenCalledWith(true);
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it("requests native permission only after an explicit grant", async () => {
    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
    initOneSignal("undecided");
    await grantOneSignalConsentAndRequestPermission();
    expect(mockSetConsentGiven).toHaveBeenCalledWith(true);
    expect(mockRequestPermission).toHaveBeenCalledWith(false);
  });
});
