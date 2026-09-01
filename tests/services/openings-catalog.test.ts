import { isOfflineCatalogError, loadOpeningsCatalog } from "@/services/openings-catalog";

const manifest = {
  dataHash: "hash",
  files: {
    communities: "api/communities.json",
    status: "api/status.json",
  },
  generatedAt: "2026-09-01T12:00:00Z",
  pageSize: 1,
  pages: [
    { count: 1, file: "api/pages/page-0001.json", page: 1 },
    { count: 1, file: "api/pages/page-0002.json", page: 2 },
  ],
  schemaVersion: 6,
  totals: { communities: 0, openOpportunities: 2, pages: 2 },
};

function opportunity(id: string) {
  return {
    author: { avatarUrl: null, handle: "alice", id: "alice", name: "Alice" },
    community: {
      avatarUrl: null,
      id: "openings",
      name: "Openings",
      repository: "openings-dev/jobs",
      url: "https://github.com/openings-dev/jobs",
    },
    createdAt: "2026-09-01T12:00:00Z",
    description: "Description",
    excerpt: "Description",
    id,
    issueState: "open",
    repository: "openings-dev/jobs",
    repositoryUrl: "https://github.com/openings-dev/jobs",
    sources: [],
    tags: [],
    title: `Job ${id}`,
    updatedAt: "2026-09-01T12:00:00Z",
    url: `https://github.com/openings-dev/jobs/issues/${id}`,
  };
}

function response(body: unknown): Response {
  return { json: async () => body, ok: true, status: 200 } as Response;
}

describe("Openings catalog service", () => {
  it("distinguishes native network failures from data errors", () => {
    expect(isOfflineCatalogError(new TypeError("Network request failed"))).toBe(true);
    expect(isOfflineCatalogError(new Error("Invalid manifest payload"))).toBe(false);
  });

  it("loads declared pages in bounded batches and reports progressive data", async () => {
    let activePages = 0;
    let highestPageConcurrency = 0;
    const progress: { loadedPages: number; itemCount: number }[] = [];
    const metadata = jest.fn();
    const fetcher = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("api/manifest.json")) return response(manifest);
      if (url.endsWith("api/communities.json")) {
        return response({ generatedAt: manifest.generatedAt, items: [] });
      }
      if (url.endsWith("api/status.json")) {
        return response({
          generatedAt: manifest.generatedAt,
          items: [],
          totals: { communities: 0, errors: 0, healthy: 0, noOpenings: 0 },
        });
      }
      activePages += 1;
      highestPageConcurrency = Math.max(highestPageConcurrency, activePages);
      await Promise.resolve();
      activePages -= 1;
      const page = url.includes("0001") ? 1 : 2;
      const id = String(page);
      return response({
        generatedAt: manifest.generatedAt,
        ids: [id],
        items: [opportunity(id)],
        nextPage: page === 1 ? "api/pages/page-0002.json" : null,
        page,
        pageSize: 1,
      });
    });

    const catalog = await loadOpeningsCatalog({
      batchSize: 1,
      fetcher,
      onMetadata: metadata,
      onProgress: ({ items, loadedPages }) =>
        progress.push({ itemCount: items.length, loadedPages }),
    });

    expect(catalog.opportunities.map(({ id }) => id)).toEqual(["1", "2"]);
    expect(progress).toEqual([
      { itemCount: 1, loadedPages: 1 },
      { itemCount: 2, loadedPages: 2 },
    ]);
    expect(highestPageConcurrency).toBe(1);
    expect(metadata).toHaveBeenCalledWith(
      expect.objectContaining({ manifest: expect.objectContaining({ schemaVersion: 6 }) }),
    );
  });

  it("rejects HTTP failures instead of returning partial success", async () => {
    const fetcher = jest.fn(async () => ({ ok: false, status: 503 }) as Response);

    await expect(loadOpeningsCatalog({ fetcher })).rejects.toThrow("503");
  });
});
