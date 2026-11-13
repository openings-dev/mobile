const fs = require("node:fs");
const path = require("node:path");
const { withDangerousMod, withPodfileProperties } = require("@expo/config-plugins");

// RNFirebase 26.3.3 resolves Firebase through SPM on this RN version.
// Its installed integration rejects static linkage. Keep this reproducible
// through Expo prebuild without introducing another build dependency.
module.exports = function withIosFirebase(config) {
  config = withPodfileProperties(config, (mod) => {
    mod.modResults["ios.useFrameworks"] = "dynamic";
    return mod;
  });
  return withDangerousMod(config, ["ios", (mod) => {
    // Crashlytics' installed SPM uploader reads PROJECT_DIR/GoogleService-Info.plist.
    // The canonical file stays outside ios/ so native regeneration cannot erase it.
    const source = path.resolve(mod.modRequest.projectRoot, mod.ios.googleServicesFile);
    const destination = path.join(mod.modRequest.platformProjectRoot, "GoogleService-Info.plist");
    fs.copyFileSync(source, destination);
    fs.chmodSync(destination, 0o600);
    return mod;
  }]);
};
