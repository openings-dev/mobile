import {
  DEFAULT_LOCALE,
  OPENINGS_FOUNDATION_VERSION,
  SUPPORTED_LOCALES,
} from "@openingshq/core";
import {
  colorPrimitives,
  darkRuntimeTheme,
  lightRuntimeTheme,
} from "@openingshq/design-tokens";
import { nativewindPreset } from "@openingshq/design-tokens/nativewind";
import { readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "../..");

describe("shared package integration", () => {
  it("installs both shared foundations from exact public releases", () => {
    const manifest = JSON.parse(readFileSync(path.join(projectRoot, "package.json"), "utf8"));
    const lockfile = readFileSync(path.join(projectRoot, "package-lock.json"), "utf8");
    const metro = readFileSync(path.join(projectRoot, "metro.config.js"), "utf8");
    const tsconfig = JSON.parse(readFileSync(path.join(projectRoot, "tsconfig.json"), "utf8"));

    expect(manifest.dependencies["@openingshq/core"]).toBe("0.1.0");
    expect(manifest.dependencies["@openingshq/design-tokens"]).toBe("0.1.0");
    expect(lockfile).not.toContain('"file:../core"');
    expect(lockfile).not.toContain('"file:../design-tokens"');
    expect(metro).not.toMatch(/watchFolders|\.\.\/core|\.\.\/design-tokens/);
    expect(tsconfig.compilerOptions.types).toContain("expo/types");
  });

  it("loads the public core contract through the local package boundary", () => {
    expect(OPENINGS_FOUNDATION_VERSION).toBe("0.1.0");
    expect(DEFAULT_LOCALE).toBe("en");
    expect(SUPPORTED_LOCALES).toHaveLength(6);
  });

  it("loads visual foundations and the NativeWind preset", () => {
    expect(colorPrimitives.brandMint).toBe("#B0EC9C");
    expect(lightRuntimeTheme.colors.canvas).toBe("#F5F3EF");
    expect(darkRuntimeTheme.colors.canvas).toBe("#0D1211");
    expect(nativewindPreset.theme.extend.spacing.touch).toBe(44);
  });
});
