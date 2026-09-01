import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking, Share } from "react-native";

import { JobDetailsScreen } from "@/app/jobs/details";
import { LocaleProvider } from "@/contexts/locale";
import { useCandidateState } from "@/contexts/candidate-state";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { ThemeProvider } from "@/contexts/theme";
import { makeOpportunity } from "../fixtures/openings";

jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));
jest.mock("@/contexts/candidate-state", () => ({ useCandidateState: jest.fn() }));
jest.mock("@/contexts/openings-catalog", () => ({ useOpeningsCatalog: jest.fn() }));

describe("JobDetailsScreen", () => {
  it("marks the job viewed and exposes native source/share actions", async () => {
    const markViewed = jest.fn();
    jest.mocked(useCandidateState).mockReturnValue({ hydrated: true, isSaved: () => false, markViewed, previousVisitAt: null, savedIds: new Set(), toggleSaved: jest.fn(), viewedIds: new Set() });
    jest.mocked(useOpeningsCatalog).mockReturnValue({ communities: [], error: null, generatedAt: null, isIncremental: false, isLoading: false, isRefreshing: false, loadedPages: 1, opportunities: [makeOpportunity("gh_123")], refresh: jest.fn(), status: null, totalPages: 1, totalResults: 1 });
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
    const screen = await render(<LocaleProvider><ThemeProvider><JobDetailsScreen id="gh_123" /></ThemeProvider></LocaleProvider>);

    expect(screen.getByText("Senior React Native Engineer")).toBeTruthy();
    await waitFor(() => expect(markViewed).toHaveBeenCalledWith("gh_123"));
    await fireEvent.press(screen.getByText("Open original listing"));
    expect(open).toHaveBeenCalledWith("https://github.com/openings-dev/jobs/issues/gh_123");
    await fireEvent.press(screen.getByText("Share job"));
    expect(Share.share).toHaveBeenCalled();
  });
});
