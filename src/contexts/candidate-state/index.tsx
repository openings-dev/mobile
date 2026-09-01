import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type CandidateState,
  createEmptyCandidateState,
  parseCandidateState,
  startCandidateSession,
  toggleSavedJob,
  viewJob,
} from "@/domain/candidate-state";

const STORAGE_KEY = "openings:candidate-state";

interface CandidateStateContextValue {
  hydrated: boolean;
  isSaved: (id: string) => boolean;
  markViewed: (id: string) => void;
  previousVisitAt: string | null;
  savedIds: ReadonlySet<string>;
  toggleSaved: (id: string) => void;
  viewedIds: ReadonlySet<string>;
}

const CandidateStateContext = createContext<CandidateStateContextValue | null>(null);

export function CandidateStateProvider({
  children,
}: PropsWithChildren): React.ReactNode {
  const [state, setState] = useState<CandidateState>(createEmptyCandidateState);
  const [previousVisitAt, setPreviousVisitAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active) {
          const session = startCandidateSession(
            parseCandidateState(raw),
            new Date().toISOString(),
          );
          setPreviousVisitAt(session.previousVisitAt);
          setState(session.state);
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const toggleSaved = useCallback((id: string) => {
    setState((current) => toggleSavedJob(current, id, new Date().toISOString()));
  }, []);
  const markViewed = useCallback((id: string) => {
    setState((current) => viewJob(current, id, new Date().toISOString()));
  }, []);
  const savedIds = useMemo(() => new Set(Object.keys(state.saved)), [state.saved]);
  const viewedIds = useMemo(() => new Set(Object.keys(state.viewed)), [state.viewed]);
  const value = useMemo<CandidateStateContextValue>(
    () => ({
      hydrated,
      isSaved: (id) => savedIds.has(id),
      markViewed,
      previousVisitAt,
      savedIds,
      toggleSaved,
      viewedIds,
    }),
    [hydrated, markViewed, previousVisitAt, savedIds, toggleSaved, viewedIds],
  );

  return (
    <CandidateStateContext.Provider value={value}>
      {children}
    </CandidateStateContext.Provider>
  );
}

export function useCandidateState(): CandidateStateContextValue {
  const context = useContext(CandidateStateContext);
  if (!context) {
    throw new Error("useCandidateState must be used within CandidateStateProvider");
  }
  return context;
}
