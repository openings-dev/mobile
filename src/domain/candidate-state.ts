export interface CandidateState {
  lastVisitAt: string | null;
  saved: Record<string, string>;
  version: 2;
  viewed: Record<string, string>;
}

export function createEmptyCandidateState(): CandidateState {
  return { lastVisitAt: null, saved: {}, version: 2, viewed: {} };
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
      value.version !== 2 ||
      !("saved" in value) ||
      !isTimestampMap(value.saved) ||
      !("viewed" in value) ||
      !isTimestampMap(value.viewed) ||
      !("lastVisitAt" in value) ||
      !(value.lastVisitAt === null || typeof value.lastVisitAt === "string")
    ) {
      return createEmptyCandidateState();
    }
    return value as CandidateState;
  } catch {
    return createEmptyCandidateState();
  }
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
