import { fireEvent, render } from "@testing-library/react-native";

import { PreferencePopover } from "@/components/preference-popover";
import { ThemeProvider } from "@/contexts/theme";

describe("PreferencePopover", () => {
  it("marks the active option and returns the selected value", async () => {
    const onSelect = jest.fn();
    const screen = await render(
      <ThemeProvider>
        <PreferencePopover
          onClose={jest.fn()}
          onSelect={onSelect}
          options={[
            { label: "English", value: "en" },
            { label: "Português", value: "pt-BR" },
          ]}
          selectedValue="en"
          title="Choose language"
          visible
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByLabelText("English").props.accessibilityState,
    ).toEqual({ selected: true });
    fireEvent.press(screen.getByLabelText("Português"));
    expect(onSelect).toHaveBeenCalledWith("pt-BR");
  });
});
