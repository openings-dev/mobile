export type TelemetryFilterDimension =
  | "country"
  | "region"
  | "area"
  | "work-model"
  | "seniority"
  | "technology"
  | "employment-type"
  | "freshness"
  | "salary"
  | "community";

export interface TelemetryEventMap {
  "Search Submitted": { queryLength: "1-3" | "4-10" | "11-30" | "31+"; resultCount: "0" | "1-10" | "11-50" | "51+"; activeFilterCount: number; locale: string };
  "Filter Applied": { dimension: TelemetryFilterDimension; value: string; locale: string };
  "Discovery Shortcut Opened": { shortcut: string; locale: string };
  "Job Viewed": { jobId: string; age: "0-7" | "8-30" | "31-90" | "91+"; sourceCount: number };
  "Original Listing Opened": { jobId: string; sourceCount: number };
  "Job Saved": { jobId: string; savedCount: "0" | "1-5" | "6-20" | "21+" };
  "Community Viewed": { repository: string; activity: "active" | "no-openings" | "error" };
}

export type TelemetryEventName = keyof TelemetryEventMap;

export const TELEMETRY_EVENT_FIELDS = {
  "Community Viewed": ["repository", "activity"],
  "Discovery Shortcut Opened": ["shortcut", "locale"],
  "Filter Applied": ["dimension", "value", "locale"],
  "Job Saved": ["jobId", "savedCount"],
  "Job Viewed": ["jobId", "age", "sourceCount"],
  "Original Listing Opened": ["jobId", "sourceCount"],
  "Search Submitted": ["queryLength", "resultCount", "activeFilterCount", "locale"],
} as const satisfies {
  [Name in TelemetryEventName]: readonly (keyof TelemetryEventMap[Name])[];
};
