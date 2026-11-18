export type AppVersionRule = {
  enabled: boolean;
  minimumBuildNumber: number;
  source: "default" | "remote" | "static";
};

export function parseBuildNumber(
  value: string | number | null,
): number | null {
  if (value === null || value === "") return null;

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function requiresAppUpdate(
  rule: AppVersionRule,
  installedBuildVersion: string | null,
): boolean {
  if (!rule.enabled || rule.source !== "remote") return false;

  const installedBuildNumber = parseBuildNumber(installedBuildVersion);
  const minimumBuildNumber = parseBuildNumber(rule.minimumBuildNumber);
  if (installedBuildNumber === null || minimumBuildNumber === null) return false;

  return installedBuildNumber < minimumBuildNumber;
}
