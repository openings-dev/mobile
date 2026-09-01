import type {
  CommunitiesPayload,
  CommunityStatusPayload,
  Opportunity,
  SnapshotManifest,
} from "@/domain/openings/types";
import {
  buildSnapshotUrl,
  parseCommunities,
  parseCommunityStatus,
  parseManifest,
  parseOpportunityPage,
} from "@/domain/openings/validation";

export interface CatalogProgress {
  items: Opportunity[];
  loadedPages: number;
  totalPages: number;
}

export interface OpeningsCatalog {
  communities: CommunitiesPayload;
  manifest: SnapshotManifest;
  opportunities: Opportunity[];
  status: CommunityStatusPayload;
}

export type CatalogMetadata = Omit<OpeningsCatalog, "opportunities">;

interface LoadOpeningsCatalogOptions {
  batchSize?: number;
  fetcher?: typeof fetch;
  onMetadata?: (metadata: CatalogMetadata) => void;
  onProgress?: (progress: CatalogProgress) => void;
  signal?: AbortSignal;
}

export function isOfflineCatalogError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  const message = error.message.toLocaleLowerCase();
  return message.includes("network") || message.includes("fetch");
}

async function fetchUnknown(
  path: string,
  fetcher: typeof fetch,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetcher(buildSnapshotUrl(path), {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Openings data request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

export async function loadOpeningsCatalog({
  batchSize = 4,
  fetcher = fetch,
  onMetadata,
  onProgress,
  signal,
}: LoadOpeningsCatalogOptions = {}): Promise<OpeningsCatalog> {
  const safeBatchSize = Math.max(1, Math.min(8, Math.floor(batchSize)));
  const manifest = parseManifest(
    await fetchUnknown("api/manifest.json", fetcher, signal),
  );
  const [communities, status] = await Promise.all([
    fetchUnknown(manifest.files.communities, fetcher, signal).then(parseCommunities),
    fetchUnknown(manifest.files.status, fetcher, signal).then(parseCommunityStatus),
  ]);
  onMetadata?.({ communities, manifest, status });
  const byId = new Map<string, Opportunity>();
  let loadedPages = 0;

  for (let index = 0; index < manifest.pages.length; index += safeBatchSize) {
    const declaredPages = manifest.pages.slice(index, index + safeBatchSize);
    const pages = await Promise.all(
      declaredPages.map(async (declared) => {
        const page = parseOpportunityPage(
          await fetchUnknown(declared.file, fetcher, signal),
        );
        if (page.page !== declared.page || page.items.length !== declared.count) {
          throw new Error("Opportunity page does not match its manifest declaration");
        }
        return page;
      }),
    );
    pages.forEach((page) => page.items.forEach((item) => byId.set(item.id, item)));
    loadedPages += pages.length;
    onProgress?.({
      items: [...byId.values()],
      loadedPages,
      totalPages: manifest.pages.length,
    });
  }

  return {
    communities,
    manifest,
    opportunities: [...byId.values()],
    status,
  };
}
