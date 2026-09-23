import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking, Share } from "react-native";

import { JobDetailsScreen } from "@/app/jobs/details";
import { LocaleProvider } from "@/contexts/locale";
import { useCandidateState } from "@/contexts/candidate-state";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { ThemeProvider } from "@/contexts/theme";
import { makeOpportunity } from "../fixtures/openings";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn(), push: mockPush }) }));
jest.mock("@/contexts/candidate-state", () => ({ useCandidateState: jest.fn() }));
jest.mock("@/contexts/openings-catalog", () => ({ useOpeningsCatalog: jest.fn() }));

describe("JobDetailsScreen", () => {
  it("marks the job viewed and exposes native source/share actions", async () => {
    mockPush.mockClear();
    const markViewed = jest.fn();
    jest.mocked(useCandidateState).mockReturnValue({ dismissNewMatches: jest.fn(), hydrated: true, isSaved: () => false, markViewed, newMatchesDismissedAt: null, previousVisitAt: null, savedIds: new Set(), toggleSaved: jest.fn(), viewedIds: new Set() });
    jest.mocked(useOpeningsCatalog).mockReturnValue({ communities: [], error: null, generatedAt: null, isIncremental: false, isLoading: false, isRefreshing: false, loadedPages: 1, opportunities: [makeOpportunity("gh_123", { dataProvenance: { location: "declared", salary: "unknown", seniority: "inferred", workModel: "declared" } })], refresh: jest.fn(), status: null, totalPages: 1, totalResults: 1 });
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
    const screen = await render(<LocaleProvider><ThemeProvider><JobDetailsScreen id="gh_123" /></ThemeProvider></LocaleProvider>);

    expect(screen.getByText("Senior React Native Engineer")).toBeTruthy();
    expect(screen.getByText("React Native")).toBeTruthy();
    expect(screen.getByText("Data confidence")).toBeTruthy();
    expect(screen.getAllByText("Declared in source")).toHaveLength(2);
    expect(screen.queryByText("Report a problem")).toBeNull();
    await waitFor(() => expect(markViewed).toHaveBeenCalledWith("gh_123"));
    await fireEvent.press(screen.getByLabelText("Show jobs from Openings"));
    expect(mockPush).toHaveBeenLastCalledWith("/communities/openings-dev/jobs");
    await fireEvent.press(screen.getByLabelText("Show jobs from @alice"));
    expect(mockPush).toHaveBeenLastCalledWith("/authors/alice");
    await fireEvent.press(screen.getByText("Open original listing"));
    expect(open).toHaveBeenCalledWith("https://github.com/openings-dev/jobs/issues/gh_123");
    await fireEvent.press(screen.getByText("Actions"));
    await fireEvent.press(screen.getByText("Share job"));
    expect(Share.share).toHaveBeenCalled();
  });
});
