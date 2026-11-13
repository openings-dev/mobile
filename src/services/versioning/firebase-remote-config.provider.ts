import { Platform } from "react-native";

import type { AppVersionRule } from "./app-version-policy";

type RemoteConfigSdk = Pick<
  typeof import("@react-native-firebase/remote-config"),
  "fetchAndActivate" | "getRemoteConfig" | "getValue"
>;

type LoadRemoteConfigSdk = () => Promise<RemoteConfigSdk>;

export type AppVersionRuleResolution = {
  error?: Error;
  rule: AppVersionRule;
};

export const ANDROID_FORCE_UPDATE_ENABLED_KEY =
  "android_force_update_enabled";
export const ANDROID_MINIMUM_VERSION_CODE_KEY =
  "android_minimum_version_code";
export const IOS_FORCE_UPDATE_ENABLED_KEY = "ios_force_update_enabled";
export const IOS_MINIMUM_BUILD_NUMBER_KEY = "ios_minimum_build_number";
export const FIREBASE_FETCH_TIMEOUT_MS = 2_500;
export const FIREBASE_MINIMUM_FETCH_INTERVAL_MS = 12 * 60 * 60 * 1_000;

const DISABLED_RULE: AppVersionRule = {
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

  async resolveRule(): Promise<AppVersionRuleResolution> {
    if (Platform.OS !== "android" && Platform.OS !== "ios") {
      return { rule: DISABLED_RULE };
    }
    const enabledKey = Platform.OS === "ios"
      ? IOS_FORCE_UPDATE_ENABLED_KEY : ANDROID_FORCE_UPDATE_ENABLED_KEY;
    const minimumKey = Platform.OS === "ios"
      ? IOS_MINIMUM_BUILD_NUMBER_KEY : ANDROID_MINIMUM_VERSION_CODE_KEY;
    try {
      const sdk = await this.loadSdk();
      const remoteConfig = sdk.getRemoteConfig();
      remoteConfig.defaultConfig = {
        [enabledKey]: false,
        [minimumKey]: 0,
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
        enabledKey,
      );
      const minimum = sdk.getValue(
        remoteConfig,
        minimumKey,
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
