import AsyncStorage from "@react-native-async-storage/async-storage";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import TabsLayout from "@/app/routes/(tabs)/_layout";
import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";

let mockCapturedScreenOptions: Record<string, unknown> = {};
let mockCapturedScreens: Record<string, Record<string, unknown>> = {};

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
    options: Record<string, unknown> & { title: string };
  }) {
    mockCapturedScreens[name] = options;
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
    mockCapturedScreens = {};
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("exposes only the three product destinations with production tab sizing", async () => {
    const screen = await render(
      <SafeAreaProvider initialMetrics={{ frame: { height: 844, width: 390, x: 0, y: 0 }, insets: { bottom: 0, left: 0, right: 0, top: 0 } }}>
        <LocaleProvider>
          <ThemeProvider>
            <TabsLayout />
          </ThemeProvider>
        </LocaleProvider>
      </SafeAreaProvider>,
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
        height: 64,
        paddingBottom: 6,
        paddingTop: 6,
      }),
    }));

    for (const route of ["jobs", "communities", "authors"]) {
      const tabBarIcon = mockCapturedScreens[route]?.tabBarIcon as (props: {
        color: string;
        focused: boolean;
        size: number;
      }) => React.ReactElement;
      const icon = await render(
        tabBarIcon({ color: "#153C31", focused: route === "jobs", size: 22 }),
      );

      expect(JSON.stringify(icon.toJSON())).toContain("RNSVGSvgView");
    }
  });
});
