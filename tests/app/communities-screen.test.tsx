import { fireEvent, render } from "@testing-library/react-native";

import { CommunitiesScreen } from "@/app/communities";
import { LocaleProvider } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { ThemeProvider } from "@/contexts/theme";
import { makeCommunity } from "../fixtures/openings";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/contexts/openings-catalog", () => ({ useOpeningsCatalog: jest.fn() }));

describe("CommunitiesScreen", () => {
  it("starts with active communities and can show sources without openings", async () => {
    jest.mocked(useOpeningsCatalog).mockReturnValue({
      communities: [makeCommunity("active/jobs"), makeCommunity("quiet/jobs", { opportunitiesCount: 0 })],
      error: null,
      generatedAt: "2026-09-01T12:00:00Z",
      isIncremental: false,
      isLoading: false,
      isRefreshing: false,
      loadedPages: 1,
      opportunities: [],
      refresh: jest.fn(),
      status: {
        generatedAt: "2026-09-01T12:00:00Z",
        items: [
          { country: "Brazil", countryCode: "BR", lastPostedAt: "2026-09-01T12:00:00Z", lastSuccessfulSyncAt: "2026-09-01T12:00:00Z", name: "active", openOpportunities: 2, region: "South America", repository: "active/jobs", repositoryUrl: "https://github.com/active/jobs", state: "healthy" },
          { country: "Brazil", countryCode: "BR", lastPostedAt: null, lastSuccessfulSyncAt: "2026-09-01T12:00:00Z", name: "quiet", openOpportunities: 0, region: "South America", repository: "quiet/jobs", repositoryUrl: "https://github.com/quiet/jobs", state: "no-openings" },
        ],
        totals: { communities: 2, errors: 0, healthy: 1, noOpenings: 1 },
      },
      totalPages: 1,
      totalResults: 0,
    });
    const screen = await render(
      <LocaleProvider><ThemeProvider><CommunitiesScreen /></ThemeProvider></LocaleProvider>,
    );

    expect(screen.getByText("active/jobs")).toBeTruthy();
    expect(screen.queryByText("quiet/jobs")).toBeNull();
    await fireEvent.press(screen.getByText("No openings · 1"));
    expect(screen.getByText("quiet/jobs")).toBeTruthy();
  });
});
