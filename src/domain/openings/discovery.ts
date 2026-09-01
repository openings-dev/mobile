import type {
  AuthorSummary,
  DirectoryFilters,
  JobFilters,
  Opportunity,
} from "./types";

export function normalizeDiscoveryText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

export function createDefaultJobFilters(): JobFilters {
  return {
    areas: [],
    authors: [],
    country: "all",
    employmentTypes: [],
    freshnessDays: null,
    languages: [],
    newOnly: false,
    query: "",
    region: "all",
    repository: "all",
    salaryOnly: false,
    savedOnly: false,
    seniority: [],
    sort: "newest",
    technologies: [],
    technologyMatch: "any",
    workModels: [],
  };
}

function intersects(selected: string[], values: string[]): boolean {
  return selected.length === 0 || selected.some((value) => values.includes(value));
}

function annualSalary(item: Opportunity): number {
  const value = item.salary?.max ?? item.salary?.min ?? 0;
  if (!item.salary) return 0;
  if (item.salary.period === "hour") return value * 2080;
  if (item.salary.period === "month") return value * 12;
  return value;
}

export function filterAndSortJobs(
  opportunities: Opportunity[],
  filters: JobFilters,
  local: {
    previousVisitAt?: string | null;
    savedIds?: ReadonlySet<string>;
    viewedIds?: ReadonlySet<string>;
  } = {},
): Opportunity[] {
  const query = normalizeDiscoveryText(filters.query);
  return opportunities
    .filter((item) => {
      if (item.issueState !== "open") return false;
      const taxonomy = item.taxonomy;
      const haystack = normalizeDiscoveryText(
        [
          item.title,
          item.excerpt,
          item.companyName,
          item.repository,
          item.community.name,
          item.author.name,
          item.author.handle,
          item.jobLocation?.displayText,
          ...item.tags,
          ...(taxonomy?.technologies ?? []),
        ]
          .filter(Boolean)
          .join(" "),
      );
      const sources = item.sources.map(({ repository }) => repository);
      const matchesRepository =
        filters.repository === "all" ||
        item.repository === filters.repository ||
        sources.includes(filters.repository);
      const technologies = taxonomy?.technologies ?? [];
      const matchesTechnologies =
        filters.technologies.length === 0 ||
        (filters.technologyMatch === "all"
          ? filters.technologies.every((technology) => technologies.includes(technology))
          : filters.technologies.some((technology) => technologies.includes(technology)));
      const publishedAt = Date.parse(item.createdAt);
      const freshnessAge = item.freshness?.ageDays ??
        Math.max(0, (Date.now() - publishedAt) / 86_400_000);
      return (
        (!query || haystack.includes(query)) &&
        matchesRepository &&
        (filters.region === "all" || item.jobLocation?.region === filters.region) &&
        (filters.country === "all" || item.jobLocation?.country === filters.country) &&
        intersects(filters.authors, [item.author.handle]) &&
        intersects(filters.workModels, taxonomy?.workModels ?? []) &&
        intersects(filters.areas, taxonomy?.areas ?? []) &&
        matchesTechnologies &&
        intersects(filters.seniority, taxonomy?.seniority ?? []) &&
        intersects(filters.employmentTypes, taxonomy?.employmentTypes ?? []) &&
        intersects(filters.languages, taxonomy?.languages ?? []) &&
        (filters.freshnessDays === null || freshnessAge <= filters.freshnessDays) &&
        (!filters.salaryOnly || Boolean(item.salary)) &&
        (!filters.savedOnly || Boolean(local.savedIds?.has(item.id))) &&
        (!filters.newOnly ||
          Boolean(
            local.previousVisitAt &&
              !local.viewedIds?.has(item.id) &&
              publishedAt > Date.parse(local.previousVisitAt),
          ))
      );
    })
    .sort((left, right) => {
      if (filters.sort === "oldest") {
        return Date.parse(left.createdAt) - Date.parse(right.createdAt);
      }
      if (filters.sort === "updated") {
        return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
      }
      if (filters.sort === "salary") {
        return annualSalary(right) - annualSalary(left);
      }
      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });
}

function mostFrequent(values: (string | undefined)[]): string | undefined {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => {
    const known = value as string;
    counts.set(known, (counts.get(known) ?? 0) + 1);
  });
  return [...counts.entries()].sort(
    ([left, leftCount], [right, rightCount]) =>
      rightCount - leftCount || left.localeCompare(right),
  )[0]?.[0];
}

export function deriveAuthors(opportunities: Opportunity[]): AuthorSummary[] {
  const groups = new Map<string, Opportunity[]>();
  opportunities.forEach((item) => {
    if (item.issueState !== "open") return;
    const handle = item.author.handle.trim().toLocaleLowerCase();
    if (!handle) return;
    groups.set(handle, [...(groups.get(handle) ?? []), item]);
  });

  return [...groups.entries()]
    .map(([handle, items]) => {
      const latest = [...items].sort(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
      )[0];
      return {
        avatarUrl: latest?.author.avatarUrl ?? null,
        country: mostFrequent(items.map((item) => item.jobLocation?.country)),
        handle,
        lastPostedAt: latest?.createdAt ?? null,
        name: latest?.author.name || handle,
        opportunitiesCount: items.length,
        region: mostFrequent(items.map((item) => item.jobLocation?.region)),
      };
    })
    .sort(
      (left, right) =>
        right.opportunitiesCount - left.opportunitiesCount ||
        left.handle.localeCompare(right.handle),
    );
}

export function filterAndSortDirectory<T extends {
  country?: string;
  lastPostedAt: string | null;
  opportunitiesCount: number;
  region?: string;
}>(
  items: T[],
  filters: DirectoryFilters,
  searchValues: (item: T) => string[],
  identity: (item: T) => string,
): T[] {
  const query = normalizeDiscoveryText(filters.query);
  return items
    .filter(
      (item) =>
        (filters.region === "all" || item.region === filters.region) &&
        (filters.country === "all" || item.country === filters.country) &&
        (!query ||
          normalizeDiscoveryText(searchValues(item).join(" ")).includes(query)),
    )
    .sort((left, right) => {
      if (filters.sort === "name") {
        return identity(left).localeCompare(identity(right));
      }
      if (filters.sort === "recent") {
        return Date.parse(right.lastPostedAt ?? "") - Date.parse(left.lastPostedAt ?? "");
      }
      return (
        right.opportunitiesCount - left.opportunitiesCount ||
        identity(left).localeCompare(identity(right))
      );
    });
}

function overlap(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return left.reduce((score, value) => score + (rightSet.has(value) ? 1 : 0), 0);
}

export function findSimilarJobs(
  selected: Opportunity,
  opportunities: Opportunity[],
  limit = 3,
): Opportunity[] {
  return opportunities
    .filter((item) => item.id !== selected.id && item.issueState === "open")
    .map((item) => ({
      item,
      score:
        overlap(selected.taxonomy?.technologies ?? [], item.taxonomy?.technologies ?? []) * 4 +
        overlap(selected.taxonomy?.areas ?? [], item.taxonomy?.areas ?? []) * 3 +
        overlap(selected.taxonomy?.workModels ?? [], item.taxonomy?.workModels ?? []) * 2 +
        overlap(selected.taxonomy?.seniority ?? [], item.taxonomy?.seniority ?? []) +
        (selected.repository === item.repository ? 2 : 0),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        Date.parse(right.item.createdAt) - Date.parse(left.item.createdAt),
    )
    .slice(0, limit)
    .map(({ item }) => item);
}
