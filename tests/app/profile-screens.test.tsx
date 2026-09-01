import { render } from "@testing-library/react-native";

import { AuthorProfileScreen } from "@/app/authors/profile";
import { CommunityProfileScreen } from "@/app/communities/profile";
import { LocaleProvider } from "@/contexts/locale";
import { useCandidateState } from "@/contexts/candidate-state";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { ThemeProvider } from "@/contexts/theme";
import { makeCommunity, makeOpportunity } from "../fixtures/openings";

jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));
jest.mock("@/contexts/candidate-state", () => ({ useCandidateState: jest.fn() }));
jest.mock("@/contexts/openings-catalog", () => ({ useOpeningsCatalog: jest.fn() }));

describe("native profiles", () => {
  beforeEach(() => {
    jest.mocked(useCandidateState).mockReturnValue({ hydrated: true, isSaved: () => false, markViewed: jest.fn(), previousVisitAt: null, savedIds: new Set(), toggleSaved: jest.fn(), viewedIds: new Set() });
    jest.mocked(useOpeningsCatalog).mockReturnValue({ communities: [makeCommunity("openings-dev/jobs")], error: null, generatedAt: null, isIncremental: false, isLoading: false, isRefreshing: false, loadedPages: 1, opportunities: [makeOpportunity("1"), makeOpportunity("2", { author: { avatarUrl: null, handle: "bob", id: "bob", name: "Bob" }, repository: "other/jobs", community: { avatarUrl: null, id: "other", name: "Other", repository: "other/jobs", url: "https://github.com/other/jobs" } })], refresh: jest.fn(), status: null, totalPages: 1, totalResults: 2 });
  });

  it("shows only a community's current jobs", async () => {
    const screen = await render(<LocaleProvider><ThemeProvider><CommunityProfileScreen repository="openings-dev/jobs" /></ThemeProvider></LocaleProvider>);
    expect(screen.getByText("openings-dev/jobs")).toBeTruthy();
    expect(screen.getByText("Senior React Native Engineer")).toBeTruthy();
  });

  it("shows an author's current jobs", async () => {
    const screen = await render(<LocaleProvider><ThemeProvider><AuthorProfileScreen handle="alice" /></ThemeProvider></LocaleProvider>);
    expect(screen.getByText("@alice")).toBeTruthy();
    expect(screen.getByText("Senior React Native Engineer")).toBeTruthy();
  });
});
