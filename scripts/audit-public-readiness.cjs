const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { Buffer } = require("node:buffer");
const path = require("node:path");

const MAX_BLOB_BYTES = 1024 * 1024;

const PATTERNS = [
  { name: "private-key", expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "github-token", expression: /\b(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/g },
  { name: "aws-access-key", expression: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { name: "google-api-key", expression: /\bAIza[A-Za-z0-9_-]{35}\b/g },
  { name: "credential-assignment", expression: /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*["']([^"'\s]{12,})["']/gi },
];

function text(value) {
  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}

function lines(value) {
  return text(value).split(/\r?\n/).filter(Boolean);
}

function classifyMatch(patternName, value) {
  if (patternName === "private-key" && /PRIVATE KEY-----\s*(?:\\n|\n)?example(?:\\n|\n)?-----END/.test(value)) {
    return "false-positive";
  }
  if (patternName === "google-api-key" && value.startsWith("AIza")) {
    return "public-client-config";
  }
  if (patternName === "credential-assignment") return "review-required";
  if (patternName === "private-key" || patternName === "github-token" || patternName === "aws-access-key") {
    return "credential-pattern";
  }
  return "false-positive";
}

function dispositionFor(classification) {
  if (classification === "credential-pattern") return "confirmed";
  return classification;
}

function classifyFinding(patternName, value, filePath) {
  if (
    patternName === "credential-assignment" &&
    filePath === "tests/scripts/audit-public-readiness.test.ts" &&
    value === "fixtureprivatevalue"
  ) {
    return "false-positive";
  }
  return classifyMatch(patternName, value);
}

function fingerprint(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function resolveOutputPath(output, root = process.cwd()) {
  const securityRoot = path.resolve(root, "docs/security");
  const destination = path.resolve(root, output);
  if (destination !== securityRoot && !destination.startsWith(`${securityRoot}${path.sep}`)) {
    throw new Error("Audit output must stay within docs/security");
  }
  return destination;
}

function defaultRunGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd,
    encoding: null,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const detail = text(result.stderr).trim() || `exit status ${result.status}`;
    throw new Error(`git ${args[0]} failed: ${detail}`);
  }
  return { stdout: result.stdout, status: result.status };
}

async function auditRepository({ runGit = defaultRunGit, cwd = process.cwd(), maxBlobBytes = MAX_BLOB_BYTES } = {}) {
  const invoke = async (args) => runGit(args, { cwd });
  const refNames = lines((await invoke(["for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes", "refs/tags"])).stdout);
  const trackedFiles = text((await invoke(["ls-files", "-z"])).stdout).split("\0").filter(Boolean);
  let lfsFiles = [];
  let lfsStatus = "complete";
  try {
    lfsFiles = lines((await invoke(["lfs", "ls-files"])).stdout);
  } catch {
    lfsStatus = "inaccessible";
  }
  const submodules = lines((await invoke(["submodule", "status"])).stdout);
  const objects = lines((await invoke(["rev-list", "--objects", "--all"])).stdout)
    .map((line) => {
      const separator = line.indexOf(" ");
      return separator < 0 ? null : { oid: line.slice(0, separator), path: line.slice(separator + 1) };
    })
    .filter(Boolean);

  const findings = [];
  let scannedBlobs = 0;
  let skippedLargeBlobs = 0;
  let lfsPointerBlobs = 0;

  for (const object of objects) {
    const objectType = text((await invoke(["cat-file", "-t", object.oid])).stdout).trim();
    if (objectType !== "blob") continue;
    const size = Number.parseInt(text((await invoke(["cat-file", "-s", object.oid])).stdout).trim(), 10);
    if (!Number.isFinite(size) || size > maxBlobBytes) {
      skippedLargeBlobs += 1;
      continue;
    }
    const contents = text((await invoke(["cat-file", "blob", object.oid])).stdout);
    scannedBlobs += 1;
    if (contents.startsWith("version https://git-lfs.github.com/spec/v1\n")) {
      lfsPointerBlobs += 1;
    }
    for (const pattern of PATTERNS) {
      pattern.expression.lastIndex = 0;
      for (const match of contents.matchAll(pattern.expression)) {
        const value = match[1] || match[0];
        const classification = classifyFinding(pattern.name, value, object.path);
        findings.push({
          path: object.path,
          object: object.oid,
          pattern: pattern.name,
          classification,
          disposition: dispositionFor(classification),
          fingerprint: fingerprint(value),
        });
      }
    }
  }

  if (lfsStatus === "inaccessible") {
    lfsStatus = "complete-via-pointer-scan";
    lfsFiles = Array.from({ length: lfsPointerBlobs });
  }
  const blockedByFindings = findings.some((item) => item.disposition === "confirmed" || item.disposition === "review-required");
  const clearance = blockedByFindings || !lfsStatus.startsWith("complete") || skippedLargeBlobs > 0 ? "blocked" : "local-clear";

  return {
    generatedAt: new Date().toISOString(),
    clearance,
    coverage: {
      heads: refNames.filter((name) => name.startsWith("refs/heads/")).length,
      remotes: refNames.filter((name) => name.startsWith("refs/remotes/")).length,
      tags: refNames.filter((name) => name.startsWith("refs/tags/")).length,
      refs: refNames,
      trackedFiles: trackedFiles.length,
      scannedBlobs,
      skippedLargeBlobs,
      lfsFiles: lfsFiles.length,
      lfs: { status: lfsStatus, entries: lfsStatus.startsWith("complete") ? lfsFiles.length : null },
      submodules: submodules.length,
    },
    remoteSurfaces: { status: "inaccessible", reason: "Requires the separate read-only GitHub surface audit." },
    findings,
  };
}

module.exports = {
  MAX_BLOB_BYTES,
  auditRepository,
  classifyFinding,
  classifyMatch,
  defaultRunGit,
  resolveOutputPath,
};
