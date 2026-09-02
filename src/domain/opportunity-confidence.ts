import type { Opportunity } from "@/domain/openings/types";

export type OpportunityConfidenceFieldName =
  | "location"
  | "salary"
  | "seniority"
  | "workModel";
export type OpportunityConfidenceProvenance =
  | "declared"
  | "inferred"
  | "unknown";

export interface OpportunityConfidenceField {
  field: OpportunityConfidenceFieldName;
  provenance: OpportunityConfidenceProvenance;
}

export interface OpportunityConfidenceSummary {
  fields: OpportunityConfidenceField[];
  incomplete: boolean;
  lastVerifiedAt: string | null;
  sourceCount: number;
  stale: boolean;
}

interface VerificationStatus {
  items: {
    lastSuccessfulSyncAt: string | null;
    repository: string;
  }[];
}

const CONFIDENCE_FIELDS: OpportunityConfidenceFieldName[] = [
  "location",
  "salary",
  "seniority",
  "workModel",
];

function sourceRepositories(item: Opportunity): string[] {
  const repositories = item.sources.length > 0
    ? item.sources.map(({ repository }) => repository)
    : [item.repository];

  return [...new Set(repositories.filter(Boolean))];
}

function resolveLastVerifiedAt(
  repositories: string[],
  status?: VerificationStatus | null,
): string | null {
  if (!status || repositories.length === 0) return null;
  const verificationByRepository = new Map(
    status.items.map(({ lastSuccessfulSyncAt, repository }) => [
      repository,
      lastSuccessfulSyncAt,
    ]),
  );
  const timestamps = repositories.map((repository) =>
    verificationByRepository.get(repository));

  if (timestamps.some(
    (timestamp) => !timestamp || Number.isNaN(Date.parse(timestamp)),
  )) {
    return null;
  }

  return timestamps
    .map((timestamp) => timestamp as string)
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
}

export function buildOpportunityConfidence(
  item: Opportunity,
  status?: VerificationStatus | null,
): OpportunityConfidenceSummary {
  const fields = CONFIDENCE_FIELDS.map((field) => ({
    field,
    provenance: item.dataProvenance?.[field] ?? "unknown" as const,
  }));
  const stale = item.freshness?.status === "stale";
  const unknownCriticalField = fields.some(
    ({ field, provenance }) =>
      (field === "location" || field === "salary") &&
      provenance === "unknown",
  );

  return {
    fields,
    incomplete: stale && unknownCriticalField,
    lastVerifiedAt: resolveLastVerifiedAt(sourceRepositories(item), status),
    sourceCount: Math.max(
      1,
      item.sources.length,
      item.deduplication?.sourceCount ?? 0,
    ),
    stale,
  };
}
