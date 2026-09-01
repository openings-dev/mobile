import type { CommunitySummary, Opportunity } from "@/domain/openings/types";

export function makeOpportunity(
  id: string,
  overrides: Partial<Opportunity> = {},
): Opportunity {
  return {
    author: { avatarUrl: null, handle: "alice", id: "alice", name: "Alice" },
    community: {
      avatarUrl: null,
      id: "openings-dev",
      name: "Openings",
      repository: "openings-dev/jobs",
      url: "https://github.com/openings-dev/jobs",
    },
    createdAt: "2026-09-01T12:00:00Z",
    description: "Build the product natively.",
    excerpt: "Build the product natively.",
    id,
    issueState: "open",
    jobLocation: {
      country: "Brazil",
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
    title: "Senior React Native Engineer",
    updatedAt: "2026-09-01T12:30:00Z",
    url: `https://github.com/openings-dev/jobs/issues/${id}`,
    ...overrides,
  };
}

export function makeCommunity(
  repository: string,
  overrides: Partial<CommunitySummary> = {},
): CommunitySummary {
  const name = repository.split("/")[0] ?? repository;
  return {
    avatarUrl: null,
    country: "Brazil",
    countryCode: "BR",
    lastPostedAt: "2026-09-01T12:00:00Z",
    locale: "pt-BR",
    name,
    opportunitiesCount: 2,
    region: "South America",
    repository,
    repositoryUrl: `https://github.com/${repository}`,
    scope: "national",
    ...overrides,
  };
}
