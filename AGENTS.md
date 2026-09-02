# Openings Mobile Agent Instructions

`AGENTS.md` is the canonical instruction file for assistants working in this
repository. Detailed factual guidance lives in [`.knowledge/`](.knowledge/README.md).
Read the relevant knowledge documents before changing code.

## Product and stack

Openings Mobile is the private iOS and Android client for discovering technology
jobs published in public GitHub community repositories. It follows the same
product, data, localization, accessibility, and visual contracts as the public
Openings web application while using native mobile interaction patterns.

- Expo SDK 57 bare workflow, React Native 0.86, and React 19
- Expo Router with typed routes under `src/app/routes`
- strict TypeScript
- NativeWind 4 and Tailwind CSS 3
- Figtree typography
- public `@openingshq/core` and `@openingshq/design-tokens` packages
- typed `en`, `pt-BR`, `es`, `it`, `fr`, and `de` message catalogs
- npm for dependency and script management

The current repository implements Jobs, Communities, and Authors as the complete
mobile product scope. Do not add other web areas, including comparison, unless the
user explicitly expands that scope. Do not document an intended feature as
implemented until its source and tests exist.

## Product boundaries

- Preserve Openings as a discovery layer over public listings. The original
  public GitHub listing remains the source of truth.
- Consume generated public data owned by `openings-dev/data-pipeline`. Do not add
  a local opportunity dataset, backend proxy, authentication, or credentials.
- Keep repository identifiers, paths, filter values, and other domain values
  language-neutral.
- Keep saved jobs, viewed state, locale selection, and appearance preference
  device-local unless a separate approved specification introduces synchronization.
- Do not imply that Openings verifies employers, guarantees availability, ranks
  candidate fit, or manages applications.

## Required workflow

1. Read the relevant `.knowledge/` documents and the active specification.
2. Inspect the current implementation before editing it.
3. Keep the change within the requested product and repository boundary.
4. Write a failing behavioral test before adding or changing behavior.
5. Preserve all six locales, theme parity, safe areas, accessibility, and native
   platform behavior.
6. Run `npm run check` for application changes. Run the affected native debug
   build after dependency, Expo configuration, or native project changes.
7. Do not commit, push, publish, or change remotes unless the user explicitly
   requests that action.

Before changing Expo or native behavior, inspect the documentation for the exact
installed Expo SDK and the relevant package versions. Do not assume APIs from an
older Expo or React Native release.

## Architecture and ownership

- Expo Router scans only `src/app/routes`.
- Keep route files thin. A route should export or compose a screen from
  `src/app/<entity>/` and contain no product behavior.
- Keep screen-owned components, hooks, helpers, constants, schemas, and types
  beside their screen owner.
- Put application-wide providers in `src/contexts`, reusable primitives in
  `src/components`, remote-data functions in `src/services`, and domain helpers
  in focused source folders.
- Do not create `src/features`, `src/screens`, Atomic Design folders, or
  speculative abstraction layers.
- Shared platform-neutral contracts belong in `@openingshq/core`. Shared visual
  primitives, semantic themes, runtime variables, and the NativeWind preset belong
  in `@openingshq/design-tokens`.
- Dependencies point inward: routes may use screens; screens may use shared UI,
  contexts, domain helpers, and service functions; services never import screens.
- Use functional application code. The React error boundary is the only current
  class-based exception required by React's error-boundary API.

## Components, types, and naming

- Ordinary components live in kebab-case folders with an `index.tsx`
  implementation.
- Use named exports for ordinary components; Expo Router entry files may use the
  default exports required by the framework.
- Declare explicit `React.ReactNode` return types on components.
- Keep props narrow and colocate component-only types. Keep domain types at their
  domain boundary.
- Source files and component folders use lowercase kebab-case. Knowledge files
  use snake_case. Components and types use PascalCase; functions and runtime
  values use camelCase; fixed semantic constants use SCREAMING_SNAKE_CASE.
- Prefer `import type`. Avoid `any`, unsafe assertions, magic values, duplicated
  domain unions, and barrels that only re-export symbols.
- Use relative imports inside one ownership boundary and `@/` across top-level
  boundaries.

## State and data

- Keep ephemeral state at its lowest coherent owner and derive values during
  render.
- Use context only for stable cross-cutting state with distant consumers. Remote
  caching belongs to TanStack Query; the catalog context exposes that query-backed
  contract and progressive loading state.
- Use effects only to synchronize with an external system and always clean up
  subscriptions, timers, and requests.
- Keep public URL construction, fetch, unknown-data validation, normalization,
  and domain queries outside React components.
- Treat every remote JSON payload as unknown until validated. Preserve useful
  HTTP, parsing, cancellation, and network failures instead of fabricating jobs.
- Do not add retries, service classes, local snapshots, or secrets without an
  explicit product requirement.

## Internationalization

- Keep all six message catalogs complete against one shared TypeScript contract.
- English is the fallback locale. Normalize Portuguese device variants to
  `pt-BR`; normalize supported regional variants to their supported base language.
- Put visible copy, placeholders, accessibility labels, alternative text, empty
  states, and errors in typed dictionaries.
- Pass the active locale explicitly to date, number, salary, and relative-time
  formatting.
- Review the meaning of each locale independently; do not preserve awkward literal
  translations.

## Interface rules

- Use NativeWind utilities backed by `@openingshq/design-tokens` semantic roles.
- Do not introduce another token system, CSS-in-JS, component stylesheets, or raw
  palette values in application components.
- Application source must not use `StyleSheet` for fixed styling. Inline styles
  are reserved for runtime variables, measured geometry, animation values, or
  third-party native components that cannot consume `className`.
- Use Figtree for display, interface, and body text. Preserve the Openings editorial
  system: Warm Paper and Community Ink foundations, controlled Brand Mint actions,
  1-pixel low-contrast boundaries, and rare diffuse elevation.
- Respect safe areas, Dynamic Type, screen readers, reduced motion, color contrast,
  dark mode, keyboard avoidance, and a minimum 44-point interactive target.
- Use `Pressable` for actions and Expo Router links or navigation actions for
  destinations. Give icon-only controls an accessible label.
- Keep loading, incremental, refresh, empty, error, and success states explicit in
  remote opportunity experiences.

## Native safety and quality

- Keep the identifiers `dev.openings.mobile` on Android and iOS unless an approved
  migration explicitly changes them.
- Prefer Expo configuration and config plugins for reproducible native settings.
  Edit generated native projects directly only when a requirement cannot be
  represented safely through Expo configuration.
- Never log or version credentials, signing data, service-account JSON, keystores,
  certificates, tokens, personal data, or private environment files.
- Do not send saved jobs, viewed state, search terms, or opportunity interaction
  details to a third party unless an approved analytics contract explicitly permits
  each field.
- Do not claim release readiness from JavaScript tests alone. Verify the applicable
  Android and iOS native builds after native-impacting work.
