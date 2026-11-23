# Listing Safety Implementation Plan

> **For agentic workers:** Execute inline with superpowers:executing-plans; design approved by user and delegated as one focused change.

**Goal:** Let users report listings without GitHub and persistently hide/restore authors locally.

**Architecture:** A dedicated local provider persists normalized blocked handles independently of saved IDs. The catalog derives a filtered array without mutating query data and exposes no jobs before block hydration. Existing job actions and drawer host blocking and restoration; email reporting offers selectable contact and listing references even without a mail application.

**Tech Stack:** React Native, React context, AsyncStorage, existing Linking, Jest and Testing Library. No new native dependencies.

## Implementation

- [x] Add failing behavioral tests for persisted block/restore, initial hydration, immutable catalog filtering, job action and report fallback.
- [x] Add `src/contexts/blocked-authors/index.tsx` and `src/domain/blocked-authors.ts`; store validated normalized handles at `openings:blocked-authors`; retain saved IDs. Surface storage errors rather than silently forgetting blocks.
- [x] Wrap catalog in root provider and derive visible opportunities with `items.filter(item => !blockedHandles.has(item.author.handle.trim().toLowerCase()))`; withhold items until hydration. Use visible totals when blocking.
- [x] Extend `src/components/job-detail-actions/index.tsx`, job details, and existing drawer with localized block confirmation and restore controls.
- [x] Add email report helper and localized report modal with selectable `support@openings.dev`, canonical URL and source URL, preserving fallback after failed mail launch.
- [x] Complete all six catalogs and relevant knowledge documentation.
- [x] Run targeted tests and `npm run check` using Node 24; inspect focused diff, then commit only task files. Leave root-owned `fastlane/review` artifacts untouched.

## Verification cases

Hydrate a persisted `alice` block while catalog data is cached: no Alice content before or after hydration. Block `Alice` and restore `alice`: all authored jobs disappear and return, saved IDs survive, catalog source is unchanged. Relaunch provider: block remains. Report action displays selectable contact/reference, opens encoded mail draft, and rejected Linking shows instructions to email manually. Action sheet closes on blocking; drawer restoration is discoverable and localized.

## Execution evidence

Behavioral red runs failed on missing block action, drawer restore, report fallback, and visible community count; subsequent implementation passed. Full local lint, typecheck and 74 Jest suites / 292 tests passed. The shared query cache and saved IDs remain intact under block/restore tests.

The existing Expo Doctor patch baseline also required updates to expo-build-properties 57.0.24, expo-constants 57.0.25, expo-dev-client 57.0.22, expo-router 57.0.32 and expo-splash-screen 57.0.12. Package and npm lockfile updated; app version/build identifiers unchanged. Native CocoaPods reconciliation and device/build verification remain with the parent release workflow.

Final `npm run check` passed with user-authorized online Expo validation: lint,
typecheck, 74 suites / 292 tests, and Expo Doctor 20/20. No native build or device
review was performed by this delegated source task.
