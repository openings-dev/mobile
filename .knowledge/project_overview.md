# Project Overview

> Describe what Openings Mobile does, what currently exists, and what it intentionally does not own.

## Product purpose

Openings helps people discover technology jobs published in public GitHub community
repositories. It organizes that public activity into a focused search experience
while keeping every opportunity connected to its original public source.

The mobile application is the private iOS and Android client for the same product.
Its long-term product direction is native access to opportunity discovery, job
details, communities, GitHub authors, comparison, and device-local candidate state.
Only behavior supported by the current repository may be described as implemented.

## Current implementation

The repository currently provides a tested native foundation:

- generated Android and iOS projects for an Expo SDK 57 bare workflow;
- a single Expo Router home route and localized foundation screen;
- system light and dark theme resolution;
- device locale detection with English fallback;
- complete typed foundation messages for six locales;
- a localized application error boundary with an accessible retry;
- local integration with `@openingshq/core` and
  `@openingshq/design-tokens`;
- JavaScript, package-contract, Android, and iOS verification workflows.

Opportunity fetching, search, filters, detail routes, saved jobs, viewed state,
comparison, community profiles, author profiles, and release automation are not yet
implemented in this repository.

## Stack

- Expo SDK 57 bare workflow
- React Native 0.86 and React 19
- Expo Router with typed routes
- strict TypeScript
- NativeWind 4 with Tailwind CSS 3
- Figtree through the Expo font plugin
- Jest and React Native Testing Library
- public sibling packages `@openingshq/core` and
  `@openingshq/design-tokens`

The Android application ID and iOS bundle identifier are both
`dev.openings.mobile`. The NPM package is private and named `@openingshq/mobile`.

## Data ownership

The separate public `openings-dev/data-pipeline` repository owns collection,
normalization, and publication of opportunity data. Openings Mobile will consume
its generated public JSON through explicit functional boundaries. The application
does not own an API, database, private listing feed, or GitHub credential.

## Non-goals

- no checked-in opportunity snapshots or invented listing fixtures in production;
- no backend proxy, authentication, private account state, or application workflow;
- no claim that Openings verifies employers or guarantees listing availability;
- no independent mobile brand or second design-token system;
- no direct duplication of Next.js-specific web architecture;
- no cloud synchronization of device-local state without a separate approved scope.
