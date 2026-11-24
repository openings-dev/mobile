import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useBlockedAuthors } from "@/contexts/blocked-authors";
import { visibleOpportunities } from "@/domain/blocked-authors";
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
  const { blockedHandles, hydrated } = useBlockedAuthors();
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
  const sourceOpportunities = catalog?.opportunities ?? progress.items;
  const opportunities = useMemo(
    () => visibleOpportunities(sourceOpportunities, blockedHandles, hydrated),
    [sourceOpportunities, blockedHandles, hydrated],
  );
  const communities = useMemo(() => {
    if (!hydrated) return [];
    const items = catalog?.communities.items ?? metadata?.communities.items ?? [];
    if (blockedHandles.size === 0) return items;
    const counts = new Map<string, { count: number; latest: string }>();
    opportunities.forEach((item) => {
      if (item.issueState !== "open") return;
      const repositories = new Set([item.repository, ...item.sources.map((source) => source.repository)]);
      repositories.forEach((repository) => {
        const existing = counts.get(repository);
        counts.set(repository, {
          count: (existing?.count ?? 0) + 1,
          latest: existing && Date.parse(existing.latest) > Date.parse(item.createdAt)
            ? existing.latest : item.createdAt,
        });
      });
    });
    return items.map((item) => ({
      ...item,
      opportunitiesCount: counts.get(item.repository)?.count ?? 0,
      lastPostedAt: counts.get(item.repository)?.latest ?? null,
    }));
  }, [blockedHandles, catalog, hydrated, metadata, opportunities]);
  const refresh = useCallback(async () => {
    setProgress({ items: [], loadedPages: 0, totalPages: manifest?.pages.length ?? 0 });
    await query.refetch();
  }, [manifest?.pages.length, query]);
  const value = useMemo<CatalogContextValue>(
    () => ({
      communities,
      error: query.error instanceof Error ? query.error : null,
      generatedAt: manifest?.generatedAt ?? null,
      isIncremental:
        query.isPending && progress.items.length > 0 && progress.loadedPages < progress.totalPages,
      isLoading: !hydrated || (query.isPending && progress.items.length === 0),
      isRefreshing: query.isFetching && !query.isPending,
      loadedPages: catalog ? manifest?.pages.length ?? 0 : progress.loadedPages,
      opportunities,
      refresh,
      status: catalog?.status ?? metadata?.status ?? null,
      totalPages: manifest?.pages.length ?? progress.totalPages,
      totalResults: !hydrated || blockedHandles.size > 0 ? opportunities.length : manifest?.totals.openOpportunities ?? opportunities.length,
    }),
    [blockedHandles, hydrated, catalog, communities, manifest, metadata, opportunities, progress, query.error, query.isFetching, query.isPending, refresh],
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
