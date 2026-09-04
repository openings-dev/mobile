import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  readAnalyticsConsent,
  resetAnalyticsConsentForTests,
  subscribeAnalyticsConsent,
  writeAnalyticsConsent,
} from "@/services/telemetry/consent";

describe("analytics consent", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetAnalyticsConsentForTests();
  });

  it("defaults to undecided and persists a granted decision", async () => {
    expect(await readAnalyticsConsent()).toBe("undecided");
    expect(await writeAnalyticsConsent("granted")).toBe(true);
    expect(await readAnalyticsConsent()).toBe("granted");
  });

  it("rejects unsupported stored versions", async () => {
    await AsyncStorage.setItem(
      "openings:analytics-consent",
      JSON.stringify({ version: 99, state: "granted", updatedAt: "now" }),
    );
    expect(await readAnalyticsConsent()).toBe("undecided");
  });

  it("notifies subscribers after a decision", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeAnalyticsConsent(listener);
    await writeAnalyticsConsent("denied");
    expect(listener).toHaveBeenCalledWith("denied");
    unsubscribe();
  });
});
