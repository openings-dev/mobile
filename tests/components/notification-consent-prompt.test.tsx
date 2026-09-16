import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NotificationConsentPrompt } from "@/components/notification-consent-prompt";
import { LocaleProvider } from "@/contexts/locale";
import { resetNotificationConsentForTests } from "@/services/notifications/consent";
import { resetAnalyticsConsentForTests, writeAnalyticsConsent } from "@/services/telemetry/consent";

const mockAccept = jest.fn().mockResolvedValue(true);
const mockDecline = jest.fn().mockResolvedValue(true);

jest.mock("@/services/notifications", () => ({
  acceptNotifications: () => mockAccept(),
  declineNotifications: () => mockDecline(),
}));

async function renderPrompt() {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { height: 844, width: 390, x: 0, y: 0 }, insets: { bottom: 16, left: 0, right: 0, top: 0 } }}>
      <LocaleProvider><NotificationConsentPrompt /></LocaleProvider>
    </SafeAreaProvider>,
  );
}

describe("NotificationConsentPrompt", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetNotificationConsentForTests();
    resetAnalyticsConsentForTests();
    await writeAnalyticsConsent("denied");
    mockAccept.mockClear();
    mockDecline.mockClear();
  });

  it("waits until the analytics choice is resolved", async () => {
    await AsyncStorage.clear();
    resetAnalyticsConsentForTests();
    resetNotificationConsentForTests();
    const screen = await renderPrompt();
    await waitFor(() => expect(screen.queryByText("New job alerts")).toBeNull());
  });

  it("explains notifications before accepting or declining", async () => {
    const screen = await renderPrompt();
    expect(await screen.findByText("New job alerts")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Enable job alerts" }));
    await waitFor(() => expect(mockAccept).toHaveBeenCalledTimes(1));
  });

  it("declines without calling the accept action", async () => {
    const screen = await renderPrompt();
    fireEvent.press(await screen.findByRole("button", { name: "Not now" }));
    await waitFor(() => expect(mockDecline).toHaveBeenCalledTimes(1));
    expect(mockAccept).not.toHaveBeenCalled();
  });
});
