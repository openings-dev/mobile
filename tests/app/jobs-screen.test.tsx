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

  it("uses the compact web-parity discovery workspace", async () => {
    const screen = await render(
      <LocaleProvider><ThemeProvider><JobsScreen /></ThemeProvider></LocaleProvider>,
    );

    expect(screen.getByText("Search jobs")).toBeTruthy();
    expect(screen.getByText("Country")).toBeTruthy();
    expect(screen.getByText("Stack / Technology")).toBeTruthy();
    expect(screen.getByText("More")).toBeTruthy();
    expect(screen.getByText("Share search")).toBeTruthy();
    expect(screen.getByText("Most recent")).toBeTruthy();
    expect(screen.getByText("Showing 1–2 of 2 jobs")).toBeTruthy();
    expect(screen.getAllByText("Remote")).toHaveLength(1);
    expect(screen.queryByText("Discover")).toBeNull();
  });

  it("opens community and author discovery from a job card", async () => {
    const screen = await render(
      <LocaleProvider><ThemeProvider><JobsScreen /></ThemeProvider></LocaleProvider>,
    );

    await fireEvent.press(screen.getAllByLabelText("Show jobs from Openings")[0]!);
    expect(mockPush).toHaveBeenLastCalledWith("/communities/openings-dev/jobs");

    await fireEvent.press(screen.getAllByLabelText("Show jobs from @alice")[0]!);
    expect(mockPush).toHaveBeenLastCalledWith("/authors/alice");
  });
});
