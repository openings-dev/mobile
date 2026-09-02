# Project Overview

> Describe what Openings Mobile does, what currently exists, and what it intentionally does not own.

## Product purpose

Openings helps people discover technology jobs published in public GitHub community
repositories. It organizes that public activity into a focused search experience
while keeping every opportunity connected to its original public source.

The mobile application is the private iOS and Android client for the same product.
It provides native access to opportunity discovery, job details, communities,
GitHub authors, and device-local candidate state. Job comparison and all other web
areas are intentionally excluded from the mobile product.

## Current implementation

The repository currently provides a tested native discovery application:

- generated Android and iOS projects for an Expo SDK 57 bare workflow;
- bottom-tab routes for Jobs, Communities, and Authors plus stack detail routes;
- persisted system, light, and dark appearance selection;
- persisted six-language selection with device detection and English fallback;
- a canonical branded tab header with a right-side menu drawer, GitHub support
  card, and compact language and appearance popovers;
- complete typed product messages for six locales;
- a localized application error boundary with an accessible retry;
- validated, bounded-batch loading of the public schema-6 snapshot;
- a native web-parity Jobs workspace with search, country and stack selectors,
  removable active filters, sharing, sorting, and a result toolbar;
- a native More sheet containing discovery shortcuts, complete structured filters,
  result count, clear behavior, and accessible selection state;
- a device-local New matches callout with persistent dismissal and filter action;
- local result paging, refresh, empty, incremental, and error states;
- community activity and geography discovery plus native community profiles;
- author derivation and discovery plus native author profiles;
- native job details with Data confidence, similar roles, source links, HTTPS
  validation, sharing, reporting, and a measured fixed action dock;
- versioned device-local saved and viewed job state through AsyncStorage;
- local integration with `@openingshq/core` and
  `@openingshq/design-tokens`;
- JavaScript, package-contract, Android, and iOS verification workflows.

## Stack

- Expo SDK 57 bare workflow
- React Native 0.86 and React 19
- Expo Router with typed routes
- strict TypeScript
- NativeWind 4 with Tailwind CSS 3
- TanStack Query for the public catalog lifecycle
- AsyncStorage for versioned device-local candidate state
- Figtree and Geist Mono through the Expo font plugin
- Lucide React Native icons aligned with the responsive web interface
- Jest and React Native Testing Library
- public sibling packages `@openingshq/core` and
  `@openingshq/design-tokens`

The Android application ID and iOS bundle identifier are both
`dev.openings.mobile`. The NPM package is private and named `@openingshq/mobile`.

## Data ownership

The separate public `openings-dev/data-pipeline` repository owns collection,
normalization, and publication of opportunity data. Openings Mobile consumes
its generated public JSON through explicit functional boundaries. The application
does not own an API, database, private listing feed, or GitHub credential.

## Non-goals

- no checked-in opportunity snapshots or invented listing fixtures in production;
- no backend proxy, authentication, private account state, or application workflow;
- no claim that Openings verifies employers or guarantees listing availability;
- no independent mobile brand or second design-token system;
- no direct duplication of Next.js-specific web architecture;
- no comparison, marketing, documentation, status, update, or specimen routes;
- no cloud synchronization of device-local state without a separate approved scope.
