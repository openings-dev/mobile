import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AnalyticsPreference } from "@/components/analytics-preference";
import { LocaleProvider } from "@/contexts/locale";
import { resetAnalyticsConsentForTests } from "@/services/telemetry/consent";
import { enableAnalytics, resetMixpanelClientForTests, sendProductEvent } from "@/services/telemetry/mixpanel-client";

const mockInit = jest.fn().mockResolvedValue(undefined);
const mockOptOut = jest.fn();
const mockReset = jest.fn();
const mockOptIn = jest.fn();
const mockTrack = jest.fn();
jest.mock("mixpanel-react-native", () => ({ Mixpanel: jest.fn().mockImplementation(() => ({ init: mockInit, optOutTracking: mockOptOut, reset: mockReset, optInTracking: mockOptIn, track: mockTrack, setUseIpAddressForGeolocation: jest.fn() })) }));

const originalToken = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
beforeEach(async () => {
  await AsyncStorage.clear();
  resetAnalyticsConsentForTests();
  resetMixpanelClientForTests();
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = "test-token";
});
afterAll(() => { process.env.EXPO_PUBLIC_MIXPANEL_TOKEN = originalToken; });

it("revokes native analytics, persists denial, resets identity and stops events", async () => {
  await AsyncStorage.setItem("openings:analytics-consent", JSON.stringify({ version: 1, state: "granted" }));
  await AsyncStorage.setItem("openings:candidate-state", "saved-history");
  await enableAnalytics();
  const screen = await render(<LocaleProvider><AnalyticsPreference /></LocaleProvider>);
  const control = await screen.findByRole("switch", { name: "Optional product analytics" });
  await waitFor(() => expect(control.props.accessibilityState.checked).toBe(true));
  await fireEvent.press(control);
  await waitFor(() => expect(mockReset).toHaveBeenCalledTimes(1));
  expect(mockOptOut).toHaveBeenCalledTimes(1);
  expect(JSON.parse((await AsyncStorage.getItem("openings:analytics-consent"))!).state).toBe("denied");
  sendProductEvent("Job Viewed", { jobId: "test" });
  expect(mockTrack).not.toHaveBeenCalled();
  expect(await AsyncStorage.getItem("openings:candidate-state")).toBe("saved-history");
  expect(screen.getByRole("switch").props.accessibilityState.checked).toBe(false);
  await fireEvent.press(screen.getByRole("switch"));
  await waitFor(() => expect(mockOptIn).toHaveBeenCalledTimes(2));
  expect(JSON.parse((await AsyncStorage.getItem("openings:analytics-consent"))!).state).toBe("granted");
});


it("stops analytics immediately when denial cannot be persisted", async () => {
  await AsyncStorage.setItem("openings:analytics-consent", JSON.stringify({ version: 1, state: "granted" }));
  await enableAnalytics();
  const screen = await render(<LocaleProvider><AnalyticsPreference /></LocaleProvider>);
  const control = await screen.findByRole("switch");
  await waitFor(() => expect(control.props.accessibilityState.checked).toBe(true));
  const write = jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("storage unavailable"));
  await fireEvent.press(control);
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not save this choice. Please try again.");
  expect(control.props.accessibilityState.checked).toBe(false);
  expect(mockOptOut).toHaveBeenCalledTimes(1);
  expect(mockReset).toHaveBeenCalledTimes(1);
  sendProductEvent("Job Viewed", { jobId: "test" });
  expect(mockTrack).not.toHaveBeenCalled();
  expect(screen.getByText("Off for this session. Tap to retry saving your choice.")).toBeTruthy();
  await fireEvent.press(screen.getByRole("switch"));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(JSON.parse((await AsyncStorage.getItem("openings:analytics-consent"))!).state).toBe("denied");
  expect(mockOptIn).toHaveBeenCalledTimes(1);
  write.mockRestore();
});
