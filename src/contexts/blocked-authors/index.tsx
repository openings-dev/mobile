import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { parseBlockedAuthors } from "@/domain/blocked-authors";

const STORAGE_KEY = "openings:blocked-authors";
interface BlockedAuthorsValue {
  blockedHandles: ReadonlySet<string>;
  hydrated: boolean;
  blockAuthor: (handle: string) => Promise<void>;
  unblockAuthor: (handle: string) => Promise<void>;
}
const BlockedAuthorsContext = createContext<BlockedAuthorsValue | null>(null);

export function BlockedAuthorsProvider({ children }: PropsWithChildren): React.ReactNode {
  const [handles, setHandles] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const current = useRef<string[]>([]);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      const restored = parseBlockedAuthors(raw);
      if (active) {
        current.current = restored;
        setHandles(restored);
        setHydrated(true);
      }
    }).catch(() => {
      if (active) setError(new Error("Could not load local safety preferences"));
    });
    return () => { active = false; };
  }, []);
  const update = useCallback((handle: string, blocked: boolean): Promise<void> => {
    const normalized = handle.trim().toLowerCase();
    const operation = writes.current.then(async () => {
      const next = new Set(current.current);
      if (blocked) next.add(normalized);
      else next.delete(normalized);
      const values = [...next];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      current.current = values;
      setHandles(values);
    });
    writes.current = operation.catch(() => undefined);
    return operation;
  }, []);
  const value = useMemo<BlockedAuthorsValue>(() => ({
    blockedHandles: new Set(handles),
    hydrated,
    blockAuthor: (handle) => update(handle, true),
    unblockAuthor: (handle) => update(handle, false),
  }), [handles, hydrated, update]);
  // Fail closed: the existing localized error boundary provides retry without exposing blocked jobs.
  if (error) throw error;
  return <BlockedAuthorsContext.Provider value={value}>{children}</BlockedAuthorsContext.Provider>;
}

export function useBlockedAuthors(): BlockedAuthorsValue {
  const value = useContext(BlockedAuthorsContext);
  if (!value) throw new Error("useBlockedAuthors requires BlockedAuthorsProvider");
  return value;
}
