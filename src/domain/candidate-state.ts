export interface CandidateState {
  lastVisitAt: string | null;
  newMatchesDismissedAt: string | null;
  saved: Record<string, string>;
  version: 3;
  viewed: Record<string, string>;
}

export function createEmptyCandidateState(): CandidateState {
  return {
    lastVisitAt: null,
    newMatchesDismissedAt: null,
    saved: {},
    version: 3,
    viewed: {},
  };
}

function isTimestampMap(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([key, timestamp]) => key.length > 0 && typeof timestamp === "string",
    )
  );
}

export function parseCandidateState(raw: string | null): CandidateState {
  if (!raw) return createEmptyCandidateState();
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== "object" ||
      value === null ||
      !("version" in value) ||
      (value.version !== 2 && value.version !== 3) ||
      !("saved" in value) ||
      !isTimestampMap(value.saved) ||
      !("viewed" in value) ||
      !isTimestampMap(value.viewed) ||
      !("lastVisitAt" in value) ||
      !(value.lastVisitAt === null || typeof value.lastVisitAt === "string") ||
      (value.version === 3 &&
        (!("newMatchesDismissedAt" in value) ||
          !(value.newMatchesDismissedAt === null ||
            typeof value.newMatchesDismissedAt === "string")))
    ) {
      return createEmptyCandidateState();
    }

    return {
      lastVisitAt: value.lastVisitAt,
      newMatchesDismissedAt: value.version === 3 &&
        "newMatchesDismissedAt" in value
        ? value.newMatchesDismissedAt as string | null
        : null,
      saved: value.saved,
      version: 3,
      viewed: value.viewed,
    };
  } catch {
    return createEmptyCandidateState();
  }
}

export function dismissNewMatches(
  state: CandidateState,
  timestamp: string,
): CandidateState {
  return { ...state, newMatchesDismissedAt: timestamp };
}

export function toggleSavedJob(
  state: CandidateState,
  id: string,
  timestamp: string,
): CandidateState {
  const saved = { ...state.saved };
  if (saved[id]) delete saved[id];
  else saved[id] = timestamp;
  return { ...state, saved };
}

export function viewJob(
  state: CandidateState,
  id: string,
  timestamp: string,
): CandidateState {
  return {
    ...state,
    viewed: { ...state.viewed, [id]: timestamp },
  };
}

export function startCandidateSession(
  state: CandidateState,
  timestamp: string,
): { previousVisitAt: string | null; state: CandidateState } {
  return {
    previousVisitAt: state.lastVisitAt,
    state: { ...state, lastVisitAt: timestamp },
  };
}
