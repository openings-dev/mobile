import * as Application from "expo-application";

import { parseAndroidBuildNumber, requiresAndroidUpdate } from "./android-version-policy";
import {
  FirebaseRemoteConfigProvider,
  type AndroidVersionRuleResolution,
} from "./firebase-remote-config.provider";

export interface AndroidVersionRuleProvider {
  resolveRule(): Promise<AndroidVersionRuleResolution>;
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

export class AndroidVersioningService {
  constructor(
    private readonly provider: AndroidVersionRuleProvider =
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
        parseAndroidBuildNumber(resolution.rule.minimumBuildNumber) === null
      ) {
        this.reportSafely(new Error("Invalid Android minimum version code"));
      }
      return requiresAndroidUpdate(resolution.rule, installedBuildVersion);
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
