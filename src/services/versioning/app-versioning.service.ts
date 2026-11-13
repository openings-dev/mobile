import * as Application from "expo-application";

import { parseBuildNumber, requiresAppUpdate } from "./app-version-policy";
import {
  FirebaseRemoteConfigProvider,
  type AppVersionRuleResolution,
} from "./firebase-remote-config.provider";

export interface AppVersionRuleProvider {
  resolveRule(): Promise<AppVersionRuleResolution>;
}

type InstalledBuildVersion = () => string | null;
type ProductionStatus = () => boolean;
type ErrorReporter = (error: Error) => void;

function reportVersioningError(error: Error): void {
  void import("@/services/telemetry")
    .then(({ captureTechnicalException }) => {
      captureTechnicalException(error, { category: "versioning" });
    })
    .catch(() => undefined);
}

export class AppVersioningService {
  constructor(
    private readonly provider: AppVersionRuleProvider =
      new FirebaseRemoteConfigProvider(),
    private readonly getInstalledBuildVersion: InstalledBuildVersion = () =>
      Application.nativeBuildVersion,
    private readonly isProduction: ProductionStatus = () => !__DEV__,
    private readonly reportError: ErrorReporter = reportVersioningError,
  ) {}

  async isUpdateRequired(): Promise<boolean> {
    if (!this.isProduction()) return false;

    try {
      const installedBuildVersion = this.getInstalledBuildVersion();
      const resolution = await this.provider.resolveRule();
      if (resolution.error) this.reportSafely(resolution.error);
      if (
        resolution.rule.enabled &&
        resolution.rule.source === "remote" &&
        parseBuildNumber(resolution.rule.minimumBuildNumber) === null
      ) {
        this.reportSafely(new Error("Invalid minimum app build number"));
      }
      return requiresAppUpdate(resolution.rule, installedBuildVersion);
    } catch (error) {
      this.reportSafely(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  private reportSafely(error: Error): void {
    try {
      this.reportError(error);
    } catch {
      // Diagnostics never change the fail-open policy.
    }
  }
}
