import type { JobFilters } from "@/domain/openings/types";

const WEB_DISCOVERY_URL = "https://openings.dev/";

function setList(params: URLSearchParams, key: string, values: string[]): void {
  if (values.length > 0) params.set(key, values.join(","));
}

export function buildWebDiscoveryUrl(filters: JobFilters): string {
  const params = new URLSearchParams();

  if (filters.repository !== "all") params.set("repository", filters.repository);
  if (filters.region !== "all") params.set("region", filters.region);
  if (filters.country !== "all") params.set("country", filters.country);
  setList(params, "authors", filters.authors);
  setList(params, "workModels", filters.workModels);
  setList(params, "areas", filters.areas);
  setList(params, "technologies", filters.technologies);
  if (filters.technologyMatch === "all" && filters.technologies.length > 0) {
    params.set("technologyMatch", "all");
  }
  setList(params, "seniority", filters.seniority);
  setList(params, "employmentTypes", filters.employmentTypes);
  setList(params, "languages", filters.languages);
  if (filters.freshnessDays !== null) {
    params.set("freshness", String(filters.freshnessDays));
  }
  if (filters.salaryOnly) params.set("salary", "true");
  if (filters.query.trim()) params.set("search", filters.query.trim());
  if (filters.sort !== "newest") params.set("sort", filters.sort);

  const query = params.toString();
  return query ? `${WEB_DISCOVERY_URL}?${query}` : WEB_DISCOVERY_URL;
}
