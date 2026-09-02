import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import {
  CandidateStateProvider,
  useCandidateState,
} from "@/contexts/candidate-state";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

function Harness(): React.ReactNode {
  const {
    dismissNewMatches,
    hydrated,
    isSaved,
    newMatchesDismissedAt,
    toggleSaved,
  } = useCandidateState();
  return (
    <>
      <Text>{hydrated ? "hydrated" : "loading"}</Text>
      <Text>{isSaved("gh_123") ? "saved" : "not-saved"}</Text>
      <Text>{newMatchesDismissedAt ?? "not-dismissed"}</Text>
      <Pressable onPress={() => toggleSaved("gh_123")} accessibilityRole="button">
        <Text>toggle</Text>
      </Pressable>
      <Pressable onPress={dismissNewMatches} accessibilityRole="button">
        <Text>dismiss-new-matches</Text>
      </Pressable>
    </>
  );
}

describe("CandidateStateProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date.prototype, "toISOString").mockReturnValue("2026-09-01T12:00:00Z");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("hydrates and persists saved jobs locally", async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
    const screen = await render(
      <CandidateStateProvider>
        <Harness />
      </CandidateStateProvider>,
    );

    await screen.findByText("hydrated");
    await fireEvent.press(screen.getByText("toggle"));

    expect(screen.getByText("saved")).toBeTruthy();
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "openings:candidate-state",
        expect.stringContaining('"gh_123":"2026-09-01T12:00:00Z"'),
      ),
    );
  });

  it("persists dismissal of the new-matches suggestion locally", async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
    const screen = await render(
      <CandidateStateProvider>
        <Harness />
      </CandidateStateProvider>,
    );

    await screen.findByText("hydrated");
    await fireEvent.press(screen.getByText("dismiss-new-matches"));

    expect(screen.getByText("2026-09-01T12:00:00Z")).toBeTruthy();
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "openings:candidate-state",
        expect.stringContaining('"newMatchesDismissedAt":"2026-09-01T12:00:00Z"'),
      ),
    );
  });
});
