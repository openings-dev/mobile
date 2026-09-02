import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render } from "@testing-library/react-native";

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

describe("AppHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("renders the Openings brand and exposes language and appearance selectors", async () => {
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <AppHeader />
        </ThemeProvider>
      </LocaleProvider>,
    );

    expect(await screen.findByLabelText("Openings jobs")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Language"));
    expect(screen.getByText("Choose language")).toBeTruthy();
    expect(screen.getByText("Português (Brasil)")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Close"));

    await fireEvent.press(screen.getByLabelText("Appearance"));
    expect(screen.getByText("Choose appearance")).toBeTruthy();
    expect(screen.getByText("Use device setting")).toBeTruthy();
    expect(screen.getByText("Light")).toBeTruthy();
    expect(screen.getByText("Dark")).toBeTruthy();
  });

  it("uses the wordmark as a native destination back to Jobs", async () => {
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <AppHeader />
        </ThemeProvider>
      </LocaleProvider>,
    );

    await fireEvent.press(await screen.findByLabelText("Openings jobs"));
    expect(mockReplace).toHaveBeenCalledWith("/jobs");
  });
});
