import { fireEvent, render } from "@testing-library/react-native";

import { AuthorsScreen } from "@/app/authors";
import { LocaleProvider } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { ThemeProvider } from "@/contexts/theme";
import { makeOpportunity } from "../fixtures/openings";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/contexts/openings-catalog", () => ({ useOpeningsCatalog: jest.fn() }));

describe("AuthorsScreen", () => {
  it("derives authors from jobs and searches by handle", async () => {
    jest.mocked(useOpeningsCatalog).mockReturnValue({
      communities: [], error: null, generatedAt: null, isIncremental: false, isLoading: false, isRefreshing: false, loadedPages: 1,
      opportunities: [makeOpportunity("1"), makeOpportunity("2", { author: { avatarUrl: null, handle: "bob", id: "bob", name: "Bob" } })],
      refresh: jest.fn(), status: null, totalPages: 1, totalResults: 2,
    });
    const screen = await render(
      <LocaleProvider><ThemeProvider><AuthorsScreen /></ThemeProvider></LocaleProvider>,
    );

    expect(screen.getByText("@alice")).toBeTruthy();
    expect(screen.getByText("@bob")).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText("Search authors or handles"), "bob");
    expect(screen.queryByText("@alice")).toBeNull();
    expect(screen.getByText("@bob")).toBeTruthy();
  });
});
