import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const makefile = readFileSync(path.join(PROJECT_ROOT, "Makefile"), "utf8");

describe("mobile Makefile", () => {
  it("describes Openings commands without inherited Troco fixtures", () => {
    expect(makefile).toContain("Openings Mobile commands");
    expect(makefile).not.toMatch(/troco/i);
    expect(makefile).not.toContain("SCREEN_FIXTURE_IDS");
  });

  it("maps the supported project workflows", () => {
    expect(makefile).toMatch(/^packages-build:/m);
    expect(makefile).toMatch(/^install:/m);
    expect(makefile).toMatch(/^start-localhost:/m);
    expect(makefile).toMatch(/^check:/m);
    expect(makefile).toMatch(/^prebuild:/m);
    expect(makefile).toMatch(/^ios-debug:/m);
    expect(makefile).toMatch(/^ios-build:/m);
    expect(makefile).toMatch(/^android-debug:/m);
    expect(makefile).toMatch(/^android-build:/m);
    expect(makefile).toMatch(/^fastlane-install:/m);
    expect(makefile).toMatch(/^android-release-check:/m);
    expect(makefile).toMatch(/^android-release-bundle:/m);
    expect(makefile).toMatch(/^android-release-internal:/m);
    expect(makefile).toMatch(/^android-release-production:/m);
    expect(makefile).toMatch(/^android-store-listing:/m);
    expect(makefile).toMatch(/^export:/m);
  });

  it("uses the installed CocoaPods CLI without downloading a transient runner", () => {
    expect(makefile).toContain("POD ?= pod");
    expect(makefile).toContain('cd "$(IOS_DIR)" && $(POD) install');
    expect(makefile).not.toContain("pod-install");
  });

  it("passes a portable Android SDK location to Gradle", () => {
    expect(makefile).toContain("ANDROID_SDK ?=");
    expect(makefile).toContain(
      'ANDROID_HOME="$(ANDROID_SDK)" ANDROID_SDK_ROOT="$(ANDROID_SDK)" ./gradlew',
    );
    expect(makefile).not.toContain("sdk.dir=/Users/");
  });

  it("renders a useful default help page", () => {
    const help = execFileSync("awk", [
      'BEGIN {FS = ":.*## "; printf "Openings Mobile commands:\\n\\n"} /^[a-zA-Z0-9_-]+:.*## / {printf "  %-20s %s\\n", $1, $2}',
      "Makefile",
    ], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    });

    expect(help).toContain("Openings Mobile commands");
    expect(help).toContain("packages-build");
    expect(help).toContain("ios-debug");
    expect(help).toContain("android-debug");
    expect(help).toContain("export");
  });
});
