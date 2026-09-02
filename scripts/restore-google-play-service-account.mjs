import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import path from "node:path";

const destination = process.argv[2];
const secret = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64;

if (!destination) {
  throw new Error("A destination path is required");
}

if (!secret) {
  throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64 is required");
}

function decodeBase64(value) {
  try {
    return Buffer.from(value.replace(/\s/g, ""), "base64").toString("utf8");
  } catch {
    return "";
  }
}

function parseServiceAccount(value) {
  try {
    const parsed = JSON.parse(value.replace(/^\uFEFF/, "").trim());
    const isValid =
      parsed?.type === "service_account" &&
      typeof parsed.project_id === "string" &&
      typeof parsed.client_email === "string" &&
      typeof parsed.private_key === "string" &&
      parsed.private_key.includes("BEGIN PRIVATE KEY") &&
      typeof parsed.token_uri === "string";

    return isValid ? parsed : null;
  } catch {
    return null;
  }
}

const candidates = [];
let candidate = secret;
for (let attempt = 0; attempt < 3; attempt += 1) {
  if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
  candidate = decodeBase64(candidate);
}

const serviceAccount = candidates
  .map(parseServiceAccount)
  .find((value) => value !== null);

if (!serviceAccount) {
  throw new Error(
    "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64 must contain a valid Google Play service account",
  );
}

await fs.mkdir(path.dirname(path.resolve(destination)), { recursive: true });
await fs.writeFile(destination, `${JSON.stringify(serviceAccount)}\n`, {
  mode: 0o600,
});

process.stdout.write("Google Play service account validated.\n");
