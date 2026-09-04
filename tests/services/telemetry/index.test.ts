import {
  captureTechnicalException,
  startTelemetry,
  trackProductEvent,
} from "@/services/telemetry";

const mockInitSentry = jest.fn();
const mockCaptureSentryException = jest.fn();
const mockInitCrashlytics = jest.fn();
const mockSendProductEvent = jest.fn();
let mockConsent = "undecided";

// The mock fns are referenced lazily (via wrapper closures) rather than
// passed by value: jest hoists these `jest.mock()` calls above every
// statement in the file, including the `const mock... = ...` initializers
// above, so the module factory runs before those consts are assigned.
// Capturing them directly would freeze `undefined` into the mocked
// module's exports.
jest.mock("@/services/telemetry/sentry-client", () => ({
  initSentry: (...args: unknown[]) => mockInitSentry(...args),
  captureSentryException: (...args: unknown[]) =>
    mockCaptureSentryException(...args),
}));
jest.mock("@/services/telemetry/crashlytics-client", () => ({
  initCrashlytics: (...args: unknown[]) => mockInitCrashlytics(...args),
}));
jest.mock("@/services/telemetry/consent", () => ({
  getCachedAnalyticsConsent: () => mockConsent,
}));

describe("telemetry entry point", () => {
  beforeEach(() => {
    mockInitSentry.mockClear();
    mockCaptureSentryException.mockClear();
    mockInitCrashlytics.mockClear();
    mockSendProductEvent.mockClear();
    mockConsent = "undecided";
  });

  it("starts both vendors exactly once even if called repeatedly", () => {
    startTelemetry();
    startTelemetry();

    expect(mockInitSentry).toHaveBeenCalledTimes(1);
    expect(mockInitCrashlytics).toHaveBeenCalledTimes(1);
  });

  it("forwards captured exceptions to Sentry only", () => {
    const error = new Error("boom");

    captureTechnicalException(error, { category: "render-boundary" });

    expect(mockCaptureSentryException).toHaveBeenCalledWith(error, {
      category: "render-boundary",
    });
  });

  it("sends only sanitized product events after consent", () => {
    const { setProductEventHandler } = jest.requireActual("@/services/telemetry/product-events") as typeof import("@/services/telemetry/product-events");
    setProductEventHandler(mockSendProductEvent);
    trackProductEvent("Filter Applied", {
      dimension: "technology",
      locale: "en",
      value: "React Native",
    });
    expect(mockSendProductEvent).not.toHaveBeenCalled();

    mockConsent = "granted";
    trackProductEvent("Filter Applied", {
      dimension: "technology",
      locale: "en",
      value: "React Native",
    });
    expect(mockSendProductEvent).toHaveBeenCalledWith("Filter Applied", {
      dimension: "technology",
      locale: "en",
      value: "react-native",
    });
  });
});
