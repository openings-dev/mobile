import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

function fail() {
  console.error("Android App Bundle verification failed");
  process.exit(1);
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) fail();
  return value;
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0 || result.error) fail();
  return result.stdout.trim();
}

function normalizeFingerprint(value) {
  return value.replace(/[^0-9a-f]/gi, "").toUpperCase();
}

const aab = process.argv[2] ? path.resolve(process.argv[2]) : "";
if (!aab || !existsSync(aab)) fail();

const expectedVersionCode = required("ANDROID_VERSION_CODE");
const expectedVersionName = required("ANDROID_VERSION_NAME");
const expectedCertificate = normalizeFingerprint(required("AAB_EXPECTED_CERT_SHA256"));
if (!/^\d+$/.test(expectedVersionCode) || !expectedCertificate) fail();

const bundletoolCommand = process.env.BUNDLETOOL_COMMAND?.trim();
const bundletoolJar = process.env.BUNDLETOOL_JAR?.trim();
if (!bundletoolCommand && (!bundletoolJar || !existsSync(bundletoolJar))) fail();

function manifestValue(attribute) {
  const args = [
    "dump",
    "manifest",
    `--bundle=${aab}`,
    `--xpath=/manifest/@android:${attribute}`,
  ];
  return bundletoolCommand
    ? run(bundletoolCommand, args)
    : run("java", ["-jar", bundletoolJar, ...args]);
}

if (manifestValue("versionCode") !== expectedVersionCode) fail();
if (manifestValue("versionName") !== expectedVersionName) fail();

const keytoolOutput = run(process.env.KEYTOOL_COMMAND?.trim() || "keytool", [
  "-printcert",
  "-jarfile",
  aab,
]);
const certificateMatch = keytoolOutput.match(/SHA-?256:\s*([0-9A-F:]+)/i);
if (!certificateMatch || normalizeFingerprint(certificateMatch[1]) !== expectedCertificate) fail();

const digest = createHash("sha256").update(readFileSync(aab)).digest("hex");
const expectedDigest = process.env.AAB_EXPECTED_SHA256?.trim().toLowerCase();
if (expectedDigest && digest !== expectedDigest) fail();

console.log(`Android App Bundle verified (version ${expectedVersionName}, code ${expectedVersionCode}, sha256 ${digest})`);
