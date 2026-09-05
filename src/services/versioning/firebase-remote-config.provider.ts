import type { AndroidVersionRule } from "./android-version-policy";

type RemoteConfigSdk = Pick<
  typeof import("@react-native-firebase/remote-config"),
  "fetchAndActivate" | "getRemoteConfig" | "getValue"
>;

type LoadRemoteConfigSdk = () => Promise<RemoteConfigSdk>;

export type AndroidVersionRuleResolution = {
  error?: Error;
  rule: AndroidVersionRule;
};

export const ANDROID_FORCE_UPDATE_ENABLED_KEY =
  "android_force_update_enabled";
export const ANDROID_MINIMUM_VERSION_CODE_KEY =
  "android_minimum_version_code";
export const FIREBASE_FETCH_TIMEOUT_MS = 2_500;
export const FIREBASE_MINIMUM_FETCH_INTERVAL_MS = 12 * 60 * 60 * 1_000;

const DISABLED_RULE: AndroidVersionRule = {
  enabled: false,
  minimumBuildNumber: 0,
  source: "static",
};

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

export class FirebaseRemoteConfigProvider {
  constructor(
    private readonly loadSdk: LoadRemoteConfigSdk = () =>
      import("@react-native-firebase/remote-config"),
  ) {}

  async resolveRule(): Promise<AndroidVersionRuleResolution> {
    try {
      const sdk = await this.loadSdk();
      const remoteConfig = sdk.getRemoteConfig();
      remoteConfig.defaultConfig = {
        [ANDROID_FORCE_UPDATE_ENABLED_KEY]: false,
        [ANDROID_MINIMUM_VERSION_CODE_KEY]: 0,
      };
      remoteConfig.settings = {
        fetchTimeoutMillis: FIREBASE_FETCH_TIMEOUT_MS,
        minimumFetchIntervalMillis: FIREBASE_MINIMUM_FETCH_INTERVAL_MS,
      };

      try {
        await sdk.fetchAndActivate(remoteConfig);
      } catch {
        // A previously activated rule remains readable while offline.
      }

      const enabled = sdk.getValue(
        remoteConfig,
        ANDROID_FORCE_UPDATE_ENABLED_KEY,
      );
      const minimum = sdk.getValue(
        remoteConfig,
        ANDROID_MINIMUM_VERSION_CODE_KEY,
      );
      const enabledSource = enabled.getSource();
      const minimumSource = minimum.getSource();
      const source =
        enabledSource === "remote" && minimumSource === "remote"
          ? "remote"
          : enabledSource === "default" && minimumSource === "default"
            ? "default"
            : "static";

      return {
        rule: {
          enabled: enabled.asBoolean(),
          minimumBuildNumber: minimum.asNumber(),
          source,
        },
      };
    } catch (error) {
      return { error: asError(error), rule: DISABLED_RULE };
    }
  }
}
