import type { Crashlytics } from "@react-native-firebase/crashlytics";

import { initCrashlytics } from "@/services/telemetry/crashlytics-client";

const mockGetCrashlytics = jest.fn((..._args: unknown[]) => ({}) as Crashlytics);
const mockSetCrashlyticsCollectionEnabled = jest.fn().mockResolvedValue(undefined);

// The mock fns are referenced lazily (via wrapper closures) rather than
// passed by value: jest hoists this `jest.mock()` call above every
// statement in the file, including the `const mock... = ...` initializers
// above, so the module factory runs before those consts are assigned.
// Capturing them directly would freeze `undefined` into the mocked
// module's exports.
jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: (...args: unknown[]) => mockGetCrashlytics(...args),
  setCrashlyticsCollectionEnabled: (...args: unknown[]) =>
    mockSetCrashlyticsCollectionEnabled(...args),
}));

describe("initCrashlytics", () => {
  beforeEach(() => {
    mockGetCrashlytics.mockClear();
    mockSetCrashlyticsCollectionEnabled.mockClear();
  });

  it("enables crash collection when the native Firebase app is configured", () => {
    initCrashlytics();

    expect(mockSetCrashlyticsCollectionEnabled).toHaveBeenCalledWith(
      expect.anything(),
      true,
    );
  });

  it("does not throw when the native Firebase app is not configured", () => {
    mockGetCrashlytics.mockImplementationOnce(() => {
      throw new Error("No Firebase App '[DEFAULT]' has been created");
    });

    expect(() => initCrashlytics()).not.toThrow();
  });

  it("does not produce an unhandled rejection when collection enabling fails asynchronously", async () => {
    mockSetCrashlyticsCollectionEnabled.mockRejectedValueOnce(
      new Error("Crashlytics collection could not be enabled"),
    );

    expect(() => initCrashlytics()).not.toThrow();

    // Flush the microtask queue so the rejected promise's `.catch()` handler
    // (attached synchronously inside initCrashlytics) has a chance to run
    // before the test ends. If that handler were missing, this test would
    // fail/warn about an unhandled promise rejection.
    await new Promise((resolve) => setImmediate(resolve));
  });
});
