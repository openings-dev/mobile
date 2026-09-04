import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnalyticsConsentBanner } from "@/components/analytics-consent-banner";
import { LocaleProvider } from "@/contexts/locale";
import { resetAnalyticsConsentForTests } from "@/services/telemetry/consent";

const mockEnable = jest.fn().mockResolvedValue(true);
const mockDisable = jest.fn();
jest.mock("@/services/telemetry/mixpanel-client", () => ({
  disableAnalytics: () => mockDisable(),
  enableAnalytics: () => mockEnable(),
}));

async function renderBanner() {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { height: 844, width: 390, x: 0, y: 0 }, insets: { bottom: 0, left: 0, right: 0, top: 0 } }}>
      <LocaleProvider><AnalyticsConsentBanner /></LocaleProvider>
    </SafeAreaProvider>,
  );
}

describe("AnalyticsConsentBanner", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetAnalyticsConsentForTests();
    mockEnable.mockClear();
    mockDisable.mockClear();
  });

  it("enables analytics only after explicit acceptance", async () => {
    const screen = await renderBanner();
    await act(async () => {
      fireEvent.press(await screen.findByRole("button", { name: "Allow analytics" }));
    });
    await waitFor(() => expect(mockEnable).toHaveBeenCalledTimes(1));
  });

  it("persists a decline and disables analytics", async () => {
    const screen = await renderBanner();
    await act(async () => {
      fireEvent.press(await screen.findByRole("button", { name: "Decline analytics" }));
    });
    await waitFor(() => expect(mockDisable).toHaveBeenCalledTimes(1));
    expect(mockEnable).not.toHaveBeenCalled();
  });
});
