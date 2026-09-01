import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  CommunitiesPayload,
  CommunityStatusPayload,
  Opportunity,
  SnapshotManifest,
} from "@/domain/openings/types";
import {
  type CatalogMetadata,
  loadOpeningsCatalog,
} from "@/services/openings-catalog";

interface CatalogContextValue {
  communities: CommunitiesPayload["items"];
  error: Error | null;
  generatedAt: string | null;
  isIncremental: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  loadedPages: number;
  opportunities: Opportunity[];
  refresh: () => Promise<void>;
  status: CommunityStatusPayload | null;
  totalPages: number;
  totalResults: number;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function OpeningsCatalogProvider({
  children,
}: PropsWithChildren): React.ReactNode {
  const [progress, setProgress] = useState<{
    items: Opportunity[];
    loadedPages: number;
    totalPages: number;
  }>({ items: [], loadedPages: 0, totalPages: 0 });
  const [metadata, setMetadata] = useState<CatalogMetadata | null>(null);
  const query = useQuery({
    queryKey: ["openings", "catalog"],
    queryFn: ({ signal }) =>
      loadOpeningsCatalog({
        onMetadata: setMetadata,
        onProgress: setProgress,
        signal,
      }),
    staleTime: 5 * 60 * 1000,
  });
  const catalog = query.data;
  const manifest: SnapshotManifest | undefined = catalog?.manifest ?? metadata?.manifest;
  const opportunities = catalog?.opportunities ?? progress.items;
  const refresh = useCallback(async () => {
    setProgress({ items: [], loadedPages: 0, totalPages: manifest?.pages.length ?? 0 });
    await query.refetch();
  }, [manifest?.pages.length, query]);
  const value = useMemo<CatalogContextValue>(
    () => ({
      communities: catalog?.communities.items ?? metadata?.communities.items ?? [],
      error: query.error instanceof Error ? query.error : null,
      generatedAt: manifest?.generatedAt ?? null,
      isIncremental:
        query.isPending && progress.items.length > 0 && progress.loadedPages < progress.totalPages,
      isLoading: query.isPending && progress.items.length === 0,
      isRefreshing: query.isFetching && !query.isPending,
      loadedPages: catalog ? manifest?.pages.length ?? 0 : progress.loadedPages,
      opportunities,
      refresh,
      status: catalog?.status ?? metadata?.status ?? null,
      totalPages: manifest?.pages.length ?? progress.totalPages,
      totalResults: manifest?.totals.openOpportunities ?? opportunities.length,
    }),
    [catalog, manifest, metadata, opportunities, progress, query.error, query.isFetching, query.isPending, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useOpeningsCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useOpeningsCatalog must be used within OpeningsCatalogProvider");
  }
  return context;
}
