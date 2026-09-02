import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

interface PackageManifest {
  dependencies?: Record<string, string>;
  packageManager?: string;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), path), "utf8")) as T;
}

function findFeatherImports(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findFeatherImports(path);
    if (!entry.name.endsWith(".tsx")) return [];
    return readFileSync(path, "utf8").includes("@expo/vector-icons/Feather")
      ? [path]
      : [];
  });
}

describe("native visual system", () => {
  it("uses the web icon language and deterministic UI fonts", () => {
    const packageJson = readJson<PackageManifest>("package.json");
    const appJson = readJson<{ expo: { plugins?: unknown[] } }>("app.json");
    const fontPlugin = appJson.expo.plugins?.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-font",
    );

    expect(packageJson.dependencies).toEqual(expect.objectContaining({
      "@expo-google-fonts/geist-mono": expect.any(String),
      "lucide-react-native": expect.any(String),
    }));
    expect(packageJson.packageManager).toBeUndefined();
    expect(JSON.stringify(fontPlugin)).toContain("Figtree_600SemiBold.ttf");
    expect(JSON.stringify(fontPlugin)).toContain("GeistMono_600SemiBold.ttf");
  });

  it("uses Lucide for every user-visible native interface icon", () => {
    expect(findFeatherImports(join(process.cwd(), "src"))).toEqual([]);
  });

  it("uses the web 16-pixel rem baseline for NativeWind sizing", () => {
    const metroConfig = readFileSync(join(process.cwd(), "metro.config.js"), "utf8");

    expect(metroConfig).toContain('inlineRem: 16');
  });
});
