import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface ExpoConfig {
  android?: {
    adaptiveIcon?: {
      backgroundColor?: string;
      foregroundImage?: string;
      monochromeImage?: string;
    };
    icon?: string;
  };
  icon?: string;
  ios?: {
    icon?: string;
    privacyManifests?: {
      NSPrivacyAccessedAPITypes?: {
        NSPrivacyAccessedAPIType: string;
        NSPrivacyAccessedAPITypeReasons: string[];
      }[];
      NSPrivacyCollectedDataTypes?: unknown[];
      NSPrivacyTracking?: boolean;
    };
  };
  plugins?: (string | [string, Record<string, unknown>])[];
}

function readExpoConfig(): ExpoConfig {
  const appJson = JSON.parse(
    readFileSync(join(process.cwd(), "app.json"), "utf8"),
  ) as { expo: ExpoConfig };

  return appJson.expo;
}

describe("native application identity", () => {
  it("configures canonical app, adaptive, monochrome, and splash artwork", () => {
    const expo = readExpoConfig();
    const expectedAssets = [
      "./assets/images/icon.png",
      "./assets/images/adaptive-icon.png",
      "./assets/images/monochrome-icon.png",
      "./assets/images/splash-icon.png",
      "./assets/images/splash-icon-dark.png",
    ];

    expect(expo.icon).toBe(expectedAssets[0]);
    expect(expo.ios?.icon).toBe(expectedAssets[0]);
    expect(expo.android?.icon).toBe(expectedAssets[0]);
    expect(expo.android?.adaptiveIcon).toEqual({
      backgroundColor: "#F5F3EF",
      foregroundImage: expectedAssets[1],
      monochromeImage: expectedAssets[2],
    });

    const splashPlugin = expo.plugins?.find(
      (plugin): plugin is [string, Record<string, unknown>] =>
        Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
    );

    expect(splashPlugin?.[1]).toEqual({
      backgroundColor: "#F5F3EF",
      dark: {
        backgroundColor: "#0D1211",
        image: expectedAssets[4],
      },
      image: expectedAssets[3],
      imageWidth: 180,
      resizeMode: "contain",
    });

    expectedAssets.forEach((assetPath) => {
      expect(existsSync(join(process.cwd(), assetPath))).toBe(true);
    });
  });

  it("keeps the iOS privacy manifest reproducible through Expo config", () => {
    const privacy = readExpoConfig().ios?.privacyManifests;

    expect(privacy).toEqual({
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType:
            "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
        {
          NSPrivacyAccessedAPIType:
            "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1"],
        },
        {
          NSPrivacyAccessedAPIType:
            "NSPrivacyAccessedAPICategorySystemBootTime",
          NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
        },
      ],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyTracking: false,
    });
  });
});
