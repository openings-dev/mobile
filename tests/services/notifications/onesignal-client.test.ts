import {
  addNotificationClickListener,
  denyOneSignalConsent,
  grantOneSignalConsentAndRequestPermission,
  initOneSignal,
  resetOneSignalClientForTests,
} from "@/services/notifications/onesignal-client";

const mockSetConsentRequired = jest.fn();
const mockInitialize = jest.fn();
const mockSetConsentGiven = jest.fn();
const mockRequestPermission = jest.fn().mockResolvedValue(true);
const mockOptIn = jest.fn();
const mockOptOut = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

jest.mock("react-native-onesignal", () => ({
  OneSignal: {
    User: { pushSubscription: { optIn: () => mockOptIn(), optOut: () => mockOptOut() } },
    Notifications: {
      addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
      removeEventListener: (...args: unknown[]) => mockRemoveEventListener(...args),
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
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    mockOptIn.mockClear();
    mockOptOut.mockClear();
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
    expect(mockOptIn).toHaveBeenCalledTimes(1);
  });

  it("opts an existing subscription out when consent is absent", () => {
    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
    initOneSignal("undecided");
    expect(mockSetConsentGiven).toHaveBeenCalledWith(false);
    expect(mockOptOut).toHaveBeenCalledTimes(1);
  });

  it("opts out when consent is withdrawn", () => {
    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
    initOneSignal("granted");
    denyOneSignalConsent();
    expect(mockSetConsentGiven).toHaveBeenCalledWith(false);
    expect(mockOptOut).toHaveBeenCalledTimes(1);
  });

  it("defers click listener registration until initialization", () => {
    const onJob = jest.fn();
    const unsubscribe = addNotificationClickListener(onJob);
    expect(mockAddEventListener).not.toHaveBeenCalled();

    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
    expect(initOneSignal("undecided")).toBe(true);
    expect(mockAddEventListener).toHaveBeenCalledTimes(1);

    const listener = mockAddEventListener.mock.calls[0]?.[1] as (
      event: unknown,
    ) => void;
    listener({
      notification: {
        additionalData: {
          type: "openings.job",
          version: 1,
          jobId: "gh_1234567890abcdef12345678",
        },
      },
    });
    expect(onJob).toHaveBeenCalledWith("gh_1234567890abcdef12345678");

    unsubscribe();
    expect(mockRemoveEventListener).toHaveBeenCalledWith("click", listener);
  });

  it("cancels a pending click listener without touching the native SDK", () => {
    const unsubscribe = addNotificationClickListener(jest.fn());
    unsubscribe();

    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
    expect(initOneSignal("undecided")).toBe(true);
    expect(mockAddEventListener).not.toHaveBeenCalled();
    expect(mockRemoveEventListener).not.toHaveBeenCalled();
  });

  it("accepts only the versioned new-job payload and removes the exact listener", () => {
    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
    initOneSignal("undecided");
    const onJob = jest.fn();
    const unsubscribe = addNotificationClickListener(onJob);
    const listener = mockAddEventListener.mock.calls[0]?.[1] as (event: unknown) => void;

    listener({ notification: { additionalData: { type: "openings.job", version: 1, jobId: "gh_1234567890abcdef12345678" } } });
    listener({ notification: { additionalData: { type: "openings.job", version: 1, jobId: "../settings" } } });
    listener({ notification: { additionalData: { url: "https://example.com", jobId: "gh_456" } } });

    expect(onJob).toHaveBeenCalledTimes(1);
    expect(onJob).toHaveBeenCalledWith("gh_1234567890abcdef12345678");
    unsubscribe();
    expect(mockRemoveEventListener).toHaveBeenCalledWith("click", listener);
  });
});
