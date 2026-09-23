import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface PngImage {
  data: Uint8Array;
  height: number;
  width: number;
}

interface PngModule {
  PNG: {
    sync: {
      read(buffer: Buffer): PngImage;
    };
  };
}

const { PNG } = jest.requireActual<PngModule>("pngjs");

function getOpaqueBounds(imagePath: string): {
  height: number;
  width: number;
} {
  const image = PNG.sync.read(readFileSync(imagePath));
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.data[(y * image.width + x) * 4 + 3] ?? 0;

      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return {
    height: maxY - minY + 1,
    width: maxX - minX + 1,
  };
}

function expectNotificationIconOccupancy(imagePath: string): void {
  const image = PNG.sync.read(readFileSync(imagePath));
  const glyph = getOpaqueBounds(imagePath);

  expect(glyph.width / image.width).toBeGreaterThanOrEqual(0.75);
  expect(glyph.height / image.height).toBeGreaterThanOrEqual(0.55);
}

interface ExpoConfig {
  android?: {
    adaptiveIcon?: {
      backgroundColor?: string;
      foregroundImage?: string;
      monochromeImage?: string;
    };
    icon?: string;
    googleServicesFile?: string;
  };
  icon?: string;
  platforms?: string[];
  ios?: {
    entitlements?: Record<string, unknown>;
    infoPlist?: Record<string, unknown>;
    icon?: string;
    googleServicesFile?: string;
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
  it("uses the Expo SDK 57 patch baseline accepted by Expo Doctor", () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as { dependencies: Record<string, string> };

    expect(manifest.dependencies).toMatchObject({
      expo: "~57.0.24",
      "expo-application": "~57.0.3",
      "expo-constants": "~57.0.19",
      "expo-dev-client": "~57.0.19",
      "expo-font": "~57.0.4",
      "expo-linking": "~57.0.10",
      "expo-localization": "~57.0.2",
      "expo-router": "~57.0.22",
      "expo-splash-screen": "~57.0.9",
      "expo-system-ui": "~57.0.4",
    });
  });

  it("configures privacy-safe observability and OneSignal native plugins", () => {
    const expo = readExpoConfig();
    const pluginNames = expo.plugins?.map((plugin) =>
      Array.isArray(plugin) ? plugin[0] : plugin,
    );

    expect(pluginNames?.[0]).toBe("onesignal-expo-plugin");
    expect(pluginNames).toEqual(expect.arrayContaining([
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
      "@sentry/react-native/expo",
    ]));
    expect(expo.platforms).toEqual(["android"]);
    expect(expo.android?.googleServicesFile).toBe("./google-services.json");
    expect(expo.ios?.googleServicesFile).toBeUndefined();
    expect(expo.ios?.infoPlist).toBeUndefined();
    expect(expo.ios?.entitlements).toBeUndefined();

    const oneSignalPlugin = expo.plugins?.find(
      (plugin): plugin is [string, Record<string, unknown>] =>
        Array.isArray(plugin) && plugin[0] === "onesignal-expo-plugin",
    );
    expect(oneSignalPlugin?.[1]).toMatchObject({
      mode: "production",
      smallIconAccentColor: "#187A68",
      smallIcons: ["./assets/images/ic_stat_onesignal_default.png"],
    });
    const notificationIconPath = join(
      process.cwd(),
      "assets/images/ic_stat_onesignal_default.png",
    );

    expect(existsSync(notificationIconPath)).toBe(true);
    expectNotificationIconOccupancy(notificationIconPath);

    ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"].forEach((density) => {
      const nativeIconPath = join(
        process.cwd(),
        `android/app/src/main/res/drawable-${density}/ic_stat_onesignal_default.png`,
      );

      expect(existsSync(nativeIconPath)).toBe(true);
      expectNotificationIconOccupancy(nativeIconPath);
    });
  });

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
