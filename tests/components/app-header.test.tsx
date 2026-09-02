import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, type Metrics } from "react-native-safe-area-context";

import { AppHeader } from "@/components/app-header";
import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const DEFAULT_METRICS: Metrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

function renderAppHeader(metrics: Metrics = DEFAULT_METRICS) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <LocaleProvider>
        <ThemeProvider>
          <AppHeader />
        </ThemeProvider>
      </LocaleProvider>
    </SafeAreaProvider>,
  );
}

describe("AppHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("renders the Openings brand and opens the native navigation drawer", async () => {
    const screen = await renderAppHeader();

    expect(await screen.findByLabelText("Openings jobs")).toBeTruthy();
    expect(screen.queryByLabelText("Language")).toBeNull();
    expect(screen.queryByLabelText("Appearance")).toBeNull();

    await fireEvent.press(screen.getByLabelText("Open navigation menu"));
    expect(screen.getByText("Jobs")).toBeTruthy();
    expect(screen.getByText("Communities")).toBeTruthy();
    expect(screen.getByText("Authors")).toBeTruthy();
    expect(screen.getByText("Support openings.dev")).toBeTruthy();
    expect(screen.getByText("Star on GitHub")).toBeTruthy();
    expect(screen.getByLabelText("Language")).toBeTruthy();
    expect(screen.getByLabelText("Appearance")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Language"));
    expect(screen.getByText("Choose language")).toBeTruthy();
    expect(screen.getByText("Português")).toBeTruthy();
    await fireEvent.press(screen.getByText("Português"));
    expect(screen.getByText("Português")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Aparência"));
    expect(screen.getByText("Escolha a aparência")).toBeTruthy();
    expect(screen.getByText("Usar configuração do aparelho")).toBeTruthy();
    expect(screen.getByText("Claro")).toBeTruthy();
    expect(screen.getByText("Escuro")).toBeTruthy();
  });

  it("uses the wordmark as a native destination back to Jobs", async () => {
    const screen = await renderAppHeader();

    await fireEvent.press(await screen.findByLabelText("Openings jobs"));
    expect(mockReplace).toHaveBeenCalledWith("/jobs");
  });

  it("closes the navigation drawer with its explicit close control", async () => {
    const screen = await renderAppHeader();

    await fireEvent.press(await screen.findByLabelText("Open navigation menu"));
    await fireEvent.press(screen.getByLabelText("Close navigation menu"));
    expect(screen.queryByText("Support openings.dev")).toBeNull();
  });

  it("keeps the drawer footer scrollable above a compact device safe area", async () => {
    const screen = await renderAppHeader({
      frame: { height: 667, width: 390, x: 0, y: 0 },
      insets: { bottom: 34, left: 0, right: 0, top: 47 },
    });

    await fireEvent.press(await screen.findByLabelText("Open navigation menu"));

    const scrollView = screen.getByTestId("app-drawer-scroll");
    const footer = within(scrollView).getByTestId("app-drawer-footer");

    expect(scrollView.props.contentContainerClassName).toBe("grow");
    expect(StyleSheet.flatten(footer.props.style)).toEqual(
      expect.objectContaining({ paddingBottom: 50 }),
    );
  });

  it("keeps drawer preferences inside one native modal host on iOS", async () => {
    const screen = await renderAppHeader();

    await fireEvent.press(await screen.findByLabelText("Open navigation menu"));
    await fireEvent.press(screen.getByLabelText("Language"));

    const visibleNativeModalHosts = screen.container.queryAll(
      (element) =>
        element.props.visible === true &&
        typeof element.props.onRequestClose === "function",
    );

    expect(screen.getByText("Choose language")).toBeTruthy();
    expect(visibleNativeModalHosts).toHaveLength(1);
  });
});
