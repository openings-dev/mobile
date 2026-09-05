import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OptionalUpdateBanner } from "@/components/optional-update-banner";
import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";

const mockDismissOptionalUpdate = jest.fn();
const mockStartOptionalUpdate = jest.fn();
let mockMandatoryUpdate = false;
let mockOptionalStoreVersion: string | null = "3";

jest.mock("@/contexts/versioning", () => ({
  useVersioning: () => ({
    dismissOptionalUpdate: mockDismissOptionalUpdate,
    mandatoryUpdate: mockMandatoryUpdate,
    optionalStoreVersion: mockOptionalStoreVersion,
    startOptionalUpdate: mockStartOptionalUpdate,
  }),
}));

describe("OptionalUpdateBanner", () => {
  beforeEach(() => {
    mockMandatoryUpdate = false;
    mockOptionalStoreVersion = "3";
    mockDismissOptionalUpdate.mockResolvedValue(undefined);
    mockStartOptionalUpdate.mockResolvedValue(true);
  });

  it("offers a flexible update and a dismissal above the bottom safe area", async () => {
    const screen = await render(
      <SafeAreaProvider initialMetrics={{ frame: { height: 844, width: 390, x: 0, y: 0 }, insets: { bottom: 34, left: 0, right: 0, top: 44 } }}>
        <LocaleProvider>
          <ThemeProvider>
            <OptionalUpdateBanner />
          </ThemeProvider>
        </LocaleProvider>
      </SafeAreaProvider>,
    );

    expect(screen.getByTestId("optional-update-banner")).toHaveStyle({ paddingBottom: 34 });
    await fireEvent.press(screen.getByTestId("optional-update-action"));
    expect(mockStartOptionalUpdate).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId("optional-update-dismiss"));
    expect(mockDismissOptionalUpdate).toHaveBeenCalledTimes(1);
  });

  it("does not render without an optional version or during mandatory updates", async () => {
    mockOptionalStoreVersion = null;
    const absent = await render(
      <SafeAreaProvider>
        <LocaleProvider><ThemeProvider><OptionalUpdateBanner /></ThemeProvider></LocaleProvider>
      </SafeAreaProvider>,
    );
    expect(absent.queryByTestId("optional-update-banner")).toBeNull();
    await absent.unmount();

    mockOptionalStoreVersion = "3";
    mockMandatoryUpdate = true;
    const mandatory = await render(
      <SafeAreaProvider>
        <LocaleProvider><ThemeProvider><OptionalUpdateBanner /></ThemeProvider></LocaleProvider>
      </SafeAreaProvider>,
    );
    expect(mandatory.queryByTestId("optional-update-banner")).toBeNull();
  });
});
