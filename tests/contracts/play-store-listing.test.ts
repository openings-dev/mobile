import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const METADATA_ROOT = path.join(PROJECT_ROOT, "fastlane/metadata/android");
const LOCALES = ["de-DE", "en-US", "es-ES", "fr-FR", "it-IT", "pt-BR"];

function readMetadata(locale: string, filename: string): string {
  return readFileSync(path.join(METADATA_ROOT, locale, filename), "utf8").trim();
}

describe("Google Play store listing", () => {
  it.each(LOCALES)("provides complete, bounded copy for %s", (locale) => {
    const title = readMetadata(locale, "title.txt");
    const shortDescription = readMetadata(locale, "short_description.txt");
    const fullDescription = readMetadata(locale, "full_description.txt");
    const changelog = readMetadata(locale, "changelogs/1.txt");

    expect(title.length).toBeGreaterThan(0);
    expect(title.length).toBeLessThanOrEqual(30);
    expect(shortDescription.length).toBeGreaterThan(0);
    expect(shortDescription.length).toBeLessThanOrEqual(80);
    expect(fullDescription.length).toBeGreaterThan(0);
    expect(fullDescription.length).toBeLessThanOrEqual(4000);
    expect(changelog.length).toBeGreaterThan(0);
    expect(changelog.length).toBeLessThanOrEqual(500);
  });

  it.each(LOCALES)("provides six localized phone screenshots for %s", (locale) => {
    const directory = path.join(
      METADATA_ROOT,
      locale,
      "images/phoneScreenshots",
    );

    for (let index = 1; index <= 6; index += 1) {
      expect(existsSync(path.join(directory, `${index}.png`))).toBe(true);
    }
  });

  it("provides shared high-resolution icon and feature graphic", () => {
    expect(existsSync(path.join(METADATA_ROOT, "en-US/images/icon.png"))).toBe(true);
    expect(
      existsSync(path.join(METADATA_ROOT, "en-US/images/featureGraphic.png")),
    ).toBe(true);
  });
});
