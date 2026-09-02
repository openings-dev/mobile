import { Linking } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import { SupportCard } from "@/components/support-card";
import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";

jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

describe("SupportCard", () => {
  it("opens the public web repository from the translated call to action", async () => {
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <SupportCard />
        </ThemeProvider>
      </LocaleProvider>,
    );

    fireEvent.press(await screen.findByText("Star on GitHub"));
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://github.com/openings-dev/web",
    );
  });
});
