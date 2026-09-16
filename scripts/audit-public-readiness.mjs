#!/usr/bin/env node
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const { auditRepository, resolveOutputPath } = require("./audit-public-readiness.cjs");

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function render(report) {
  const findings = report.findings.length
    ? report.findings.map((item) => `| ${item.path} | ${item.object} | ${item.pattern} | ${item.disposition} | ${item.fingerprint} |`).join("\n")
    : "| — | — | — | clear | — |";
  return `# Public Repository Audit\n\nGenerated: ${report.generatedAt}\n\nClearance: **${report.clearance}**\n\n## Coverage\n\n- Local heads: ${report.coverage.heads}\n- Remote refs: ${report.coverage.remotes}\n- Tags: ${report.coverage.tags}\n- Tracked files: ${report.coverage.trackedFiles}\n- Scanned historical blobs: ${report.coverage.scannedBlobs}\n- Large blobs skipped for manual review: ${report.coverage.skippedLargeBlobs}\n- Git LFS: ${report.coverage.lfs.status}${report.coverage.lfs.entries === null ? "" : ` (${report.coverage.lfs.entries} entries)`}\n- Submodules: ${report.coverage.submodules}\n\nScanned refs:\n\n${report.coverage.refs.map((ref) => `- \`${ref}\``).join("\n") || "- None"}\n\n## Remote surfaces\n\nStatus: **${report.remoteSurfaces.status}** — ${report.remoteSurfaces.reason}\n\n## Redacted findings\n\nMatched values are never written to this report. Fingerprints are one-way SHA-256 identifiers used for remediation tracking.\n\n| Path | Object | Pattern | Disposition | Fingerprint |\n| --- | --- | --- | --- | --- |\n${findings}\n`;
}

const output = argument("--output");
if (!output) throw new Error("--output docs/security/<file> is required");
const destination = resolveOutputPath(output);
const report = await auditRepository();
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, render(report), "utf8");
process.stdout.write(`Public-readiness audit wrote ${path.relative(process.cwd(), destination)} with ${report.findings.length} redacted finding(s).\n`);
if (report.clearance === "blocked") {
  process.exitCode = 1;
}
