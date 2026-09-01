import {
  buildSnapshotUrl,
  parseCommunities,
  parseManifest,
  parseOpportunityPage,
} from "@/domain/openings/validation";

const person = {
  avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  handle: "alice",
  id: "alice",
  name: "Alice",
};

const community = {
  avatarUrl: "https://github.com/openings-dev.png?size=80",
  id: "openings-dev",
  name: "Openings",
  repository: "openings-dev/jobs",
  url: "https://github.com/openings-dev/jobs",
};

const opportunity = {
  author: person,
  community,
  createdAt: "2026-09-01T12:00:00Z",
  description: "Build a native product.",
  excerpt: "Build a native product.",
  id: "gh_123",
  issueState: "open",
  jobLocation: {
    country: "Brazil",
    countryCode: "BR",
    displayText: "São Paulo · Remote",
    region: "South America",
    workModel: "remote",
  },
  repository: "openings-dev/jobs",
  repositoryUrl: "https://github.com/openings-dev/jobs",
  sources: [
    {
      community,
      createdAt: "2026-09-01T12:00:00Z",
      id: "gh_123",
      repository: "openings-dev/jobs",
      repositoryUrl: "https://github.com/openings-dev/jobs",
      sourceId: "openings-dev/jobs#1",
      updatedAt: "2026-09-01T12:30:00Z",
      url: "https://github.com/openings-dev/jobs/issues/1",
    },
  ],
  tags: ["react-native"],
  taxonomy: {
    areas: ["mobile"],
    employmentTypes: ["full-time"],
    languages: ["english"],
    seniority: ["senior"],
    technologies: ["react-native"],
    workModels: ["remote"],
  },
  title: "Senior React Native Engineer",
  updatedAt: "2026-09-01T12:30:00Z",
  url: "https://github.com/openings-dev/jobs/issues/1",
};

describe("Openings public snapshot validation", () => {
  it("accepts a schema 6 manifest and rejects unsafe page paths", () => {
    const valid = parseManifest({
      dataHash: "hash",
      files: {
        communities: "api/communities.json",
        status: "api/status.json",
      },
      generatedAt: "2026-09-01T12:00:00Z",
      pageSize: 20,
      pages: [{ count: 1, file: "api/pages/page-0001.json", page: 1 }],
      schemaVersion: 6,
      totals: { communities: 1, openOpportunities: 1, pages: 1 },
    });

    expect(valid.pages[0]?.file).toBe("api/pages/page-0001.json");
    expect(() =>
      parseManifest({
        ...valid,
        pages: [{ count: 1, file: "https://evil.example/jobs.json", page: 1 }],
      }),
    ).toThrow("manifest");
  });

  it("validates opportunity pages and required nested identity data", () => {
    const page = parseOpportunityPage({
      generatedAt: "2026-09-01T12:00:00Z",
      ids: ["gh_123"],
      items: [opportunity],
      nextPage: "api/pages/page-0002.json",
      page: 1,
      pageSize: 20,
    });

    expect(page.items[0]?.author.handle).toBe("alice");
    expect(page.nextPage).toBe("api/pages/page-0002.json");
    expect(() =>
      parseOpportunityPage({ ...page, items: [{ ...opportunity, title: 12 }] }),
    ).toThrow("opportunity page");
  });

  it("validates community directory data", () => {
    const payload = parseCommunities({
      generatedAt: "2026-09-01T12:00:00Z",
      items: [
        {
          avatarUrl: community.avatarUrl,
          country: "Brazil",
          countryCode: "BR",
          lastPostedAt: "2026-09-01T12:00:00Z",
          locale: "pt-BR",
          name: "Openings",
          opportunitiesCount: 1,
          region: "South America",
          repository: "openings-dev/jobs",
          repositoryUrl: community.url,
          scope: "national",
        },
      ],
    });

    expect(payload.items).toHaveLength(1);
  });

  it("builds only relative JSON snapshot URLs", () => {
    expect(buildSnapshotUrl("api/manifest.json")).toBe(
      "https://raw.githubusercontent.com/openings-dev/data-pipeline/main/snapshots/opportunities/api/manifest.json",
    );
    expect(() => buildSnapshotUrl("../secrets.json")).toThrow("snapshot path");
    expect(() => buildSnapshotUrl("api/jobs.txt")).toThrow("snapshot path");
  });
});
