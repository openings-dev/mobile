const fs = require("node:fs");
const path = require("node:path");
const plist = require("@expo/plist").default;
const xcode = require("xcode");
const { IOSConfig, withFinalizedMod, withInfoPlist } = require("@expo/config-plugins");

module.exports = function withIosRelease(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.CFBundleShortVersionString = "$(MARKETING_VERSION)";
    mod.modResults.CFBundleVersion = "$(CURRENT_PROJECT_VERSION)";
    return mod;
  });
  return withFinalizedMod(config, ["ios", (mod) => {
    // OneSignal adds its target in xcodeproj mods. Run after it so both targets
    // bind to the exact archive version/build and all generated references exist.
    const projectPath = IOSConfig.Paths.getPBXProjectPath(mod.modRequest.projectRoot);
    const project = xcode.project(projectPath);
    project.parseSync();
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const entry of Object.values(configurations)) {
      if (typeof entry !== "object" || !entry.buildSettings?.PRODUCT_BUNDLE_IDENTIFIER) continue;
      entry.buildSettings.MARKETING_VERSION = mod.version;
      entry.buildSettings.CURRENT_PROJECT_VERSION = mod.ios.buildNumber;
    }
    const references = project.pbxFileReferenceSection();
    for (const reference of Object.values(references)) {
      if (typeof reference !== "object") continue;
      for (const key of Object.keys(reference)) {
        if (reference[key] === undefined || reference[key] === "undefined") delete reference[key];
      }
    }
    const extensionPlist = path.join(mod.modRequest.platformProjectRoot,
      "OneSignalNotificationServiceExtension/OneSignalNotificationServiceExtension-Info.plist");
    const extension = plist.parse(fs.readFileSync(extensionPlist, "utf8"));
    extension.CFBundleShortVersionString = "$(MARKETING_VERSION)";
    extension.CFBundleVersion = "$(CURRENT_PROJECT_VERSION)";
    fs.writeFileSync(extensionPlist, plist.build(extension));
    fs.writeFileSync(projectPath, project.writeSync());
    return mod;
  }]);
};
