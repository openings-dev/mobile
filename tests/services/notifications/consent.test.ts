import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  readNotificationConsent,
  resetNotificationConsentForTests,
  subscribeNotificationConsent,
  writeNotificationConsent,
} from "@/services/notifications/consent";

describe("notification consent", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetNotificationConsentForTests();
  });

  it("defaults to undecided and persists both decisions", async () => {
    expect(await readNotificationConsent()).toBe("undecided");
    expect(await writeNotificationConsent("granted")).toBe(true);
    expect(await readNotificationConsent()).toBe("granted");
    expect(await writeNotificationConsent("denied")).toBe(true);
    expect(await readNotificationConsent()).toBe("denied");
  });

  it("treats malformed and unsupported documents as undecided", async () => {
    await AsyncStorage.setItem("openings:notification-consent", "not-json");
    expect(await readNotificationConsent()).toBe("undecided");
    resetNotificationConsentForTests();
    await AsyncStorage.setItem(
      "openings:notification-consent",
      JSON.stringify({ version: 1, state: "granted" }),
    );
    expect(await readNotificationConsent()).toBe("undecided");
  });

  it("accepts the new-job consent document version", async () => {
    await AsyncStorage.setItem(
      "openings:notification-consent",
      JSON.stringify({ version: 2, state: "granted", updatedAt: "2026-09-16T12:00:00.000Z" }),
    );
    expect(await readNotificationConsent()).toBe("granted");
  });

  it("notifies subscribers after a decision", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeNotificationConsent(listener);
    await writeNotificationConsent("granted");
    expect(listener).toHaveBeenCalledWith("granted");
    unsubscribe();
  });
});
