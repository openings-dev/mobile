import {
  createEmptyCandidateState,
  dismissNewMatches,
  parseCandidateState,
  startCandidateSession,
  toggleSavedJob,
  viewJob,
} from "@/domain/candidate-state";

describe("candidate state", () => {
  it("recovers safely from malformed persisted data", () => {
    expect(parseCandidateState("not-json")).toEqual(createEmptyCandidateState());
    expect(parseCandidateState(JSON.stringify({ version: 99 }))).toEqual(
      createEmptyCandidateState(),
    );
  });

  it("toggles saved jobs without mutating the previous state", () => {
    const initial = createEmptyCandidateState();
    const saved = toggleSavedJob(initial, "gh_123", "2026-09-01T12:00:00Z");
    const unsaved = toggleSavedJob(saved, "gh_123", "2026-09-01T13:00:00Z");

    expect(initial.saved).toEqual({});
    expect(saved.saved.gh_123).toBe("2026-09-01T12:00:00Z");
    expect(unsaved.saved).toEqual({});
  });

  it("records viewed jobs without changing the current session boundary", () => {
    const initial = createEmptyCandidateState();
    const viewed = viewJob(initial, "gh_123", "2026-09-01T12:00:00Z");

    expect(viewed.viewed.gh_123).toBe("2026-09-01T12:00:00Z");
    expect(viewed.lastVisitAt).toBeNull();
  });

  it("advances the visit boundary while preserving the prior session", () => {
    const initial = { ...createEmptyCandidateState(), lastVisitAt: "2026-08-31T12:00:00Z" };
    const session = startCandidateSession(initial, "2026-09-01T12:00:00Z");

    expect(session.previousVisitAt).toBe("2026-08-31T12:00:00Z");
    expect(session.state.lastVisitAt).toBe("2026-09-01T12:00:00Z");
  });

  it("migrates version 2 state without losing candidate history", () => {
    const migrated = parseCandidateState(JSON.stringify({
      lastVisitAt: "2026-08-31T12:00:00Z",
      saved: { gh_123: "2026-08-31T13:00:00Z" },
      version: 2,
      viewed: { gh_456: "2026-08-31T14:00:00Z" },
    }));

    expect(migrated).toEqual({
      lastVisitAt: "2026-08-31T12:00:00Z",
      newMatchesDismissedAt: null,
      saved: { gh_123: "2026-08-31T13:00:00Z" },
      version: 3,
      viewed: { gh_456: "2026-08-31T14:00:00Z" },
    });
  });

  it("records when the new-matches suggestion was dismissed", () => {
    const dismissed = dismissNewMatches(
      createEmptyCandidateState(),
      "2026-09-02T12:00:00Z",
    );

    expect(dismissed.newMatchesDismissedAt).toBe("2026-09-02T12:00:00Z");
  });
});
