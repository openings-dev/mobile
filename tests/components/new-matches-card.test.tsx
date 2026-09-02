import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render } from "@testing-library/react-native";

import { NewMatchesCard } from "@/components/new-matches-card";
import { ThemeProvider } from "@/contexts/theme";
import { messages } from "@/i18n/messages";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("NewMatchesCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("keeps its primary action and dismissal independent", async () => {
    const onDismiss = jest.fn();
    const onShow = jest.fn();
    const screen = await render(
      <ThemeProvider>
        <NewMatchesCard
          copy={messages.en.jobs.newMatches}
          onDismiss={onDismiss}
          onShow={onShow}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByText("Show new matches"));
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    await fireEvent.press(
      screen.getByLabelText("Dismiss new matches suggestion"),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onShow).toHaveBeenCalledTimes(1);
  });
});
