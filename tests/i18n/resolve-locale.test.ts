import * as resolverModule from "@/i18n/resolve-locale";

const contract = resolverModule as Record<string, unknown>;

describe("resolveLocale", () => {
  it("preserves an exact supported locale", () => {
    const resolveLocale = contract.resolveLocale as (
      languageTags: readonly string[],
    ) => string;

    expect(resolveLocale(["fr"])).toBe("fr");
  });

  it("normalizes Portuguese variants to Brazilian Portuguese", () => {
    const resolveLocale = contract.resolveLocale as (
      languageTags: readonly string[],
    ) => string;

    expect(resolveLocale(["pt-PT"])).toBe("pt-BR");
    expect(resolveLocale(["pt"])).toBe("pt-BR");
  });

  it("matches supported base languages and falls back to English", () => {
    const resolveLocale = contract.resolveLocale as (
      languageTags: readonly string[],
    ) => string;

    expect(resolveLocale(["es-MX"])).toBe("es");
    expect(resolveLocale(["ja-JP", "ko-KR"])).toBe("en");
    expect(resolveLocale([])).toBe("en");
  });
});
