import type { Opportunity } from "./types";

export type OpportunityCardTagCategory =
  | "neutral"
  | "seniority"
  | "technology";

export interface OpportunityCardTag {
  category: OpportunityCardTagCategory;
  value: string;
}

export interface OpportunityCardPresentation {
  overflowCount: number;
  sourceCount: number;
  supportingTags: OpportunityCardTag[];
  workModel: string | null;
}

export interface VisibleResultRange {
  end: number;
  start: number;
}

function tagKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s_]+/g, "-");
}

export function plainTextExcerpt(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*```[^\n]*$/gm, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[ \t]*(?:#{1,6}|>|[-+*]|\d+[.)])[ \t]+/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildOpportunityCardPresentation(
  item: Opportunity,
  visibleTagLimit = 3,
): OpportunityCardPresentation {
  const workModel = item.taxonomy?.workModels[0]
    ?? item.jobLocation?.workModel
    ?? null;
  const workModelKey = workModel ? tagKey(workModel) : null;
  const seen = new Set<string>();
  const tags: OpportunityCardTag[] = [];
  const add = (values: string[], category: OpportunityCardTagCategory) => {
    values.forEach((value) => {
      const key = tagKey(value);

      if (!key || key === workModelKey || seen.has(key)) return;
      seen.add(key);
      tags.push({ category, value });
    });
  };

  add(item.taxonomy?.seniority ?? [], "seniority");
  add(item.taxonomy?.technologies ?? [], "technology");
  add(item.taxonomy?.employmentTypes ?? [], "neutral");
  add(item.taxonomy?.areas ?? [], "neutral");
  add(item.taxonomy?.languages ?? [], "neutral");
  add(item.tags, "neutral");

  const limit = Math.max(0, Math.trunc(visibleTagLimit));
  const supportingTags = tags.slice(0, limit);

  return {
    overflowCount: Math.max(0, tags.length - supportingTags.length),
    sourceCount: Math.max(
      item.sources.length,
      item.deduplication?.sourceCount ?? 0,
    ),
    supportingTags,
    workModel,
  };
}

export function formatVisibleResultRange(
  visibleCount: number,
  resultCount: number,
): VisibleResultRange {
  const total = Math.max(0, Math.trunc(resultCount));
  const end = Math.min(total, Math.max(0, Math.trunc(visibleCount)));

  return {
    end,
    start: end > 0 ? 1 : 0,
  };
}
