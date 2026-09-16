import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  acceptNotifications,
  declineNotifications,
  withdrawNotifications,
  startNotifications,
} from "@/services/notifications";
import { readNotificationConsent, resetNotificationConsentForTests } from "@/services/notifications/consent";

const mockInitOneSignal = jest.fn();
const mockGrant = jest.fn().mockResolvedValue(true);
const mockDeny = jest.fn();

jest.mock("@/services/notifications/onesignal-client", () => ({
  denyOneSignalConsent: () => mockDeny(),
  grantOneSignalConsentAndRequestPermission: () => mockGrant(),
  initOneSignal: (...args: unknown[]) => mockInitOneSignal(...args),
}));

describe("notifications entry point", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetNotificationConsentForTests();
    mockInitOneSignal.mockClear();
    mockGrant.mockClear();
    mockDeny.mockClear();
  });

  it("starts the SDK with restored local consent", async () => {
    await startNotifications();
    expect(mockInitOneSignal).toHaveBeenCalledWith("undecided");
  });

  it("persists an acceptance before requesting native permission", async () => {
    expect(await acceptNotifications()).toBe(true);
    expect(mockGrant).toHaveBeenCalledTimes(1);
  });

  it("persists a decline without requesting permission", async () => {
    expect(await declineNotifications()).toBe(true);
    expect(mockDeny).toHaveBeenCalledTimes(1);
    expect(mockGrant).not.toHaveBeenCalled();
  });

  it("withdraws notification consent without requesting permission", async () => {
    await acceptNotifications();
    expect(await withdrawNotifications()).toBe(true);
    expect(await readNotificationConsent()).toBe("denied");
  });
});
