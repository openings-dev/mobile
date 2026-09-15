import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
const read = (relativePath: string) => {
  const absolutePath = path.join(root, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
};

const publicClient = [
  "EXPO_PUBLIC_MIXPANEL_API_HOST",
  "EXPO_PUBLIC_MIXPANEL_TOKEN",
  "EXPO_PUBLIC_ONESIGNAL_APP_ID",
  "EXPO_PUBLIC_SENTRY_DSN",
  "EXPO_PUBLIC_SENTRY_ENVIRONMENT",
];
const privileged = [
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
  "ANDROID_KEYSTORE_BASE64",
  "ANDROID_STORE_PASSWORD",
  "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64",
  "GOOGLE_SERVICES_JSON_BASE64",
  "SENTRY_AUTH_TOKEN",
];

describe("configuration boundary", () => {
  const inventory = read("docs/security/configuration_inventory.md");
  const envExample = read(".env.example");
  const readme = read("README.md");
  const ci = read(".github/workflows/ci.yml");
  const internal = read(".github/workflows/android-internal.yml");

  it("classifies every public-client and privileged configuration name", () => {
    for (const name of [...publicClient, ...privileged]) expect(inventory).toContain(`\`${name}\``);
    expect(inventory).toContain("extractable from the installed application");
  });

  it("keeps public client inputs out of ordinary contributor CI", () => {
    for (const name of publicClient) {
      expect(envExample).toContain(name);
      expect(ci).not.toContain(name);
    }
    expect(readme).toContain("Public client configuration is not secret");
  });

  it("sources privileged workflow inputs only from GitHub secrets", () => {
    for (const name of privileged) {
      expect(internal).toContain(`${name}: \${{ secrets.${name} }}`);
      expect(internal).not.toContain(`${name}: \${{ vars.${name} }}`);
    }
  });

  it("always removes generated credentials and service configuration", () => {
    expect(internal).toContain("name: Remove generated credentials");
    expect(internal).toContain("if: always()");
    for (const generated of [
      "mobile/android/app/keystore.jks",
      "mobile/android/keystore.properties",
      "mobile/google-services.json",
      "mobile/android/app/google-services.json",
      "$RUNNER_TEMP/google-play-service-account.json",
    ]) expect(internal).toContain(generated);
  });
});
