import {
  captureSentryException,
  initSentry,
  resetSentryClientForTests,
} from "@/services/telemetry/sentry-client";

const mockInit = jest.fn();
const mockCaptureException = jest.fn();

// The mock fns are referenced lazily (via wrapper closures) rather than
// passed by value: jest hoists this `jest.mock()` call above every
// statement in the file, including the `const mockInit = ...` initializers
// above, so the module factory runs before those consts are assigned.
// Capturing them directly would freeze `undefined` into the mocked
// module's exports.
jest.mock("@sentry/react-native", () => ({
  init: (...args: unknown[]) => mockInit(...args),
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

function restoreEnv(originalEnv: NodeJS.ProcessEnv): void {
  // Expo's babel preset rewrites `process.env.EXPO_PUBLIC_*` reads to go
  // through a module that captured the original `process.env` object by
  // reference, so reassigning `process.env` wholesale would not be observed.
  // Mutate the existing object in place instead.
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

describe("sentry-client", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetSentryClientForTests();
    mockInit.mockClear();
    mockCaptureException.mockClear();
    restoreEnv(originalEnv);
  });

  afterAll(() => {
    restoreEnv(originalEnv);
  });

  it("does not initialize without a DSN", () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;

    initSentry();

    expect(mockInit).not.toHaveBeenCalled();
  });

  it("initializes once with sanitized send hooks when a DSN is present", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://example@o0.ingest.sentry.io/1";
    process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT = "staging";

    initSentry();
    initSentry();

    expect(mockInit).toHaveBeenCalledTimes(1);
    const config = mockInit.mock.calls[0][0];
    expect(config.dsn).toBe("https://example@o0.ingest.sentry.io/1");
    expect(config.environment).toBe("staging");
    expect(config.sendDefaultPii).toBe(false);
    expect(config.tracesSampleRate).toBe(0);
    expect(typeof config.beforeSend).toBe("function");
    expect(typeof config.beforeBreadcrumb).toBe("function");
  });

  it("does not capture exceptions before initialization", () => {
    captureSentryException(new Error("boom"), { category: "test" });

    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it("captures exceptions with the given category tag after initialization", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://example@o0.ingest.sentry.io/1";
    initSentry();

    const error = new Error("boom");
    captureSentryException(error, { category: "render-boundary" });

    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      tags: { category: "render-boundary" },
    });
  });
});
