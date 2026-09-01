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

describe("shared package integration", () => {
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
