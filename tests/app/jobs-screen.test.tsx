import { fireEvent, render } from "@testing-library/react-native";

import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";
import { useCandidateState } from "@/contexts/candidate-state";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { JobsScreen } from "@/app/jobs";
import { makeOpportunity } from "../fixtures/openings";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/contexts/candidate-state", () => ({ useCandidateState: jest.fn() }));
jest.mock("@/contexts/openings-catalog", () => ({ useOpeningsCatalog: jest.fn() }));

describe("JobsScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    jest.mocked(useCandidateState).mockReturnValue({
      hydrated: true,
      isSaved: () => false,
      markViewed: jest.fn(),
      previousVisitAt: null,
      savedIds: new Set(),
      toggleSaved: jest.fn(),
      viewedIds: new Set(),
    });
    jest.mocked(useOpeningsCatalog).mockReturnValue({
      communities: [],
      error: null,
      generatedAt: "2026-09-01T12:00:00Z",
      isIncremental: false,
      isLoading: false,
      isRefreshing: false,
      loadedPages: 2,
      opportunities: [
        makeOpportunity("mobile"),
        makeOpportunity("backend", {
          title: "Backend Java Engineer",
          tags: ["java"],
          taxonomy: { areas: ["backend"], employmentTypes: [], languages: [], seniority: ["mid"], technologies: ["java"], workModels: ["on-site"] },
        }),
      ],
      refresh: jest.fn(),
      status: null,
      totalPages: 2,
      totalResults: 2,
    });
  });

  it("searches loaded jobs and opens native details", async () => {
    const screen = await render(
      <LocaleProvider><ThemeProvider><JobsScreen /></ThemeProvider></LocaleProvider>,
    );

    expect(screen.getByText("Senior React Native Engineer")).toBeTruthy();
    await fireEvent.changeText(
      screen.getByPlaceholderText("Role, stack, company, or location"),
      "backend",
    );
    expect(screen.queryByText("Senior React Native Engineer")).toBeNull();
    await fireEvent.press(screen.getByText("Backend Java Engineer"));
    expect(mockPush).toHaveBeenCalledWith("/jobs/backend");
  });
});
