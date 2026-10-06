import { act, render } from "@testing-library/react-native";

import WebContentScreen from "@/app/web-content";
import { messages } from "@/i18n/messages";

const mockBack = jest.fn();
const mockOpenHttpsUrl = jest.fn();
const mockMessages = messages;
let mockKind: unknown = "privacy";
let managedProps: Record<string, unknown> | undefined;

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ kind: mockKind }),
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/contexts/locale", () => ({
  useLocale: () => ({ messages: mockMessages.en }),
}));

jest.mock("@/contexts/theme", () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        canvas: "#ffffff",
        foreground: "#112233",
        "muted-foreground": "#445566",
        primary: "#aabbcc",
        "primary-foreground": "#001122",
      },
    },
  }),
}));

jest.mock("@/services/external-actions", () => ({
  openHttpsUrl: (url: string) => mockOpenHttpsUrl(url),
}));

jest.mock("@trebla/managed-webview", () => ({
  ManagedWebView: (props: Record<string, unknown>) => {
    const { View } = jest.requireActual("react-native");
    managedProps = props as Record<string, unknown>;
    return <View testID="managed-webview" />;
  },
}));

describe("WebContentScreen", () => {
  beforeEach(() => {
    mockKind = "privacy";
    managedProps = undefined;
    mockBack.mockReset();
    mockOpenHttpsUrl.mockReset().mockResolvedValue(undefined);
  });

  it("loads only the selected first-party legal document", async () => {
    const screen = await render(<WebContentScreen />);

    expect(screen.getByTestId("managed-webview")).toBeTruthy();
    expect(screen.getByTestId("web-content-safe-area").props.edges).toEqual({
      top: "additive",
      bottom: "additive",
      left: "additive",
      right: "additive",
    });
    expect(managedProps).toMatchObject({
      uri: "https://openings.dev/privacy",
      allowedOrigins: ["https://openings.dev"],
      allowedPaths: ["/privacy"],
      challengeDetection: true,
      readiness: { type: "load" },
      timeoutMs: 10_000,
      webViewStyle: { flex: 1 },
      labels: {
        errorDescription: messages.en.legal.errorDescription,
        errorTitle: messages.en.legal.errorTitle,
        loading: messages.en.legal.loading,
        openExternal: messages.en.legal.openBrowser,
        retry: messages.en.legal.retry,
      },
    });
  });

  it("rejects arbitrary route values without mounting web content", async () => {
    mockKind = "https://evil.example";
    const screen = await render(<WebContentScreen />);

    expect(screen.queryByTestId("managed-webview")).toBeNull();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("opens package-validated fallback URLs through the HTTPS service", async () => {
    await render(<WebContentScreen />);
    const onOpenExternal = managedProps?.onOpenExternal as (url: string) => Promise<void>;

    await act(() => onOpenExternal("https://docs.example.org/legal"));

    expect(mockOpenHttpsUrl).toHaveBeenCalledWith("https://docs.example.org/legal");
  });
});
