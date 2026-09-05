import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const VERIFIER = path.join(PROJECT_ROOT, "scripts/verify-android-aab.mjs");

function fixture(options: { certificate?: string; versionCode?: string; versionName?: string } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), "openings-aab-"));
  const aab = path.join(directory, "app-release.aab");
  const bundletool = path.join(directory, "bundletool");
  const keytool = path.join(directory, "keytool");
  writeFileSync(aab, "signed bundle fixture");
  writeFileSync(bundletool, `#!/bin/sh\ncase "$*" in\n  *versionCode*) printf '%s\\n' '${options.versionCode ?? "42"}' ;;\n  *versionName*) printf '%s\\n' '${options.versionName ?? "1.2.3"}' ;;\n  *) exit 2 ;;\nesac\n`);
  writeFileSync(keytool, `#!/bin/sh\nprintf '%s\\n' 'Owner: CN=Openings' 'SHA256: ${options.certificate ?? "AA:BB:CC"}'\n`);
  chmodSync(bundletool, 0o755);
  chmodSync(keytool, 0o755);
  return { aab, bundletool, keytool };
}

function verify(files: ReturnType<typeof fixture>, overrides: Record<string, string> = {}) {
  return spawnSync(process.execPath, [VERIFIER, files.aab], {
    encoding: "utf8",
    env: {
      ...process.env,
      AAB_EXPECTED_CERT_SHA256: "AABBCC",
      ANDROID_VERSION_CODE: "42",
      ANDROID_VERSION_NAME: "1.2.3",
      BUNDLETOOL_COMMAND: files.bundletool,
      KEYTOOL_COMMAND: files.keytool,
      ...overrides,
    },
  });
}

describe("Android App Bundle verifier", () => {
  it("accepts the expected packaged version and signing certificate", () => {
    const result = verify(fixture());
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Android App Bundle verified");
  });

  it.each([
    ["version code", { versionCode: "41" }],
    ["version name", { versionName: "1.2.2" }],
    ["certificate", { certificate: "DD:EE:FF" }],
  ])("rejects a mismatched %s", (_label, options) => {
    const result = verify(fixture(options));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("verification failed");
    expect(result.stderr).not.toContain("AABBCC");
  });

  it("rejects a mismatched optional bundle digest", () => {
    const result = verify(fixture(), { AAB_EXPECTED_SHA256: "0".repeat(64) });
    expect(result.status).toBe(1);
  });

  it("fails closed when verification tooling is unavailable", () => {
    const result = verify(fixture(), { BUNDLETOOL_COMMAND: "/missing/bundletool" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("verification failed");
  });
});
