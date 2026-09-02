import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import {
  ThemeProvider,
  useAppTheme,
  type ThemePreference,
} from "@/contexts/theme";

const mockUseColorScheme = jest.fn<"dark" | "light" | null, []>(() => "light");

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

function ThemeHarness(): React.ReactNode {
  const { hydrated, name, preference, setPreference } = useAppTheme();
  const select = (value: ThemePreference) => setPreference(value);

  return (
    <>
      <Text>{hydrated ? `${preference}/${name}` : "loading"}</Text>
      <Pressable accessibilityRole="button" onPress={() => select("system")}>
        <Text>System</Text>
      </Pressable>
    </>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue("light");
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("hydrates an explicit theme and can return to the system preference", async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue("dark");
    const screen = await render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    );

    await screen.findByText("dark/dark");
    await fireEvent.press(screen.getByRole("button"));

    expect(screen.getByText("system/light")).toBeTruthy();
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "openings:theme-preference",
        "system",
      ),
    );
  });

  it("ignores an invalid stored preference", async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue("midnight");
    const screen = await render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    );

    expect(await screen.findByText("system/light")).toBeTruthy();
  });
});
