import AsyncStorage from "@react-native-async-storage/async-storage";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppShellLayout from "@/app/routes/(app)/_layout";
import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";

let mockCapturedStackOptions: Record<string, unknown> = {};
let mockCapturedScreens: Record<string, Record<string, unknown>> = {};
let mockUsedStack = false;
let mockUsedTabs = false;

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text, View } = jest.requireActual<typeof import("react-native")>("react-native");

  function MockStack({
    children,
    screenOptions,
  }: React.PropsWithChildren<{ screenOptions: Record<string, unknown> }>) {
    mockCapturedStackOptions = screenOptions;
    mockUsedStack = true;
    return React.createElement(View, null, children);
  }

  function MockTabs({ children }: React.PropsWithChildren) {
    mockUsedTabs = true;
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

  MockStack.Screen = MockScreen;
  MockTabs.Screen = MockScreen;

  return {
    Stack: MockStack,
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
    mockCapturedStackOptions = {};
    mockCapturedScreens = {};
    mockUsedStack = false;
    mockUsedTabs = false;
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("keeps the three product destinations in a header-only stack", async () => {
    const screen = await render(
      <SafeAreaProvider initialMetrics={{ frame: { height: 844, width: 390, x: 0, y: 0 }, insets: { bottom: 0, left: 0, right: 0, top: 0 } }}>
        <LocaleProvider>
          <ThemeProvider>
            <AppShellLayout />
          </ThemeProvider>
        </LocaleProvider>
      </SafeAreaProvider>,
    );

    expect(screen.getByText("jobs:Jobs")).toBeTruthy();
    expect(screen.getByText("communities:Communities")).toBeTruthy();
    expect(screen.getByText("authors:Authors")).toBeTruthy();
    expect(screen.queryByText(/compare/i)).toBeNull();
    expect(mockUsedTabs).toBe(false);
    expect(mockUsedStack).toBe(true);
    expect(mockCapturedStackOptions).toEqual(expect.objectContaining({
      contentStyle: expect.objectContaining({ backgroundColor: expect.any(String) }),
      headerShown: true,
    }));

    const renderHeader = mockCapturedStackOptions.header as () => React.ReactElement;
    const header = await render(
      <SafeAreaProvider initialMetrics={{ frame: { height: 844, width: 390, x: 0, y: 0 }, insets: { bottom: 0, left: 0, right: 0, top: 0 } }}>
        <LocaleProvider>
          <ThemeProvider>{renderHeader()}</ThemeProvider>
        </LocaleProvider>
      </SafeAreaProvider>,
    );
    expect(header.getByLabelText("Open navigation menu")).toBeTruthy();
  });
});
