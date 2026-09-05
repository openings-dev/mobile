export type AndroidVersionRule = {
  enabled: boolean;
  minimumBuildNumber: number;
  source: "default" | "remote" | "static";
};

export function parseAndroidBuildNumber(
  value: string | number | null,
): number | null {
  if (value === null || value === "") return null;

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function requiresAndroidUpdate(
  rule: AndroidVersionRule,
  installedBuildVersion: string | null,
): boolean {
  if (!rule.enabled || rule.source !== "remote") return false;

  const installedBuildNumber = parseAndroidBuildNumber(installedBuildVersion);
  const minimumBuildNumber = parseAndroidBuildNumber(rule.minimumBuildNumber);
  if (installedBuildNumber === null || minimumBuildNumber === null) return false;

  return installedBuildNumber < minimumBuildNumber;
}
