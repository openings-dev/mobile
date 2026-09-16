# Shared Packages

> Define ownership and local consumption of the two public Openings foundation packages.

## Packages

`@openingshq/core` is the platform-neutral package for shared Openings contracts.
Its first release exports the supported locale tuple, the `SupportedLocale` type,
the English default locale, a locale guard, and the shared foundation version.

`@openingshq/design-tokens` is the shared visual foundation. It exports color
primitives, semantic light and dark themes, runtime NativeWind variables, typography,
shape and spacing contracts, and a separate `@openingshq/design-tokens/nativewind`
preset entry.

Both packages are public, MIT-licensed, independently versioned NPM artifacts. The
mobile application is private and must never be published as part of their package
contents.

## Local development

Mobile resolves exact public npm releases and Metro uses the standard project
configuration. A fresh clone needs no sibling repository. Changes to either shared
package must be published under semantic versioning before mobile deliberately
updates its exact dependency.

Jest transforms the package boundary explicitly, and the contract test imports the
same public exports the application consumes. Do not bypass package exports with a
relative import into another repository's `src` folder.

## Ownership rules

- Move a contract into `core` only when it is platform-neutral and genuinely shared.
- Move a visual value into `design-tokens` when it is part of the durable Openings
  system, not a screen-specific layout choice.
- Keep React Native components, Expo APIs, device services, navigation, and native
  persistence inside mobile.
- Keep Next.js, DOM, and browser-only behavior inside web.
- Preserve semantic versioning and add package tests before changing an exported
  contract.
- Validate ESM, CommonJS, type declarations, package contents, and the NativeWind
  subpath before publishing a package version.
