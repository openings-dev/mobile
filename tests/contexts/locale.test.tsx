import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { LocaleProvider, useLocale } from "@/contexts/locale";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

function LocaleHarness(): React.ReactNode {
  const { hydrated, locale, setLocale } = useLocale();

  return (
    <>
      <Text>{hydrated ? locale : "loading"}</Text>
      <Pressable accessibilityRole="button" onPress={() => setLocale("fr")}>
        <Text>Français</Text>
      </Pressable>
    </>
  );
}

describe("LocaleProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("hydrates and persists an explicit supported locale", async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue("pt-BR");
    const screen = await render(
      <LocaleProvider>
        <LocaleHarness />
      </LocaleProvider>,
    );

    await screen.findByText("pt-BR");
    await fireEvent.press(screen.getByRole("button"));

    expect(screen.getByText("fr")).toBeTruthy();
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "openings:locale-preference",
        "fr",
      ),
    );
  });

  it("falls back to the device locale when storage is invalid", async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue("unsupported");
    const screen = await render(
      <LocaleProvider>
        <LocaleHarness />
      </LocaleProvider>,
    );

    expect(await screen.findByText("en")).toBeTruthy();
  });
});
