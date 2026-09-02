import AsyncStorage from "@react-native-async-storage/async-storage";
import { render } from "@testing-library/react-native";

import TabsLayout from "@/app/routes/(tabs)/_layout";
import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";

let mockCapturedScreenOptions: Record<string, unknown> = {};

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text, View } = jest.requireActual<typeof import("react-native")>("react-native");

  function MockTabs({
    children,
    screenOptions,
  }: React.PropsWithChildren<{ screenOptions: Record<string, unknown> }>) {
    mockCapturedScreenOptions = screenOptions;
    return React.createElement(View, null, children);
  }

  function MockScreen({
    name,
    options,
  }: {
    name: string;
    options: { title: string };
  }) {
    return React.createElement(Text, null, `${name}:${options.title}`);
  }

  MockTabs.Screen = MockScreen;

  return {
    Tabs: MockTabs,
    useRouter: () => ({ replace: jest.fn() }),
  };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("native navigation shell", () => {
  beforeEach(() => {
    mockCapturedScreenOptions = {};
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("exposes only the three product destinations with production tab sizing", async () => {
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <TabsLayout />
        </ThemeProvider>
      </LocaleProvider>,
    );

    expect(screen.getByText("jobs:Jobs")).toBeTruthy();
    expect(screen.getByText("communities:Communities")).toBeTruthy();
    expect(screen.getByText("authors:Authors")).toBeTruthy();
    expect(screen.queryByText(/compare/i)).toBeNull();
    expect(mockCapturedScreenOptions).toEqual(expect.objectContaining({
      tabBarHideOnKeyboard: true,
      tabBarLabelStyle: expect.objectContaining({
        fontFamily: "Figtree",
        fontSize: 11,
        fontWeight: "500",
      }),
      tabBarStyle: expect.objectContaining({
        height: 72,
        paddingBottom: 8,
        paddingTop: 6,
      }),
    }));
  });
});
