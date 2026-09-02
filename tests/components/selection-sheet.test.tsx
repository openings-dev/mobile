import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render } from "@testing-library/react-native";

import { SelectionSheet } from "@/components/selection-sheet";
import { ThemeProvider } from "@/contexts/theme";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const OPTIONS = [
  { label: "React", value: "react" },
  { label: "Java", value: "java" },
] as const;

describe("SelectionSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("keeps a multiple-selection draft until Apply", async () => {
    const onApply = jest.fn();
    const onClose = jest.fn();
    const screen = await render(
      <ThemeProvider>
        <SelectionSheet
          applyLabel="Apply"
          clearLabel="Clear"
          closeLabel="Close"
          emptyLabel="No options"
          mode="multiple"
          onApply={onApply}
          onClose={onClose}
          options={OPTIONS}
          selectedValues={["react"]}
          title="Stack / Technology"
          visible
        />
      </ThemeProvider>,
    );

    expect(screen.getByLabelText("React").props.className).toContain(
      "min-h-[52px]",
    );
    expect(screen.getByLabelText("React").props.accessibilityState).toEqual({
      selected: true,
    });
    await fireEvent.press(screen.getByText("Java"));
    expect(onApply).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Apply"));

    expect(onApply).toHaveBeenCalledWith(["react", "java"]);
    expect(onClose).toHaveBeenCalled();
  });

  it("applies a single selection immediately", async () => {
    const onApply = jest.fn();
    const onClose = jest.fn();
    const screen = await render(
      <ThemeProvider>
        <SelectionSheet
          applyLabel="Apply"
          clearLabel="Clear"
          closeLabel="Close"
          emptyLabel="No options"
          mode="single"
          onApply={onApply}
          onClose={onClose}
          options={OPTIONS}
          selectedValues={[]}
          title="Country"
          visible
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByText("React"));

    expect(onApply).toHaveBeenCalledWith(["react"]);
    expect(onClose).toHaveBeenCalled();
  });
});
