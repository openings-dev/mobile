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

  it("renders the Openings brand and opens the native navigation drawer", async () => {
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <AppHeader />
        </ThemeProvider>
      </LocaleProvider>,
    );

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

  it("closes the navigation drawer with its explicit close control", async () => {
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <AppHeader />
        </ThemeProvider>
      </LocaleProvider>,
    );

    await fireEvent.press(await screen.findByLabelText("Open navigation menu"));
    await fireEvent.press(screen.getByLabelText("Close navigation menu"));
    expect(screen.queryByText("Support openings.dev")).toBeNull();
  });
});
