import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
const read = (relativePath: string) => {
  const absolutePath = path.join(root, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
};

describe("open-source readiness documentation", () => {
  const readme = read("README.md");
  const contributing = read("CONTRIBUTING.md");
  const security = read("SECURITY.md");
  const assets = read("docs/security/asset_inventory.md");
  const license = read("LICENSE");
  const manifest = JSON.parse(read("package.json"));

  it("documents a secret-free contributor path and official-release boundary", () => {
    expect(readme).toContain("npm ci");
    expect(readme).toContain("Forks cannot publish the official Openings app");
    expect(contributing).toContain("Never include secret values");
    expect(contributing).toContain("npm run check");
  });

  it("provides a private-reporting route without inventing a contact", () => {
    expect(security).toContain("Report a vulnerability");
    expect(security).not.toContain("security@example.invalid");
    expect(security).not.toMatch(/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  });

  it("classifies every redistributable asset family", () => {
    for (const assetFamily of [
      "assets/images/",
      "android/app/src/main/res/",
      "ios/Openings/Images.xcassets/",
      "fastlane/metadata/android",
      "Figtree",
      "Geist Mono",
    ]) expect(assets).toContain(assetFamily);
    expect(assets).toContain("owner-confirmed redistribution");
  });

  it("records the owner-selected source license separately from trademark rights", () => {
    expect(license).toContain("MIT License");
    expect(license).toContain("Openings contributors");
    expect(manifest.license).toBe("MIT");
    expect(assets).toContain("MIT source license does not authorize");
  });
});
