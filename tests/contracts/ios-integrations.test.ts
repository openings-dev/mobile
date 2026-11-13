import { execFileSync } from "node:child_process";

function runNode(script: string): unknown {
  return JSON.parse(execFileSync(process.execPath, ["-e", script], {
    cwd: process.cwd(),
    encoding: "utf8",
  }));
}

describe("iOS native integrations", () => {
  it("generates push, background notifications and the shared app group from the installed OneSignal plugin", () => {
    const result = runNode(`
      const { withPlugins } = require('@expo/config-plugins');
      const { expo } = require('./app.json');
      const config = withPlugins({ ...expo, _internal: { projectRoot: process.cwd() } }, [expo.plugins[0]]);
      Promise.all(['entitlements', 'infoPlist'].map(async name => {
        const result = await config.mods.ios[name]({
          ...config, modResults: {},
          modRequest: { platform: 'ios', modName: name, projectRoot: process.cwd() }
        });
        return [name, result.modResults];
      })).then(results => console.log(JSON.stringify(Object.fromEntries(results))));
    `);

    expect(result).toMatchObject({
      entitlements: {
        "aps-environment": "production",
        "com.apple.security.application-groups": ["group.dev.openings.mobile.onesignal"],
      },
      infoPlist: { UIBackgroundModes: expect.arrayContaining(["remote-notification"]) },
    });
  });

  it("uses dynamic Firebase SPM linkage without replacing other CocoaPods settings", () => {
    const result = runNode(`
      const plugin = require('./plugins/with-ios-firebase.cjs');
      const config = plugin({ name: 'Openings', slug: 'openings' });
      config.mods.ios.podfileProperties({
        modResults: { 'expo.jsEngine': 'hermes' },
        modRequest: { platform: 'ios', modName: 'podfileProperties' }
      }).then(result => console.log(JSON.stringify(result.modResults)));
    `);
    expect(result).toEqual({ "expo.jsEngine": "hermes", "ios.useFrameworks": "dynamic" });
  });

  it("preserves the Firebase source outside ios and copies it to the SPM symbol uploader path", () => {
    const result = runNode(`
      const fs = require('node:fs'); const path = require('node:path'); const os = require('node:os');
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'openings-firebase-mod-'));
      fs.mkdirSync(path.join(root, 'ios'));
      fs.writeFileSync(path.join(root, 'GoogleService-Info.plist'), 'isolated test fixture');
      const config = require('./plugins/with-ios-firebase.cjs')({
        name: 'Openings', slug: 'openings', ios: { googleServicesFile: './GoogleService-Info.plist' }
      });
      config.mods.ios.dangerous({ ...config, modRequest: {
        platform: 'ios', modName: 'dangerous', projectRoot: root, platformProjectRoot: path.join(root, 'ios')
      }}).then(() => {
        console.log(JSON.stringify({
          source: fs.readFileSync(path.join(root, 'GoogleService-Info.plist'), 'utf8'),
          destination: fs.readFileSync(path.join(root, 'ios/GoogleService-Info.plist'), 'utf8'),
          mode: fs.statSync(path.join(root, 'ios/GoogleService-Info.plist')).mode & 0o777
        }));
      }).finally(() => fs.rmSync(root, { recursive: true, force: true }));
    `);
    expect(result).toEqual({ source: "isolated test fixture", destination: "isolated test fixture", mode: 0o600 });
  });

  it("binds both native targets to the requested archive version and build", () => {
    const result = runNode(`
      const fs = require('node:fs'); const path = require('node:path'); const os = require('node:os');
      const plist = require('@expo/plist').default; const xcode = require('xcode');
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'openings-release-mod-'));
      const ios = path.join(root, 'ios');
      fs.mkdirSync(path.join(ios, 'Openings.xcodeproj'), { recursive: true });
      fs.mkdirSync(path.join(ios, 'OneSignalNotificationServiceExtension'));
      const projectPath = path.join(ios, 'Openings.xcodeproj/project.pbxproj');
      fs.copyFileSync('ios/Openings.xcodeproj/project.pbxproj', projectPath);
      const extensionPath = path.join(ios, 'OneSignalNotificationServiceExtension/OneSignalNotificationServiceExtension-Info.plist');
      fs.writeFileSync(extensionPath, plist.build({ CFBundleVersion: '1', CFBundleShortVersionString: '0.0.1' }));
      const config = require('./plugins/with-ios-release.cjs')({
        name: 'Openings', slug: 'openings', version: '0.1.1', ios: { buildNumber: '7' }
      });
      config.mods.ios.finalized({ ...config, modRequest: {
        platform: 'ios', modName: 'finalized', projectRoot: root, platformProjectRoot: ios
      }}).then(async () => {
        const project = xcode.project(projectPath); project.parseSync();
        const settings = Object.values(project.pbxXCBuildConfigurationSection())
          .filter(entry => typeof entry === 'object' && entry.buildSettings?.PRODUCT_BUNDLE_IDENTIFIER)
          .map(entry => entry.buildSettings);
        const info = await config.mods.ios.infoPlist({ ...config, modResults: {}, modRequest: { platform: 'ios', modName: 'infoPlist' } });
        console.log(JSON.stringify({ settings, extension: plist.parse(fs.readFileSync(extensionPath, 'utf8')), app: info.modResults }));
      }).finally(() => fs.rmSync(root, { recursive: true, force: true }));
    `) as { settings: unknown[]; extension: unknown; app: unknown };
    expect(result.settings).toHaveLength(4);
    for (const settings of result.settings) {
      expect(settings).toMatchObject({ MARKETING_VERSION: "0.1.1", CURRENT_PROJECT_VERSION: 7 });
    }
    const versions = { CFBundleShortVersionString: "$(MARKETING_VERSION)", CFBundleVersion: "$(CURRENT_PROJECT_VERSION)" };
    expect(result.extension).toMatchObject(versions);
    expect(result.app).toMatchObject(versions);
  });

  it("resolves every existing monitoring SDK for iOS, including the Crashlytics symbol upload phase", () => {
    const result = runNode(`
      const { execFileSync } = require('node:child_process');
      const { dirname, join } = require('node:path');
      const bin = join(dirname(require.resolve('expo-modules-autolinking/package.json')), 'bin/expo-modules-autolinking.js');
      const result = JSON.parse(execFileSync(process.execPath, [bin, 'react-native-config', '--platform', 'ios', '--json'], { encoding: 'utf8' }));
      console.log(JSON.stringify(result.dependencies));
    `);
    expect(result).toEqual(expect.objectContaining({
      "@react-native-firebase/app": expect.any(Object),
      "@react-native-firebase/analytics": expect.any(Object),
      "@react-native-firebase/remote-config": expect.any(Object),
      "@react-native-firebase/crashlytics": expect.objectContaining({
        platforms: { ios: expect.objectContaining({ scriptPhases: expect.arrayContaining([
          expect.objectContaining({ name: "[RNFB] Crashlytics Configuration", path: "./ios_config.sh" }),
        ]) }) },
      }),
      "@sentry/react-native": expect.any(Object),
      "react-native-onesignal": expect.any(Object),
      "mixpanel-react-native": expect.any(Object),
    }));
  });
});
