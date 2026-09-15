import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
const workflows = [
  ".github/workflows/ci.yml",
  ".github/workflows/android-internal.yml",
  ".github/workflows/android-production-release.yml",
];

function read(relativePath: string): string {
  const absolutePath = path.join(root, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

describe("public GitHub Actions boundary", () => {
  it("runs ordinary checks for pushes and pull requests without privileged context", () => {
    const ci = read(".github/workflows/ci.yml");
    expect(ci).toContain("pull_request:");
    expect(ci).toContain("push:");
    expect(ci).toContain("contents: read");
    expect(ci).not.toMatch(/pull_request_target|workflow_run|secrets\.|contents:\s*write|actions:\s*write/);
  });

  it("pins every external action to an immutable commit", () => {
    for (const workflow of workflows) {
      const contents = read(workflow);
      const references = [...contents.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)].map((match) => match[1]);
      expect(references.length).toBeGreaterThan(0);
      for (const reference of references) {
        if (reference?.startsWith("./")) continue;
        expect(reference).toMatch(/^[^/]+\/[^@]+@[a-f0-9]{40}$/);
      }
    }
  });
});
