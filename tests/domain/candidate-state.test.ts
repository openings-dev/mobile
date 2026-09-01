import {
  createEmptyCandidateState,
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
});
