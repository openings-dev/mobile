import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(__dirname, "../..");

function readProjectFile(relativePath: string): string {
  const filePath = path.join(PROJECT_ROOT, relativePath);

  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

describe("Android release automation", () => {
  const appfile = readProjectFile("fastlane/Appfile");
  const fastfile = readProjectFile("fastlane/Fastfile");
  const gemfile = readProjectFile("Gemfile");
  const gradle = readProjectFile("android/app/build.gradle");
  const gitignore = readProjectFile(".gitignore");
  const eslintConfig = readProjectFile("eslint.config.mjs");
  const internalWorkflow = readProjectFile(
    ".github/workflows/android-internal.yml",
  );
  const productionWorkflow = readProjectFile(
    ".github/workflows/android-production-release.yml",
  );
  const verifier = readProjectFile("scripts/verify-android-aab.mjs");

  it("pins Fastlane and the Openings Android application identifier", () => {
    expect(gemfile).toContain('gem "fastlane", "~> 2.228"');
    expect(appfile).toContain('package_name("dev.openings.mobile")');
    expect(fastfile).toContain('package_name: "dev.openings.mobile"');
  });

  it("defines verification, build, internal, and production lanes", () => {
    expect(fastfile).toMatch(/lane :check/);
    expect(fastfile).toMatch(/lane :build_debug/);
    expect(fastfile).toMatch(/lane :bundle_release/);
    expect(fastfile).toMatch(/lane :internal/);
    expect(fastfile).toMatch(/lane :upload_internal/);
    expect(fastfile).toMatch(/lane :production/);
    expect(fastfile).toMatch(/lane :sync_github_config/);
    expect(fastfile).toMatch(/lane :store_listing/);
    expect(fastfile).toContain("skip_upload_aab: true");
    expect(fastfile).toContain("skip_upload_apk: true");
    expect(fastfile).toContain("changes_not_sent_for_review: true");
  });

  it("keeps store-listing uploads separate from binary delivery", () => {
    const storeListingLane =
      fastfile.match(/lane :store_listing[\s\S]*?^  end$/m)?.[0] ?? "";
    const internalLane = fastfile.match(/lane :internal[\s\S]*?^  end$/m)?.[0] ?? "";
    const productionLane = fastfile.match(/lane :production[\s\S]*?^  end$/m)?.[0] ?? "";

    expect(storeListingLane).toContain("skip_upload_changelogs: true");
    expect(storeListingLane).toContain("version_code: version_code");
    expect(storeListingLane).toContain('track: "internal"');
    expect(internalLane).not.toContain("store_listing");
    expect(productionLane).not.toContain("store_listing");
  });

  it("injects mobile telemetry and Firebase config into release builds", () => {
    expect(internalWorkflow).toContain("EXPO_PUBLIC_SENTRY_DSN");
    expect(internalWorkflow).toContain("EXPO_PUBLIC_MIXPANEL_TOKEN");
    expect(internalWorkflow).toContain("EXPO_PUBLIC_ONESIGNAL_APP_ID");
    expect(internalWorkflow).toContain("SENTRY_AUTH_TOKEN");
    expect(internalWorkflow).toContain("GOOGLE_SERVICES_JSON_BASE64");
    expect(internalWorkflow).toContain("mobile/google-services.json");
  });

  it("syncs Android signing and Google Play credentials through Fastlane", () => {
    expect(fastfile).toContain('"ANDROID_KEY_ALIAS"');
    expect(fastfile).toContain('"ANDROID_KEY_PASSWORD"');
    expect(fastfile).toContain('"ANDROID_STORE_PASSWORD"');
    expect(fastfile).toContain('"ANDROID_KEYSTORE_BASE64"');
    expect(fastfile).toContain('"GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64"');
    expect(fastfile).toContain("Base64.strict_encode64(File.binread(release_keystore))");
    expect(fastfile).toContain("Base64.strict_encode64(File.binread(play_json_key))");
  });

  it("keeps release versions and signing explicit", () => {
    expect(gradle).toContain('System.getenv("ANDROID_VERSION_CODE")');
    expect(gradle).toContain('System.getenv("ANDROID_VERSION_NAME")');
    expect(gradle).toContain("if (hasReleaseSigning)");
    expect(gradle).toContain(
      'throw new GradleException("Release signing requires android/keystore.properties")',
    );
    expect(gradle).not.toMatch(
      /release\s*\{[^}]*signingConfig signingConfigs\.debug/,
    );
  });

  it("keeps all local Android release credentials and artifacts untracked", () => {
    expect(gitignore).toContain("docs/credentials/");
    expect(gitignore).toContain("android/keystore.properties");
    expect(gitignore).toContain("android/app/keystore.jks");
    expect(gitignore).toContain("google-play-service-account.json");
    expect(gitignore).toContain("fastlane/report.xml");
    expect(gitignore).toContain("*.aab");
    expect(gitignore).toContain("*.apk");
  });

  it("keeps installed Ruby dependencies outside the JavaScript lint boundary", () => {
    expect(eslintConfig).toContain('".bundle/**"');
    expect(eslintConfig).toContain('"vendor/bundle/**"');
  });

  it("preserves one internal artifact for explicit production promotion", () => {
    expect(internalWorkflow).toContain("Android internal release");
    expect(internalWorkflow).toContain(
      "openings-android-${{ inputs.version_code }}",
    );
    expect(internalWorkflow).toContain("bundle exec fastlane android upload_internal");
    expect(productionWorkflow).toContain("Android production release");
    expect(productionWorkflow).toContain(
      ".github/workflows/android-internal.yml",
    );
    expect(productionWorkflow).toContain(
      "bundle exec fastlane android production",
    );
  });

  it("keeps privileged releases manual and bound to trusted main revisions", () => {
    expect(internalWorkflow).toContain("workflow_dispatch:");
    expect(internalWorkflow).toContain("github.ref == 'refs/heads/main'");
    expect(productionWorkflow).toContain("workflow_dispatch:");
    expect(productionWorkflow).toContain('run.head_branch !== "main"');
    expect(productionWorkflow).toContain('run.event !== "workflow_dispatch"');
  });

  it("supports a draft production release while the Play app is unpublished", () => {
    const productionLane = fastfile.match(/lane :production[\s\S]*?^  end$/m)?.[0] ?? "";

    expect(productionLane).toContain('release_status = options[:release_status] || "completed"');
    expect(productionLane).toContain("track_promote_release_status: release_status");
    expect(productionWorkflow).toContain("default: draft");
    expect(productionWorkflow).toContain('release_status:${{ inputs.release_status }}');
  });

  it("verifies the exact signed bundle before archive, upload, and promotion", () => {
    expect(verifier).toContain("AAB_EXPECTED_CERT_SHA256");
    expect(verifier).toContain("ANDROID_VERSION_CODE");
    expect(verifier).toContain("ANDROID_VERSION_NAME");
    expect(verifier).toContain("AAB_EXPECTED_SHA256");
    expect(internalWorkflow.match(/node scripts\/verify-android-aab\.mjs/g)).toHaveLength(2);
    expect(productionWorkflow).toContain("node scripts/verify-android-aab.mjs");
    expect(internalWorkflow.indexOf("node scripts/verify-android-aab.mjs")).toBeLessThan(
      internalWorkflow.indexOf("actions/upload-artifact@"),
    );
    expect(productionWorkflow.indexOf("node scripts/verify-android-aab.mjs")).toBeLessThan(
      productionWorkflow.indexOf("fastlane android production"),
    );
  });

  it("does not import Troco-only release integrations", () => {
    const releaseFiles = [
      appfile,
      fastfile,
      internalWorkflow,
      productionWorkflow,
    ].join("\n");

    expect(releaseFiles).not.toMatch(/troco|admob/i);
  });
});
