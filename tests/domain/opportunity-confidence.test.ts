import { buildOpportunityConfidence } from "@/domain/opportunity-confidence";
import { makeOpportunity } from "../fixtures/openings";

describe("buildOpportunityConfidence", () => {
  it("preserves source provenance and verification facts without guessing", () => {
    const base = makeOpportunity("confidence");
    const source = {
      community: base.community,
      createdAt: base.createdAt,
      id: "second-source",
      repository: "backend-br/vagas",
      repositoryUrl: "https://github.com/backend-br/vagas",
      updatedAt: base.updatedAt,
      url: "https://github.com/backend-br/vagas/issues/12",
    };
    const summary = buildOpportunityConfidence(
      {
        ...base,
        dataProvenance: {
          location: "declared",
          salary: "unknown",
          seniority: "inferred",
          workModel: "declared",
        },
        freshness: {
          ageDays: 120,
          publishedAt: base.createdAt,
          status: "stale",
        },
        sources: [
          {
            ...source,
            id: "primary-source",
            repository: base.repository,
            repositoryUrl: base.repositoryUrl,
            url: base.url,
          },
          source,
        ],
      },
      {
        items: [
          {
            lastSuccessfulSyncAt: "2026-09-01T18:00:00Z",
            repository: base.repository,
          },
          {
            lastSuccessfulSyncAt: "2026-09-01T17:00:00Z",
            repository: source.repository,
          },
        ],
      },
    );

    expect(summary).toEqual({
      fields: [
        { field: "location", provenance: "declared" },
        { field: "salary", provenance: "unknown" },
        { field: "seniority", provenance: "inferred" },
        { field: "workModel", provenance: "declared" },
      ],
      incomplete: true,
      lastVerifiedAt: "2026-09-01T18:00:00Z",
      sourceCount: 2,
      stale: true,
    });
  });
});
