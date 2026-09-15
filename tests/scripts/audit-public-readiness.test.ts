import { createRequire } from "node:module";

type GitResult = { stdout: Buffer | string; status?: number };
const requireModule = createRequire(__filename);

function loadAudit() {
  return requireModule("../../scripts/audit-public-readiness.cjs");
}

describe("public repository audit", () => {
  it("reports coverage and fingerprints findings without exposing values", async () => {
    const { auditRepository } = loadAudit();
    const secret = "fixtureprivatevalue";
    const runGit = jest.fn(
      async (args: string[]): Promise<GitResult> => {
        const command = args.join(" ");
        if (command.startsWith("for-each-ref")) {
          return { stdout: "refs/heads/main\nrefs/tags/v0.1.0\n" };
        }
        if (command === "ls-files -z") {
          return { stdout: Buffer.from("src/index.ts\0") };
        }
        if (command === "lfs ls-files") return { stdout: "" };
        if (command === "submodule status") return { stdout: "" };
        if (command === "rev-list --objects --all") {
          return { stdout: "abc123 src/index.ts\n" };
        }
        if (command === "cat-file -t abc123") return { stdout: "blob\n" };
        if (command === "cat-file -s abc123") return { stdout: "80\n" };
        if (command === "cat-file blob abc123") {
          return {
            stdout: `const token = \"ghp_${secret.padEnd(36, "x")}\";`,
          };
        }
        throw new Error(`Unexpected git command: ${command}`);
      },
    );

    const report = await auditRepository({ runGit });
    const serialized = JSON.stringify(report);

    expect(report.coverage).toEqual(
      expect.objectContaining({
        heads: 1,
        tags: 1,
        trackedFiles: 1,
      }),
    );
    expect(serialized).not.toContain(secret);
    expect(report.findings[0]).toMatchObject({
      path: "src/index.ts",
      classification: "credential-pattern",
      disposition: "confirmed",
      fingerprint: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
  });

  it("classifies Firebase web keys as public client configuration", async () => {
    const { classifyMatch } = loadAudit();
    expect(classifyMatch("google-api-key", "AIza" + "a".repeat(35))).toBe(
      "public-client-config",
    );
  });

  it("recognizes the documented placeholder private key as a false positive", () => {
    const { classifyMatch } = loadAudit();
    expect(
      classifyMatch(
        "private-key",
        "-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----",
      ),
    ).toBe("false-positive");
  });

  it("rejects report destinations outside docs/security", async () => {
    const { resolveOutputPath } = loadAudit();
    expect(() => resolveOutputPath("../audit.md", "/repo")).toThrow(
      /docs\/security/,
    );
  });

  it("fails closed in the report when optional Git LFS inventory is unavailable", async () => {
    const { auditRepository } = loadAudit();
    const runGit = async (args: string[]): Promise<GitResult> => {
      const command = args.join(" ");
      if (command === "lfs ls-files") throw new Error("git lfs unavailable");
      if (command.startsWith("for-each-ref")) return { stdout: "refs/heads/main\n" };
      if (command === "ls-files -z") return { stdout: Buffer.from("README.md\0") };
      if (command === "submodule status" || command === "rev-list --objects --all") return { stdout: "" };
      throw new Error(`Unexpected git command: ${command}`);
    };

    const report = await auditRepository({ runGit });
    expect(report.coverage.lfs).toEqual({ status: "inaccessible", entries: null });
    expect(report.clearance).toBe("blocked");
  });

  it("skips non-blob objects returned by revision traversal", async () => {
    const { auditRepository } = loadAudit();
    const runGit = async (args: string[]): Promise<GitResult> => {
      const command = args.join(" ");
      if (command.startsWith("for-each-ref")) return { stdout: "refs/heads/main\n" };
      if (command === "ls-files -z" || command === "lfs ls-files" || command === "submodule status") return { stdout: "" };
      if (command === "rev-list --objects --all") return { stdout: "tree123 directory\n" };
      if (command === "cat-file -t tree123") return { stdout: "tree\n" };
      throw new Error(`Unexpected git command: ${command}`);
    };

    const report = await auditRepository({ runGit });
    expect(report.coverage.scannedBlobs).toBe(0);
    expect(report.findings).toEqual([]);
  });
});
