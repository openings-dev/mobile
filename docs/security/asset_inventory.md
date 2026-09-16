# Redistributable Asset Inventory

This inventory covers tracked visual, font and store-listing material. Source-code
licensing does not grant trademark or brand usage rights. Any
The owner confirmed redistribution rights on September 16, 2026. Source-code
licensing remains separate from trademark and official-release authority.

| Asset family | Source / owner | Rights classification | Notes |
| --- | --- | --- | --- |
| `assets/images/` | Openings brand artwork | owner-confirmed redistribution | Canonical icon, adaptive icon, monochrome icon and light/dark splash sources |
| `android/app/src/main/res/` launcher and splash images | Generated from `assets/images/` by Expo | owner-confirmed redistribution | Derivative brand assets; XML platform resources are project-generated |
| `ios/Openings/Images.xcassets/` | Generated from `assets/images/` by Expo | owner-confirmed redistribution | App icon and splash derivatives |
| `fastlane/metadata/android/*/images/` | Openings store artwork and screenshots | owner-confirmed redistribution | Six locales, each with icon, feature graphic and six phone screenshots |
| `fastlane/metadata/android/*/*.txt` | Openings store copy and translations | owner-confirmed redistribution | Titles, descriptions and first-release changelogs in six locales |
| Figtree font binaries under `android/app/src/main/res/font/` | Figtree authors via `@expo-google-fonts/figtree` | OFL-1.1 | Generated native copies; retain applicable font notices when redistributing |
| Geist Mono font binaries under `android/app/src/main/res/font/` | Vercel and contributors via `@expo-google-fonts/geist-mono` | OFL-1.1 | Generated native copies; retain applicable font notices when redistributing |

## Gate status

Asset clearance is **owner-confirmed** for redistribution with this repository.
The Openings name, logos and official app identity remain project trademarks; the
MIT source license does not authorize a fork to represent itself as an official
Openings release.
