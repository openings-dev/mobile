import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render } from "@testing-library/react-native";

import { JobDetailActions } from "@/components/job-detail-actions";
import { ThemeProvider } from "@/contexts/theme";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("JobDetailActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("exposes four independent actions and reports its dock height", async () => {
    const onHeightChange = jest.fn();
    const actions = {
      onOpenOriginal: jest.fn(),
      onReport: jest.fn(),
      onShare: jest.fn(),
      onToggleSaved: jest.fn(),
    };
    const screen = await render(
      <ThemeProvider>
        <JobDetailActions
          isSaved={false}
          labels={{
            openOriginal: "Open original listing",
            report: "Report a problem",
            save: "Save job",
            share: "Share job",
          }}
          onHeightChange={onHeightChange}
          {...actions}
        />
      </ThemeProvider>,
    );

    await fireEvent(screen.getByTestId("job-detail-actions"), "layout", {
      nativeEvent: { layout: { height: 220, width: 390, x: 0, y: 0 } },
    });
    expect(onHeightChange).toHaveBeenCalledWith(220);

    await fireEvent.press(screen.getByText("Open original listing"));
    await fireEvent.press(screen.getByText("Share job"));
    await fireEvent.press(screen.getByText("Save job"));
    await fireEvent.press(screen.getByText("Report a problem"));

    expect(actions.onOpenOriginal).toHaveBeenCalledTimes(1);
    expect(actions.onShare).toHaveBeenCalledTimes(1);
    expect(actions.onToggleSaved).toHaveBeenCalledTimes(1);
    expect(actions.onReport).toHaveBeenCalledTimes(1);
  });
});
