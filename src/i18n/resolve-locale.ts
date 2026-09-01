import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@openingshq/core";

export function resolveLocale(
  languageTags: readonly string[],
): SupportedLocale {
  for (const languageTag of languageTags) {
    const normalizedTag = languageTag.replace("_", "-");

    if (isSupportedLocale(normalizedTag)) {
      return normalizedTag;
    }

    const [baseLanguage] = normalizedTag.split("-");

    if (baseLanguage === "pt") {
      return "pt-BR";
    }

    if (baseLanguage && isSupportedLocale(baseLanguage)) {
      return baseLanguage;
    }
  }

  return DEFAULT_LOCALE;
}
