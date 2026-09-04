import { TELEMETRY_EVENT_FIELDS } from "@/services/telemetry/contracts";

it("defines only the seven approved mobile product events", () => {
  expect(TELEMETRY_EVENT_FIELDS).toEqual({
    "Community Viewed": ["repository", "activity"],
    "Discovery Shortcut Opened": ["shortcut", "locale"],
    "Filter Applied": ["dimension", "value", "locale"],
    "Job Saved": ["jobId", "savedCount"],
    "Job Viewed": ["jobId", "age", "sourceCount"],
    "Original Listing Opened": ["jobId", "sourceCount"],
    "Search Submitted": ["queryLength", "resultCount", "activeFilterCount", "locale"],
  });
});
