import {
  createDefaultJobFilters,
  deriveAuthors,
  filterAndSortJobs,
  findSimilarJobs,
} from "@/domain/openings/discovery";
import type { Opportunity } from "@/domain/openings/types";

function makeOpportunity(
  id: string,
  overrides: Partial<Opportunity> = {},
): Opportunity {
  return {
    author: {
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      handle: "alice",
      id: "alice",
      name: "Alice",
    },
    community: {
      avatarUrl: "https://github.com/openings-dev.png?size=80",
      id: "openings-dev",
      name: "Openings",
      repository: "openings-dev/jobs",
      url: "https://github.com/openings-dev/jobs",
    },
    createdAt: "2026-09-01T12:00:00Z",
    description: "Native mobile product",
    excerpt: "Native mobile product",
    id,
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
    sources: [],
    tags: ["react-native", "typescript"],
    taxonomy: {
      areas: ["mobile"],
      employmentTypes: ["full-time"],
      languages: ["english"],
      seniority: ["senior"],
      technologies: ["react-native", "typescript"],
      workModels: ["remote"],
    },
    title: "Engenheiro React Native em São Paulo",
    updatedAt: "2026-09-01T12:30:00Z",
    url: `https://github.com/openings-dev/jobs/issues/${id}`,
    ...overrides,
  };
}

describe("mobile discovery", () => {
  it("filters jobs by normalized text and structured selections", () => {
    const mobile = makeOpportunity("1");
    const backend = makeOpportunity("2", {
      jobLocation: {
        country: "Portugal",
        displayText: "Lisboa · On-site",
        region: "Europe",
        workModel: "on-site",
      },
      taxonomy: {
        areas: ["backend"],
        employmentTypes: [],
        languages: [],
        seniority: ["mid"],
        technologies: ["java"],
        workModels: ["on-site"],
      },
      title: "Backend Java",
    });
    const filters = {
      ...createDefaultJobFilters(),
      country: "Brazil",
      query: "sao paulo",
      technologies: ["react-native"],
      workModels: ["remote"],
    };

    expect(filterAndSortJobs([backend, mobile], filters).map(({ id }) => id)).toEqual([
      "1",
    ]);
  });

  it("supports saved-only filtering and newest/oldest sorting", () => {
    const older = makeOpportunity("older", { createdAt: "2026-08-01T12:00:00Z" });
    const newer = makeOpportunity("newer", { createdAt: "2026-09-01T12:00:00Z" });
    const saved = new Set(["older", "newer"]);

    expect(
      filterAndSortJobs(
        [older, newer],
        { ...createDefaultJobFilters(), savedOnly: true, sort: "newest" },
        { savedIds: saved },
      ).map(({ id }) => id),
    ).toEqual(["newer", "older"]);
    expect(
      filterAndSortJobs(
        [older, newer],
        { ...createDefaultJobFilters(), savedOnly: true, sort: "oldest" },
        { savedIds: saved },
      ).map(({ id }) => id),
    ).toEqual(["older", "newer"]);
  });

  it("derives authors with counts, representative geography, and recency", () => {
    const items = [
      makeOpportunity("1"),
      makeOpportunity("2", { createdAt: "2026-08-20T12:00:00Z" }),
      makeOpportunity("3", {
        author: {
          avatarUrl: null,
          handle: "bob",
          id: "bob",
          name: "Bob",
        },
      }),
    ];

    expect(deriveAuthors(items)).toEqual([
      expect.objectContaining({ handle: "alice", opportunitiesCount: 2 }),
      expect.objectContaining({ handle: "bob", opportunitiesCount: 1 }),
    ]);
  });

  it("ranks similar jobs by taxonomy overlap and excludes the selected job", () => {
    const selected = makeOpportunity("selected");
    const close = makeOpportunity("close", { repository: "another/jobs" });
    const unrelated = makeOpportunity("unrelated", {
      repository: "else/jobs",
      tags: ["rust"],
      taxonomy: {
        areas: ["backend"],
        employmentTypes: [],
        languages: [],
        seniority: ["junior"],
        technologies: ["rust"],
        workModels: ["on-site"],
      },
    });

    expect(findSimilarJobs(selected, [unrelated, selected, close], 3).map(({ id }) => id)).toEqual([
      "close",
      "unrelated",
    ]);
  });
});
