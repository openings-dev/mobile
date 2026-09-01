# Internationalization

> Keep six complete locale catalogs behind one typed mobile runtime contract.

## Supported locales

The shared package exports `en`, `pt-BR`, `es`, `it`, `fr`, and `de`. English is
the default and fallback. The current `resolveLocale` function inspects ordered
device language tags, preserves exact supported tags, maps any Portuguese variant
to `pt-BR`, maps supported regional variants to their base language, and falls back
to English.

The current provider derives locale from `expo-localization`. It does not yet expose
a persisted manual language selection.

## Message contract

`src/i18n/types.ts` defines the complete foundation message shape. Every dictionary
in `src/i18n/messages.ts` must satisfy that shape. Add, rename, or remove a visible
message key in the type and all six catalogs in the same change.

Visible copy, placeholders, alternative text, accessibility labels and hints,
errors, empty states, and announcements belong in dictionaries. Repository names,
job IDs, canonical URLs, route segments, remote filters, and other domain values
remain language-neutral.

## Formatting

Pass the active locale explicitly to dates, numbers, salary values, counts, and
relative time. Do not derive formatted strings in data services or persist localized
output as domain state.

## Quality

Translations must preserve the Openings meaning and claims boundary, not English
syntax. Review truncation, plural meaning, screen-reader phrasing, and compact mobile
layouts independently in every locale. Catalog parity tests prove key completeness;
they do not prove translation quality.
