import { fireEvent, render } from "@testing-library/react-native";
import { BackHandler, Linking, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { VersioningScreen } from "@/app/versioning";
import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";

const mockStartImmediateUpdate = jest.fn();

jest.mock("@/contexts/versioning", () => ({
  useVersioning: () => ({ startImmediateUpdate: mockStartImmediateUpdate }),
}));

describe("VersioningScreen", () => {
  beforeEach(() => {
    mockStartImmediateUpdate.mockClear();
    mockStartImmediateUpdate.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ["android", "https://play.google.com/store/apps/details?id=dev.openings.mobile"],
    ["ios", "https://apps.apple.com/app/id6834098510"],
  ] as const)("uses the correct store and update fallback on %s", async (platform, storeUrl) => {
    jest.replaceProperty(Platform, "OS", platform);
    const remove = jest.fn();
    let handler: (() => boolean) | undefined;
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, next) => {
      handler = next as () => boolean;
      return { remove };
    });
    const openUrl = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const screen = await render(
      <SafeAreaProvider initialMetrics={{ frame: { height: 844, width: 390, x: 0, y: 0 }, insets: { bottom: 24, left: 0, right: 0, top: 44 } }}>
        <LocaleProvider>
          <ThemeProvider>
            <VersioningScreen />
          </ThemeProvider>
        </LocaleProvider>
      </SafeAreaProvider>,
    );

    expect(handler?.()).toBe(true);
    await fireEvent.press(screen.getByTestId("versioning-update"));
    expect(mockStartImmediateUpdate).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId("versioning-open-store"));
    expect(openUrl).toHaveBeenCalledWith(storeUrl);
    mockStartImmediateUpdate.mockResolvedValueOnce(false);
    openUrl.mockClear();
    await fireEvent.press(screen.getByTestId("versioning-update"));
    expect(openUrl).toHaveBeenCalledWith(storeUrl);

    await screen.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
