export interface OpportunityPerson {
  avatarUrl: string | null;
  handle: string;
  id: string;
  name: string;
}

export interface OpportunityCommunity {
  avatarUrl: string | null;
  id: string;
  name: string;
  repository: string;
  url: string;
}

export interface OpportunityLocation {
  city?: string;
  confidence?: "explicit" | "unknown";
  country?: string;
  countryCode?: string;
  displayText?: string;
  region?: string;
  remoteScope?: string;
  subdivision?: string;
  workModel?: string;
}

export interface OpportunityTaxonomy {
  areas: string[];
  employmentTypes: string[];
  languages: string[];
  seniority: string[];
  technologies: string[];
  workModels: string[];
}

export interface OpportunitySalary {
  currency: string;
  max?: number;
  min?: number;
  period: "hour" | "month" | "year";
}

export interface OpportunitySource {
  community: OpportunityCommunity;
  createdAt: string;
  id: string;
  repository: string;
  repositoryUrl: string;
  sourceId?: string;
  updatedAt: string;
  url: string;
}

export interface Opportunity {
  author: OpportunityPerson;
  community: OpportunityCommunity;
  companyName?: string;
  country?: string;
  createdAt: string;
  dataProvenance?: {
    location: "declared" | "inferred" | "unknown";
    salary: "declared" | "inferred" | "unknown";
    seniority: "declared" | "inferred" | "unknown";
    workModel: "declared" | "inferred" | "unknown";
  };
  deduplication?: { sourceCount: number };
  description: string;
  excerpt: string;
  freshness?: {
    ageDays: number;
    publishedAt: string;
    status: "fresh" | "aging" | "stale";
  };
  id: string;
  issueState: "open" | "closed";
  jobLocation?: OpportunityLocation;
  region?: string;
  repository: string;
  repositoryUrl: string;
  salary?: OpportunitySalary;
  sourceId?: string;
  sources: OpportunitySource[];
  sourceTags?: string[];
  sourceType?: string;
  tags: string[];
  taxonomy?: OpportunityTaxonomy;
  title: string;
  updatedAt: string;
  url: string;
}

export interface SnapshotManifest {
  dataHash: string;
  files: {
    communities: string;
    status: string;
  };
  generatedAt: string;
  pageSize: number;
  pages: { count: number; file: string; page: number }[];
  schemaVersion: 6;
  totals: {
    communities: number;
    openOpportunities: number;
    pages: number;
  };
}

export interface OpportunityPage {
  generatedAt: string;
  ids: string[];
  items: Opportunity[];
  nextPage: string | null;
  page: number;
  pageSize: number;
}

export interface CommunitySummary {
  avatarUrl: string | null;
  country: string;
  countryCode: string;
  lastPostedAt: string | null;
  locale: string;
  name: string;
  opportunitiesCount: number;
  region: string;
  repository: string;
  repositoryUrl: string;
  scope: string;
}

export interface CommunitiesPayload {
  generatedAt: string;
  items: CommunitySummary[];
}

export type CommunityActivity = "healthy" | "no-openings" | "error";

export interface CommunityStatus {
  country: string;
  countryCode: string;
  lastPostedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  name: string;
  openOpportunities: number;
  region: string;
  repository: string;
  repositoryUrl: string;
  state: CommunityActivity;
}

export interface CommunityStatusPayload {
  generatedAt: string;
  items: CommunityStatus[];
  totals: {
    communities: number;
    errors: number;
    healthy: number;
    noOpenings: number;
  };
}

export interface AuthorSummary {
  avatarUrl: string | null;
  country?: string;
  handle: string;
  lastPostedAt: string | null;
  name: string;
  opportunitiesCount: number;
  region?: string;
}

export type JobSort = "newest" | "oldest" | "updated" | "salary";

export interface JobFilters {
  areas: string[];
  authors: string[];
  country: string;
  employmentTypes: string[];
  freshnessDays: number | null;
  languages: string[];
  newOnly: boolean;
  query: string;
  region: string;
  repository: string;
  salaryOnly: boolean;
  savedOnly: boolean;
  seniority: string[];
  sort: JobSort;
  technologies: string[];
  technologyMatch: "any" | "all";
  workModels: string[];
}

export type DirectorySort = "count" | "recent" | "name";

export interface DirectoryFilters {
  country: string;
  query: string;
  region: string;
  sort: DirectorySort;
}
