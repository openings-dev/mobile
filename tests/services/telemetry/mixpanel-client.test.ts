import {
  disableAnalytics,
  enableAnalytics,
  resetMixpanelClientForTests,
  sendProductEvent,
} from "@/services/telemetry/mixpanel-client";

const mockInit = jest.fn().mockResolvedValue(undefined);
const mockOptIn = jest.fn();
const mockOptOut = jest.fn();
const mockReset = jest.fn();
const mockTrack = jest.fn();
const mockSetIp = jest.fn();

jest.mock("mixpanel-react-native", () => ({
  Mixpanel: jest.fn().mockImplementation(() => ({
    init: mockInit,
    optInTracking: mockOptIn,
    optOutTracking: mockOptOut,
    reset: mockReset,
    setUseIpAddressForGeolocation: mockSetIp,
    track: mockTrack,
  })),
}));

describe("Mixpanel client", () => {
  const originalToken = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
  beforeEach(() => {
    resetMixpanelClientForTests();
    [mockInit, mockOptIn, mockOptOut, mockReset, mockTrack, mockSetIp]
      .forEach((mock) => mock.mockClear());
    delete process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
  });
  afterAll(() => { process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = originalToken; });

  it("does not initialize without a token", async () => {
    expect(await enableAnalytics()).toBe(false);
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("initializes once with automatic tracking and IP geolocation disabled", async () => {
    process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "token";
    expect(await enableAnalytics()).toBe(true);
    expect(await enableAnalytics()).toBe(true);
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockSetIp).toHaveBeenCalledWith(false);
    expect(mockOptIn).toHaveBeenCalledTimes(1);
  });

  it("does not resume tracking when initialization finishes after withdrawal", async () => {
    process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "token";
    let finish!: () => void;
    mockInit.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const enabling = enableAnalytics();
    disableAnalytics();
    finish();
    expect(await enabling).toBe(false);
    expect(mockOptIn).not.toHaveBeenCalled();
    expect(mockOptOut).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledTimes(1);
    sendProductEvent("Job Viewed", { jobId: "test" });
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("waits for cancelled initialization before allowing a new choice", async () => {
    process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "token";
    let finish!: () => void;
    mockInit.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const first = enableAnalytics();
    disableAnalytics();
    const second = enableAnalytics();
    expect(mockInit).toHaveBeenCalledTimes(1);
    finish();
    expect(await first).toBe(false);
    expect(await second).toBe(true);
    expect(mockOptIn).toHaveBeenCalledTimes(1);
    sendProductEvent("Job Viewed", { jobId: "test" });
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it("tracks through the initialized client and clears identity on disable", async () => {
    process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "token";
    await enableAnalytics();
    sendProductEvent("Job Viewed", { jobId: "job-1" });
    disableAnalytics();
    expect(mockTrack).toHaveBeenCalledWith("Job Viewed", { jobId: "job-1" });
    expect(mockOptOut).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
  });
});

it("does not honor a queued enable after a newer withdrawal", async () => {
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "token";
  resetMixpanelClientForTests();
  mockOptIn.mockClear();
  let finish!: () => void;
  mockInit.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
  const first = enableAnalytics();
  disableAnalytics();
  const second = enableAnalytics();
  disableAnalytics();
  finish();
  expect(await first).toBe(false);
  expect(await second).toBe(false);
  expect(mockOptIn).not.toHaveBeenCalled();
});
