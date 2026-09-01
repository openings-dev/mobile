import type {
  CommunitiesPayload,
  CommunityStatus,
  CommunityStatusPayload,
  Opportunity,
  OpportunityCommunity,
  OpportunityLocation,
  OpportunityPage,
  OpportunityPerson,
  OpportunitySalary,
  OpportunitySource,
  OpportunityTaxonomy,
  SnapshotManifest,
} from "./types";

export const SNAPSHOT_BASE_URL =
  "https://raw.githubusercontent.com/openings-dev/data-pipeline/main/snapshots/opportunities";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function hasOptionalString(record: Record<string, unknown>, key: string): boolean {
  return record[key] === undefined || isString(record[key]);
}

function hasOptionalNumber(record: Record<string, unknown>, key: string): boolean {
  return record[key] === undefined || isFiniteNumber(record[key]);
}

function isHttpsUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isPerson(value: unknown): value is OpportunityPerson {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.handle) &&
    (value.avatarUrl === null || isHttpsUrl(value.avatarUrl))
  );
}

function isCommunity(value: unknown): value is OpportunityCommunity {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    (value.avatarUrl === null || isHttpsUrl(value.avatarUrl)) &&
    isString(value.repository) &&
    isHttpsUrl(value.url)
  );
}

function isLocation(value: unknown): value is OpportunityLocation {
  if (!isRecord(value)) return false;
  const confidence = value.confidence;
  return (
    [
      "city",
      "country",
      "countryCode",
      "displayText",
      "region",
      "remoteScope",
      "subdivision",
      "workModel",
    ].every((key) => hasOptionalString(value, key)) &&
    (confidence === undefined || confidence === "explicit" || confidence === "unknown")
  );
}

function isTaxonomy(value: unknown): value is OpportunityTaxonomy {
  return (
    isRecord(value) &&
    isStringArray(value.areas) &&
    isStringArray(value.employmentTypes) &&
    isStringArray(value.languages) &&
    isStringArray(value.seniority) &&
    isStringArray(value.technologies) &&
    isStringArray(value.workModels)
  );
}

function isSalary(value: unknown): value is OpportunitySalary {
  return (
    isRecord(value) &&
    isString(value.currency) &&
    (value.period === "hour" || value.period === "month" || value.period === "year") &&
    hasOptionalNumber(value, "min") &&
    hasOptionalNumber(value, "max")
  );
}

function isSource(value: unknown): value is OpportunitySource {
  return (
    isRecord(value) &&
    isString(value.id) &&
    hasOptionalString(value, "sourceId") &&
    isString(value.repository) &&
    isHttpsUrl(value.repositoryUrl) &&
    isHttpsUrl(value.url) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isCommunity(value.community)
  );
}

function isFreshness(value: unknown): boolean {
  return (
    isRecord(value) &&
    isFiniteNumber(value.ageDays) &&
    isString(value.publishedAt) &&
    (value.status === "fresh" || value.status === "aging" || value.status === "stale")
  );
}

function isDataProvenance(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const allowed = new Set(["declared", "inferred", "unknown"]);
  return ["location", "salary", "seniority", "workModel"].every((key) =>
    allowed.has(value[key] as string),
  );
}

function isOpportunity(value: unknown): value is Opportunity {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    hasOptionalString(value, "sourceId") &&
    isString(value.title) &&
    isString(value.description) &&
    isString(value.excerpt) &&
    (value.issueState === "open" || value.issueState === "closed") &&
    isString(value.repository) &&
    isHttpsUrl(value.repositoryUrl) &&
    hasOptionalString(value, "region") &&
    hasOptionalString(value, "country") &&
    isStringArray(value.tags) &&
    (value.sourceTags === undefined || isStringArray(value.sourceTags)) &&
    (value.jobLocation === undefined || isLocation(value.jobLocation)) &&
    (value.taxonomy === undefined || isTaxonomy(value.taxonomy)) &&
    (value.freshness === undefined || isFreshness(value.freshness)) &&
    (value.dataProvenance === undefined || isDataProvenance(value.dataProvenance)) &&
    (value.sources === undefined ||
      (Array.isArray(value.sources) && value.sources.every(isSource))) &&
    (value.deduplication === undefined ||
      (isRecord(value.deduplication) &&
        isFiniteNumber(value.deduplication.sourceCount))) &&
    isPerson(value.author) &&
    isCommunity(value.community) &&
    hasOptionalString(value, "companyName") &&
    (value.salary === undefined || isSalary(value.salary)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isHttpsUrl(value.url) &&
    hasOptionalString(value, "sourceType")
  );
}

export function isSafeSnapshotPath(path: string): boolean {
  return (
    path.endsWith(".json") &&
    !path.startsWith("/") &&
    !path.includes("..") &&
    !path.includes("\\") &&
    !path.includes(":") &&
    !path.includes("?") &&
    !path.includes("#")
  );
}

export function buildSnapshotUrl(path: string): string {
  if (!isSafeSnapshotPath(path)) {
    throw new Error("Invalid snapshot path");
  }
  return `${SNAPSHOT_BASE_URL}/${path}`;
}

export function parseManifest(value: unknown): SnapshotManifest {
  if (!isRecord(value) || !isRecord(value.files) || !isRecord(value.totals)) {
    throw new Error("Invalid manifest payload");
  }
  const pages = value.pages;
  const validPages =
    Array.isArray(pages) &&
    pages.every(
      (page) =>
        isRecord(page) &&
        isFiniteNumber(page.page) &&
        isFiniteNumber(page.count) &&
        isString(page.file) &&
        isSafeSnapshotPath(page.file),
    );
  if (
    value.schemaVersion !== 6 ||
    !isString(value.dataHash) ||
    !isString(value.generatedAt) ||
    !isFiniteNumber(value.pageSize) ||
    !isString(value.files.communities) ||
    !isSafeSnapshotPath(value.files.communities) ||
    !isString(value.files.status) ||
    !isSafeSnapshotPath(value.files.status) ||
    !isFiniteNumber(value.totals.communities) ||
    !isFiniteNumber(value.totals.openOpportunities) ||
    !isFiniteNumber(value.totals.pages) ||
    !validPages
  ) {
    throw new Error("Invalid manifest payload");
  }
  return value as unknown as SnapshotManifest;
}

export function parseOpportunityPage(value: unknown): OpportunityPage {
  if (
    !isRecord(value) ||
    !isString(value.generatedAt) ||
    !isStringArray(value.ids) ||
    !Array.isArray(value.items) ||
    !value.items.every(isOpportunity) ||
    !(value.nextPage === null ||
      (isString(value.nextPage) && isSafeSnapshotPath(value.nextPage))) ||
    !isFiniteNumber(value.page) ||
    !isFiniteNumber(value.pageSize)
  ) {
    throw new Error("Invalid opportunity page payload");
  }
  return {
    generatedAt: value.generatedAt,
    ids: value.ids,
    items: value.items.map((item) => ({ ...item, sources: item.sources ?? [] })),
    nextPage: value.nextPage,
    page: value.page,
    pageSize: value.pageSize,
  };
}

export function parseCommunities(value: unknown): CommunitiesPayload {
  const validCommunity = (item: unknown): boolean =>
    isRecord(item) &&
    isString(item.repository) &&
    isHttpsUrl(item.repositoryUrl) &&
    isString(item.name) &&
    (item.avatarUrl === null || isHttpsUrl(item.avatarUrl)) &&
    isString(item.region) &&
    isString(item.country) &&
    isString(item.countryCode) &&
    isString(item.locale) &&
    isString(item.scope) &&
    isFiniteNumber(item.opportunitiesCount) &&
    isNullableString(item.lastPostedAt);
  if (
    !isRecord(value) ||
    !isString(value.generatedAt) ||
    !Array.isArray(value.items) ||
    !value.items.every(validCommunity)
  ) {
    throw new Error("Invalid communities payload");
  }
  return value as unknown as CommunitiesPayload;
}

function isCommunityStatus(value: unknown): value is CommunityStatus {
  return (
    isRecord(value) &&
    isString(value.repository) &&
    isHttpsUrl(value.repositoryUrl) &&
    isString(value.name) &&
    isString(value.country) &&
    isString(value.countryCode) &&
    isString(value.region) &&
    (value.state === "healthy" || value.state === "no-openings" || value.state === "error") &&
    isFiniteNumber(value.openOpportunities) &&
    isNullableString(value.lastSuccessfulSyncAt) &&
    isNullableString(value.lastPostedAt)
  );
}

export function parseCommunityStatus(value: unknown): CommunityStatusPayload {
  const totals = isRecord(value) && isRecord(value.totals) ? value.totals : null;
  if (
    !isRecord(value) ||
    !isString(value.generatedAt) ||
    !totals ||
    !["communities", "healthy", "noOpenings", "errors"].every((key) =>
      isFiniteNumber(totals[key]),
    ) ||
    !Array.isArray(value.items) ||
    !value.items.every(isCommunityStatus)
  ) {
    throw new Error("Invalid community status payload");
  }
  return value as unknown as CommunityStatusPayload;
}
