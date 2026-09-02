import type { JobFilters } from "@/domain/openings/types";

export type DiscoveryShortcut =
  | "data-ai"
  | "devops"
  | "freshness-7"
  | "freshness-30"
  | "freshness-90"
  | "internship"
  | "new"
  | "react"
  | "remote"
  | "salary"
  | "saved";

export type ActiveJobFilterKind =
  | "area"
  | "author"
  | "country"
  | "employment"
  | "freshness"
  | "language"
  | "new"
  | "query"
  | "region"
  | "repository"
  | "salary"
  | "saved"
  | "seniority"
  | "sort"
  | "technology"
  | "technology-match"
  | "work-model";

export interface ActiveJobFilter {
  id: string;
  kind: ActiveJobFilterKind;
  value: string;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

export function toggleDiscoveryShortcut(
  filters: JobFilters,
  shortcut: DiscoveryShortcut,
): JobFilters {
  switch (shortcut) {
    case "remote":
      return { ...filters, workModels: toggleValue(filters.workModels, "remote") };
    case "internship":
      return { ...filters, seniority: toggleValue(filters.seniority, "internship") };
    case "react":
      return { ...filters, technologies: toggleValue(filters.technologies, "react") };
    case "data-ai":
      return { ...filters, areas: toggleValue(filters.areas, "data-ai") };
    case "devops":
      return { ...filters, areas: toggleValue(filters.areas, "devops-sre") };
    case "salary":
      return { ...filters, salaryOnly: !filters.salaryOnly };
    case "saved":
      return { ...filters, savedOnly: !filters.savedOnly };
    case "new":
      return { ...filters, newOnly: !filters.newOnly };
    case "freshness-7":
    case "freshness-30":
    case "freshness-90": {
      const days = Number(shortcut.replace("freshness-", ""));
      return {
        ...filters,
        freshnessDays: filters.freshnessDays === days ? null : days,
      };
    }
  }
}

export function countModalFilters(filters: JobFilters): number {
  return [
    filters.repository === "all" ? 0 : 1,
    filters.region === "all" ? 0 : 1,
    filters.authors.length,
    filters.workModels.length,
    filters.areas.length,
    filters.seniority.length,
    filters.employmentTypes.length,
    filters.languages.length,
    filters.technologyMatch === "all" && filters.technologies.length > 0 ? 1 : 0,
    filters.freshnessDays === null ? 0 : 1,
    filters.salaryOnly ? 1 : 0,
    filters.savedOnly ? 1 : 0,
    filters.newOnly ? 1 : 0,
  ].reduce((total, count) => total + count, 0);
}

function activeValues(
  kind: ActiveJobFilterKind,
  values: string[],
): ActiveJobFilter[] {
  return values.map((value) => ({
    id: `${kind}:${value}`,
    kind,
    value,
  }));
}

export function getActiveJobFilters(filters: JobFilters): ActiveJobFilter[] {
  return [
    ...(filters.query.trim()
      ? [{ id: `query:${filters.query.trim()}`, kind: "query" as const, value: filters.query.trim() }]
      : []),
    ...(filters.repository !== "all"
      ? [{ id: `repository:${filters.repository}`, kind: "repository" as const, value: filters.repository }]
      : []),
    ...(filters.region !== "all"
      ? [{ id: `region:${filters.region}`, kind: "region" as const, value: filters.region }]
      : []),
    ...(filters.country !== "all"
      ? [{ id: `country:${filters.country}`, kind: "country" as const, value: filters.country }]
      : []),
    ...activeValues("author", filters.authors),
    ...activeValues("work-model", filters.workModels),
    ...activeValues("area", filters.areas),
    ...activeValues("technology", filters.technologies),
    ...(filters.technologyMatch === "all" && filters.technologies.length > 0
      ? [{ id: "technology-match:all", kind: "technology-match" as const, value: "all" }]
      : []),
    ...activeValues("seniority", filters.seniority),
    ...activeValues("employment", filters.employmentTypes),
    ...activeValues("language", filters.languages),
    ...(filters.freshnessDays === null
      ? []
      : [{ id: `freshness:${filters.freshnessDays}`, kind: "freshness" as const, value: String(filters.freshnessDays) }]),
    ...(filters.salaryOnly
      ? [{ id: "salary:true", kind: "salary" as const, value: "true" }]
      : []),
    ...(filters.savedOnly
      ? [{ id: "saved:true", kind: "saved" as const, value: "true" }]
      : []),
    ...(filters.newOnly
      ? [{ id: "new:true", kind: "new" as const, value: "true" }]
      : []),
    ...(filters.sort !== "newest"
      ? [{ id: `sort:${filters.sort}`, kind: "sort" as const, value: filters.sort }]
      : []),
  ];
}

export function removeActiveJobFilter(
  filters: JobFilters,
  item: ActiveJobFilter,
): JobFilters {
  switch (item.kind) {
    case "query":
      return { ...filters, query: "" };
    case "repository":
      return { ...filters, repository: "all" };
    case "region":
      return { ...filters, region: "all" };
    case "country":
      return { ...filters, country: "all" };
    case "author":
      return { ...filters, authors: filters.authors.filter((value) => value !== item.value) };
    case "work-model":
      return { ...filters, workModels: filters.workModels.filter((value) => value !== item.value) };
    case "area":
      return { ...filters, areas: filters.areas.filter((value) => value !== item.value) };
    case "technology":
      return { ...filters, technologies: filters.technologies.filter((value) => value !== item.value) };
    case "technology-match":
      return { ...filters, technologyMatch: "any" };
    case "seniority":
      return { ...filters, seniority: filters.seniority.filter((value) => value !== item.value) };
    case "employment":
      return { ...filters, employmentTypes: filters.employmentTypes.filter((value) => value !== item.value) };
    case "language":
      return { ...filters, languages: filters.languages.filter((value) => value !== item.value) };
    case "freshness":
      return { ...filters, freshnessDays: null };
    case "salary":
      return { ...filters, salaryOnly: false };
    case "saved":
      return { ...filters, savedOnly: false };
    case "new":
      return { ...filters, newOnly: false };
    case "sort":
      return { ...filters, sort: "newest" };
  }
}
