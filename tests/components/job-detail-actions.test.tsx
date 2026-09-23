import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render } from "@testing-library/react-native";

import { JobDetailActions } from "@/components/job-detail-actions";
import { ThemeProvider } from "@/contexts/theme";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const LABELS = {
  actions: "Actions",
  closeActions: "Close job actions",
  openOriginal: "Open original listing",
  report: "Report a problem",
  save: "Save job",
  share: "Share job",
};

async function renderActions(isSaved = false) {
  const actions = {
    onOpenOriginal: jest.fn(),
    onReport: jest.fn(),
    onShare: jest.fn(),
    onToggleSaved: jest.fn(),
  };
  const onHeightChange = jest.fn();
  const screen = await render(
    <ThemeProvider>
      <JobDetailActions
        isSaved={isSaved}
        labels={isSaved ? { ...LABELS, save: "Remove saved job" } : LABELS}
        onHeightChange={onHeightChange}
        {...actions}
      />
    </ThemeProvider>,
  );

  return { actions, onHeightChange, screen };
}

describe("JobDetailActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("keeps only the primary action and action chooser in the compact dock", async () => {
    const { actions, onHeightChange, screen } = await renderActions();

    expect(screen.getByText("Open original listing")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.queryByText("Share job")).toBeNull();
    expect(screen.queryByText("Save job")).toBeNull();
    expect(screen.queryByText("Report a problem")).toBeNull();

    await fireEvent(screen.getByTestId("job-detail-actions"), "layout", {
      nativeEvent: { layout: { height: 72, width: 390, x: 0, y: 0 } },
    });
    await fireEvent.press(screen.getByText("Open original listing"));

    expect(onHeightChange).toHaveBeenCalledWith(72);
    expect(actions.onOpenOriginal).toHaveBeenCalledTimes(1);
  });

  it("opens and dismisses the secondary action sheet", async () => {
    const { screen } = await renderActions();

    await fireEvent.press(screen.getByText("Actions"));

    expect(screen.getByText("Share job")).toBeTruthy();
    expect(screen.getByText("Save job")).toBeTruthy();
    expect(screen.getByText("Report a problem")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Close job actions"));
    expect(screen.queryByText("Share job")).toBeNull();

    await fireEvent.press(screen.getByText("Actions"));
    await fireEvent(screen.getByTestId("job-detail-action-sheet"), "requestClose");
    expect(screen.queryByText("Share job")).toBeNull();
  });

  it.each([
    ["Share job", "onShare"],
    ["Save job", "onToggleSaved"],
    ["Report a problem", "onReport"],
  ] as const)("closes the sheet after choosing %s", async (label, callback) => {
    const { actions, screen } = await renderActions();

    await fireEvent.press(screen.getByText("Actions"));
    await fireEvent.press(screen.getByText(label));

    expect(actions[callback]).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Share job")).toBeNull();
  });

  it("exposes the saved action as selected", async () => {
    const { screen } = await renderActions(true);

    await fireEvent.press(screen.getByText("Actions"));

    expect(screen.getByLabelText("Remove saved job").props.accessibilityState).toEqual({
      selected: true,
    });
  });
});
