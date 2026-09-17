import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(__dirname, "../../src");

function tsxFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry);

    if (statSync(entryPath).isDirectory()) return tsxFiles(entryPath);
    return entryPath.endsWith(".tsx") ? [entryPath] : [];
  });
}

describe("mobile spacing scale", () => {
  it("does not confuse the literal 4dp token with Tailwind's former 16dp spacing", () => {
    const ambiguousSpacing = /(?:^|\s)(?:m[trblxy]?|p[trblxy]?|gap)-4(?=\s|$)/g;
    const violations = tsxFiles(sourceRoot).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const matches = [...source.matchAll(/(?:contentContainerClassName|className)="([^"]*)"/g)];

      return matches.flatMap((match) => {
        const classes = match[1] ?? "";
        const offending = classes.match(ambiguousSpacing) ?? [];

        return offending.map((className) =>
          `${path.relative(sourceRoot, file)}: ${className.trim()}`,
        );
      });
    });

    expect(violations).toEqual([]);
  });
});
