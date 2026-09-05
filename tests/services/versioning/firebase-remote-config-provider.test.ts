import {
  ANDROID_FORCE_UPDATE_ENABLED_KEY,
  ANDROID_MINIMUM_VERSION_CODE_KEY,
  FIREBASE_FETCH_TIMEOUT_MS,
  FIREBASE_MINIMUM_FETCH_INTERVAL_MS,
  FirebaseRemoteConfigProvider,
} from "@/services/versioning/firebase-remote-config.provider";

type FakeValue = {
  asBoolean: () => boolean;
  asNumber: () => number;
  getSource: () => "default" | "remote" | "static";
};

function value({
  boolean = false,
  number = 0,
  source = "default",
}: {
  boolean?: boolean;
  number?: number;
  source?: "default" | "remote" | "static";
} = {}): FakeValue {
  return {
    asBoolean: () => boolean,
    asNumber: () => number,
    getSource: () => source,
  };
}

function createSdk({
  enabledValue = value(),
  fetchAndActivate = jest.fn().mockResolvedValue(true),
  minimumValue = value(),
}: {
  enabledValue?: FakeValue;
  fetchAndActivate?: jest.Mock;
  minimumValue?: FakeValue;
} = {}) {
  const remoteConfig = {
    defaultConfig: {} as Record<string, boolean | number | string>,
    settings: { fetchTimeoutMillis: 0, minimumFetchIntervalMillis: 0 },
  };
  const getValue = jest.fn((_config: unknown, key: string) =>
    key === ANDROID_FORCE_UPDATE_ENABLED_KEY ? enabledValue : minimumValue,
  );

  return {
    remoteConfig,
    sdk: {
      fetchAndActivate,
      getRemoteConfig: jest.fn(() => remoteConfig),
      getValue,
    },
  };
}

describe("FirebaseRemoteConfigProvider", () => {
  it("sets permissive defaults and bounded settings", async () => {
    const { remoteConfig, sdk } = createSdk();
    const provider = new FirebaseRemoteConfigProvider(async () => sdk as never);

    await provider.resolveRule();

    expect(remoteConfig.defaultConfig).toEqual({
      [ANDROID_FORCE_UPDATE_ENABLED_KEY]: false,
      [ANDROID_MINIMUM_VERSION_CODE_KEY]: 0,
    });
    expect(remoteConfig.settings).toEqual({
      fetchTimeoutMillis: FIREBASE_FETCH_TIMEOUT_MS,
      minimumFetchIntervalMillis: FIREBASE_MINIMUM_FETCH_INTERVAL_MS,
    });
  });

  it("returns an enabled rule only when both values are remote", async () => {
    const { sdk } = createSdk({
      enabledValue: value({ boolean: true, source: "remote" }),
      minimumValue: value({ number: 3, source: "remote" }),
    });

    await expect(
      new FirebaseRemoteConfigProvider(async () => sdk as never).resolveRule(),
    ).resolves.toEqual({
      rule: { enabled: true, minimumBuildNumber: 3, source: "remote" },
    });
  });

  it("treats mixed sources as static and therefore permissive", async () => {
    const { sdk } = createSdk({
      enabledValue: value({ boolean: true, source: "remote" }),
      minimumValue: value({ number: 3, source: "default" }),
    });

    await expect(
      new FirebaseRemoteConfigProvider(async () => sdk as never).resolveRule(),
    ).resolves.toEqual({
      rule: { enabled: true, minimumBuildNumber: 3, source: "static" },
    });
  });

  it("keeps activated values when the network fetch fails", async () => {
    const { sdk } = createSdk({
      enabledValue: value({ boolean: true, source: "remote" }),
      fetchAndActivate: jest.fn().mockRejectedValue(new Error("offline")),
      minimumValue: value({ number: 3, source: "remote" }),
    });

    await expect(
      new FirebaseRemoteConfigProvider(async () => sdk as never).resolveRule(),
    ).resolves.toEqual({
      rule: { enabled: true, minimumBuildNumber: 3, source: "remote" },
    });
  });

  it("fails open when the native module is unavailable", async () => {
    const provider = new FirebaseRemoteConfigProvider(async () => {
      throw new Error("unavailable");
    });

    await expect(provider.resolveRule()).resolves.toEqual({
      error: expect.any(Error),
      rule: { enabled: false, minimumBuildNumber: 0, source: "static" },
    });
  });
});
