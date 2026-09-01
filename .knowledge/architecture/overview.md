# Architecture Overview

> Map the current native runtime, source ownership, and dependency direction.

## Runtime model

Openings Mobile is an Expo SDK 57 bare-workflow application. Expo Router scans
`src/app/routes`, while the committed `android` and `ios` projects provide the
native build surfaces. The root layout imports NativeWind CSS, resolves the device
locale, resolves the system color scheme, installs theme variables, mounts the
localized error boundary, TanStack Query client, candidate-state storage provider,
public-catalog provider, and native stack. The root redirects to Jobs. A bottom tab
bar owns Jobs, Communities, and Authors, while their detail destinations use the
root native stack.

## Source map

```text
src/
├── app/
│   ├── home/                    # Home screen implementation
│   ├── jobs/                    # Job directory, filters, and details
│   ├── communities/             # Community directory and profile
│   ├── authors/                 # Author directory and profile
│   └── routes/                  # Thin Expo Router tabs and stack entries
├── components/
│   └── */                       # Reused native discovery primitives
├── contexts/
│   ├── candidate-state/         # Saved/viewed device-local state
│   ├── locale/                  # Device locale and typed messages
│   ├── openings-catalog/        # Query-backed progressive catalog state
│   └── theme/                   # System theme and NativeWind variables
├── domain/                      # Validated contracts and pure discovery logic
├── services/                    # Public transport and native external actions
├── i18n/                        # Catalog contract, catalogs, and locale resolver
└── theme/                       # Shared design-token bridge
tests/
├── app/                         # Rendered application behavior
├── contracts/                   # Public package integration
└── i18n/                        # Locale and catalog invariants
android/                         # Generated native Android project
ios/                             # Generated native iOS project
```

Create screen-owned `components`, `hooks`, `helpers`, `constants`, `schemas`, and
`types` directly under the owning `src/app/<entity>/` folder.
Application-wide primitives belong in `src/components`; cross-cutting providers
belong in `src/contexts`; remote access belongs in `src/services` when introduced.

## Dependency direction

```text
Expo Router routes
  -> screen implementations
    -> shared components, contexts, domain helpers, and service functions
      -> @openingshq/core and @openingshq/design-tokens
```

Routes contain no product behavior. Services do not import screens or components.
Shared packages stay platform-neutral and never depend on the private mobile app.

## Shared package boundary

`@openingshq/core` currently owns supported locale values, locale guards, the
English fallback, and the shared foundation version. Future cross-platform domain
contracts belong there only after a real web/mobile reuse boundary exists.

`@openingshq/design-tokens` owns primitive colors, semantic light and dark themes,
runtime NativeWind variables, typography scales, shapes, spacing, and the
NativeWind preset. Mobile components consume semantic utilities rather than raw
palette values.

## Native ownership

Prefer `app.json` and Expo config plugins for reproducible native configuration.
Run prebuild deliberately after changing Expo configuration and review the generated
diff. Direct changes under `android` or `ios` require a native-only need that cannot
be expressed safely through Expo configuration.

Dependency, Expo plugin, bundle identifier, font, or native configuration changes
require JavaScript checks plus the affected native debug build.
