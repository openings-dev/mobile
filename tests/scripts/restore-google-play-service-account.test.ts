import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SCRIPT_PATH = path.join(
  PROJECT_ROOT,
  "scripts/restore-google-play-service-account.mjs",
);

function temporaryDestination(): { directory: string; destination: string } {
  const directory = mkdtempSync(path.join(tmpdir(), "openings-play-"));

  return {
    directory,
    destination: path.join(directory, "credentials", "service-account.json"),
  };
}

describe("Google Play service-account restoration", () => {
  it("validates and writes normalized credentials with restricted permissions", () => {
    const { directory, destination } = temporaryDestination();
    const serviceAccount = {
      type: "service_account",
      project_id: "openings-mobile",
      client_email: "play-publisher@openings-mobile.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----\n",
      token_uri: "https://oauth2.googleapis.com/token",
    };

    try {
      const result = spawnSync(process.execPath, [SCRIPT_PATH, destination], {
        encoding: "utf8",
        env: {
          ...process.env,
          GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64: Buffer.from(
            JSON.stringify(serviceAccount),
          ).toString("base64"),
        },
      });

      expect(result.status).toBe(0);
      expect(JSON.parse(readFileSync(destination, "utf8"))).toEqual(
        serviceAccount,
      );
      expect(statSync(destination).mode & 0o777).toBe(0o600);
      expect(result.stdout).toContain("Google Play service account validated");
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("rejects an invalid service-account payload", () => {
    const { directory, destination } = temporaryDestination();

    try {
      const result = spawnSync(process.execPath, [SCRIPT_PATH, destination], {
        encoding: "utf8",
        env: {
          ...process.env,
          GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64:
            Buffer.from("not-json").toString("base64"),
        },
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "must contain a valid Google Play service account",
      );
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});
