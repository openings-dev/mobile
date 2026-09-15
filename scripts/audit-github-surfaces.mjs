#!/usr/bin/env node
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const { auditGithubSurfaces } = require("./audit-github-surfaces.cjs");
const { resolveOutputPath } = require("./audit-public-readiness.cjs");

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const repository = argument("--repository");
const output = argument("--output");
if (!repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
  throw new Error("--repository owner/name is required");
}
if (!output) throw new Error("--output docs/security/<file> is required");

const destination = resolveOutputPath(output);
const report = await auditGithubSurfaces({ repository });
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`GitHub surface audit wrote ${path.relative(process.cwd(), destination)} (${report.clearance}).\n`);
if (report.clearance === "blocked") process.exitCode = 1;
