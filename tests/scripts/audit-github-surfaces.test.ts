import { createRequire } from "node:module";

const requireModule = createRequire(__filename);

function loadAudit() {
  return requireModule("../../scripts/audit-github-surfaces.cjs");
}

describe("GitHub surface audit", () => {
  it("keeps only allowlisted metadata from remote responses", async () => {
    const { auditGithubSurfaces } = loadAudit();
    const responses: Record<string, unknown> = {
      "repos/openings-dev/mobile": {
        full_name: "openings-dev/mobile",
        visibility: "private",
        default_branch: "main",
        private: true,
        secret_token: "must-not-leak",
      },
      "repos/openings-dev/mobile/branches": [{ name: "main", protected: true, commit: { sha: "abc" } }],
      "repos/openings-dev/mobile/tags": [],
      "repos/openings-dev/mobile/releases": [{ id: 1, tag_name: "v0.1.0", draft: false, prerelease: false, published_at: "2026-09-01T00:00:00Z", body: "discard me" }],
      "repos/openings-dev/mobile/actions/permissions": { enabled: true, allowed_actions: "selected", token: "discard" },
      "repos/openings-dev/mobile/actions/workflows": { workflows: [{ id: 2, name: "CI", path: ".github/workflows/ci.yml", state: "active", badge_url: "discard" }] },
      "repos/openings-dev/mobile/actions/artifacts": { artifacts: [{ id: 3, name: "apk", size_in_bytes: 42, expired: false, created_at: "2026-09-01T00:00:00Z", archive_download_url: "discard" }] },
      "repos/openings-dev/mobile/rulesets": [],
      "repos/openings-dev/mobile/environments": { environments: [{ id: 4, name: "production", protection_rules: [{ type: "wait_timer" }] }] },
      "repos/openings-dev/mobile/actions/secrets/public-key": { key_id: "kid", key: "discard" },
    };
    const request = jest.fn(async (endpoint: string) => responses[endpoint]);

    const result = await auditGithubSurfaces({ repository: "openings-dev/mobile", request });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      repository: { nameWithOwner: "openings-dev/mobile", visibility: "PRIVATE" },
      surfaces: expect.objectContaining({
        branches: expect.any(Array),
        releases: expect.any(Array),
        workflows: expect.any(Array),
        artifacts: expect.any(Array),
        rulesets: expect.any(Array),
      }),
    });
    expect(serialized).not.toMatch(/must-not-leak|discard me|archive_download_url|secret_token/);
    expect(result.metadata.actionsPublicKey).toEqual({ status: "accessible", keyId: "kid" });
  });

  it("blocks clearance when any remote endpoint is inaccessible", async () => {
    const { auditGithubSurfaces } = loadAudit();
    const request = async (endpoint: string) => {
      if (endpoint === "repos/openings-dev/mobile") return { full_name: "openings-dev/mobile", visibility: "private", default_branch: "main" };
      throw new Error("HTTP 403 with sensitive response body");
    };

    const result = await auditGithubSurfaces({ repository: "openings-dev/mobile", request });
    expect(result.clearance).toBe("blocked");
    expect(result.surfaces.branches).toEqual({ status: "inaccessible" });
    expect(JSON.stringify(result)).not.toContain("sensitive response body");
  });
});
