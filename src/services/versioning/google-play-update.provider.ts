import { Platform } from "react-native";

type InAppUpdateSdk = Pick<
  typeof import("expo-in-app-updates"),
  "checkForUpdate" | "startUpdate"
>;
type LoadInAppUpdateSdk = () => Promise<InAppUpdateSdk>;
type PlatformName = () => string;
type ProductionStatus = () => boolean;
type ErrorReporter = (error: Error) => void;

export type GooglePlayUpdateAvailability = {
  available: boolean;
  flexibleAllowed: boolean;
  immediateAllowed: boolean;
  storeVersion: string | null;
  updateInProgress: boolean;
};

const NO_UPDATE: GooglePlayUpdateAvailability = {
  available: false,
  flexibleAllowed: false,
  immediateAllowed: false,
  storeVersion: null,
  updateInProgress: false,
};

function reportVersioningError(error: Error): void {
  void import("@/services/telemetry")
    .then(({ captureTechnicalException }) => {
      captureTechnicalException(error, { category: "versioning" });
    })
    .catch(() => undefined);
}

export class GooglePlayUpdateProvider {
  constructor(
    private readonly loadSdk: LoadInAppUpdateSdk = () =>
      import("expo-in-app-updates"),
    private readonly getPlatform: PlatformName = () => Platform.OS,
    private readonly isProduction: ProductionStatus = () => !__DEV__,
    private readonly reportError: ErrorReporter = reportVersioningError,
  ) {}

  async checkAvailability(): Promise<GooglePlayUpdateAvailability> {
    if (!this.isSupportedRuntime()) return NO_UPDATE;

    try {
      const sdk = await this.loadSdk();
      const result = await sdk.checkForUpdate();
      return {
        available: result.updateAvailable,
        flexibleAllowed: result.flexibleAllowed === true,
        immediateAllowed: result.immediateAllowed === true,
        storeVersion: result.storeVersion || null,
        updateInProgress: result.updateInProgress === true,
      };
    } catch (error) {
      this.reportSafely(error);
      return NO_UPDATE;
    }
  }

  async startImmediateUpdate(): Promise<boolean> {
    return this.startUpdate("immediate");
  }

  async startFlexibleUpdate(): Promise<boolean> {
    return this.startUpdate("flexible");
  }

  private isSupportedRuntime(): boolean {
    return this.getPlatform() === "android" && this.isProduction();
  }

  private async startUpdate(mode: "flexible" | "immediate"): Promise<boolean> {
    if (!this.isSupportedRuntime()) return false;

    try {
      const sdk = await this.loadSdk();
      const availability = await sdk.checkForUpdate();
      const allowed =
        availability.updateInProgress === true ||
        (availability.updateAvailable &&
          (mode === "immediate"
            ? availability.immediateAllowed === true
            : availability.flexibleAllowed === true));
      if (!allowed) return false;
      return await sdk.startUpdate(mode === "immediate");
    } catch (error) {
      this.reportSafely(error);
      return false;
    }
  }

  private reportSafely(error: unknown): void {
    try {
      this.reportError(error instanceof Error ? error : new Error(String(error)));
    } catch {
      // Diagnostics never interfere with update recovery.
    }
  }
}
