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
  const internalWorkflow = readProjectFile(
    ".github/workflows/android-internal.yml",
  );
  const productionWorkflow = readProjectFile(
    ".github/workflows/android-production-release.yml",
  );

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
    expect(fastfile).not.toMatch(/lane :store_listing/);
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
    expect(gitignore).toContain("android/keystore.properties");
    expect(gitignore).toContain("android/app/keystore.jks");
    expect(gitignore).toContain("google-play-service-account.json");
    expect(gitignore).toContain("fastlane/report.xml");
    expect(gitignore).toContain("*.aab");
    expect(gitignore).toContain("*.apk");
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

  it("does not import Troco-only release integrations", () => {
    const releaseFiles = [
      appfile,
      fastfile,
      internalWorkflow,
      productionWorkflow,
    ].join("\n");

    expect(releaseFiles).not.toMatch(/troco|admob|firebase|sentry/i);
  });
});
