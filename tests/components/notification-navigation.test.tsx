import { act, render } from "@testing-library/react-native";

import { NotificationNavigation } from "@/components/notification-navigation";

const mockPush = jest.fn();
let mockNavigationKey: string | undefined;
let mockClick: ((jobId: string) => void) | undefined;
const mockUnsubscribe = jest.fn();

jest.mock("expo-router", () => ({
  useRootNavigationState: () => ({ key: mockNavigationKey }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/services/notifications/onesignal-client", () => ({
  addNotificationClickListener: (listener: (jobId: string) => void) => {
    mockClick = listener;
    return mockUnsubscribe;
  },
}));

describe("NotificationNavigation", () => {
  beforeEach(() => {
    mockNavigationKey = undefined;
    mockClick = undefined;
    mockPush.mockClear();
    mockUnsubscribe.mockClear();
  });

  it("holds a cold-start click until navigation is ready", async () => {
    const screen = await render(<NotificationNavigation />);
    await act(() => mockClick?.("gh_1234567890abcdef12345678"));
    expect(mockPush).not.toHaveBeenCalled();

    mockNavigationKey = "root";
    await screen.rerender(<NotificationNavigation />);
    expect(mockPush).toHaveBeenCalledWith("/jobs/gh_1234567890abcdef12345678");
  });

  it("removes the SDK listener on unmount", async () => {
    mockNavigationKey = "root";
    const screen = await render(<NotificationNavigation />);
    await screen.unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
