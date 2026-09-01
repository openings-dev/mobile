import { render } from "@testing-library/react-native";
import type { ComponentType, PropsWithChildren } from "react";

import * as localeModule from "@/contexts/locale";
import * as themeModule from "@/contexts/theme";
import * as homeModule from "@/app/home";

const LocaleProvider = (
  localeModule as Record<string, unknown>
).LocaleProvider as ComponentType<PropsWithChildren>;
const ThemeProvider = (
  themeModule as Record<string, unknown>
).ThemeProvider as ComponentType<PropsWithChildren>;
const HomeScreen = (homeModule as Record<string, unknown>)
  .HomeScreen as ComponentType;

describe("HomeScreen", () => {
  it("renders the localized Openings foundation status", async () => {
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <HomeScreen />
        </ThemeProvider>
      </LocaleProvider>,
    );

    expect(screen.getByText("Openings")).toBeTruthy();
    expect(screen.getByText("Foundation ready")).toBeTruthy();
    expect(screen.getByText(/Core 0\.1\.0/)).toBeTruthy();
  });
});
