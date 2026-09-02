import {
  buildOpportunityCardPresentation,
  formatVisibleResultRange,
  plainTextExcerpt,
} from "@/domain/openings/presentation";
import { makeOpportunity } from "../fixtures/openings";

describe("opportunity presentation", () => {
  it("turns noisy source Markdown into a compact readable excerpt", () => {
    expect(plainTextExcerpt(`
      ## About the role
      Build **native** experiences with [React Native](https://reactnative.dev).

      - Own the UI
      - Ship safely
    `)).toBe(
      "About the role Build native experiences with React Native. Own the UI Ship safely",
    );
  });

  it("orders structured card metadata and reports overflow without duplicates", () => {
    const item = makeOpportunity("presentation", {
      tags: ["remote", "typescript", "React Native", "product"],
      taxonomy: {
        areas: ["mobile"],
        employmentTypes: ["full-time"],
        languages: ["english"],
        seniority: ["senior"],
        technologies: ["react-native", "typescript"],
        workModels: ["remote"],
      },
    });

    expect(buildOpportunityCardPresentation(item, 3)).toEqual({
      overflowCount: 4,
      sourceCount: 0,
      supportingTags: [
        { category: "seniority", value: "senior" },
        { category: "technology", value: "react-native" },
        { category: "technology", value: "typescript" },
      ],
      workModel: "remote",
    });
  });

  it("uses the strongest available source count", () => {
    const source = {
      community: makeOpportunity("source").community,
      createdAt: "2026-09-01T12:00:00Z",
      id: "source-1",
      repository: "openings-dev/jobs",
      repositoryUrl: "https://github.com/openings-dev/jobs",
      updatedAt: "2026-09-01T12:30:00Z",
      url: "https://github.com/openings-dev/jobs/issues/1",
    };
    const item = makeOpportunity("sources", {
      deduplication: { sourceCount: 3 },
      sources: [source, { ...source, id: "source-2" }],
    });

    expect(buildOpportunityCardPresentation(item).sourceCount).toBe(3);
  });

  it("describes the visible range without inventing a first result", () => {
    expect(formatVisibleResultRange(20, 795)).toEqual({ end: 20, start: 1 });
    expect(formatVisibleResultRange(900, 795)).toEqual({ end: 795, start: 1 });
    expect(formatVisibleResultRange(0, 0)).toEqual({ end: 0, start: 0 });
  });
});
