# Openings Mobile Production Parity Implementation Plan

> Execute autonomously with test-driven development, semantic design tokens, and
> micro-commits. Do not expand the product beyond Jobs, Communities, and Authors.

**Goal:** Bring the private Expo application to production-grade native parity
with the responsive Openings web experience while preserving native interaction
patterns and the existing public-data architecture.

**Architecture:** Keep Expo Router entries thin and implement product behavior in
the existing `src/app/<entity>` owners. Add only reusable visual primitives to
`src/components`, keep deterministic presentation logic in
`src/domain/openings`, and extend the public design-token package only when a
shared semantic value is genuinely missing. Configure native identity through
Expo app configuration and committed source assets.

**Stack:** Expo SDK 57, React Native 0.86, Expo Router, NativeWind 4, Tailwind 3,
Figtree, React Native SVG, Jest, and Testing Library.

---

## Task 1: Record the approved production contract

**Files:**

- Add: `docs/plans/2026-09-02-mobile-production-parity-design.md`
- Add: `docs/plans/2026-09-02-mobile-production-parity-implementation.md`

**Steps:**

1. Check both documents against `AGENTS.md` and the current product boundary.
2. Run `git diff --check`.
3. Force-add the globally ignored `docs/` paths and create one documentation
   micro-commit.

## Task 2: Replace placeholder application identity with canonical assets

**Files:**

- Add: `assets/images/icon.png`
- Add: `assets/images/adaptive-icon.png`
- Add: `assets/images/monochrome-icon.png`
- Add: `assets/images/splash-icon.png`
- Add: `assets/images/splash-icon-dark.png`
- Modify: `app.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify after prebuild: native icon and splash resources under `ios/` and
  `android/`
- Test: `tests/contracts/app-config.test.ts`

**Steps:**

1. Write a failing contract test asserting canonical icon, Android adaptive and
   monochrome icon, and `expo-splash-screen` configuration paths.
2. Run the focused test and confirm that the placeholder configuration fails.
3. Generate square PNG assets from the canonical stacked-pages geometry. Use a
   full-bleed Warm Paper application icon, a transparent safe-zone foreground,
   a one-color transparent monochrome mark, and theme-aware splash marks.
4. Install the SDK-compatible `expo-splash-screen` package with Expo's installer.
5. Configure top-level/iOS/Android icons and the splash config plugin in
   `app.json`, preserving `dev.openings.mobile`.
6. Run the focused test, inspect pixel dimensions and alpha behavior, then run
   `npx expo prebuild --no-install` so the checked-in bare projects match config.
7. Create an application-identity micro-commit.

## Task 3: Finish the native shell and deterministic typography

**Files:**

- Modify: `src/app/routes/_layout.tsx`
- Modify: `src/app/routes/(tabs)/_layout.tsx`
- Modify: `src/components/app-header/index.tsx`
- Modify: `src/components/brand-wordmark/index.tsx`
- Modify: `tests/components/app-header.test.tsx`
- Add or modify: `tests/app/navigation-shell.test.tsx`

**Steps:**

1. Add failing assertions for the accessible brand destination, visible locale
   and appearance controls, and the three labeled tabs only.
2. Confirm the focused tests fail on the new shell contract.
3. Align header height, wordmark size, control spacing, tab-bar height, Figtree
   labels, safe-area padding, and active/inactive semantic colors with the
   approved mockup.
4. Keep the status bar synchronized with theme and set system backgrounds through
   Expo-supported APIs without hard-coded application colors.
5. Run the focused tests and create a shell micro-commit.

## Task 4: Add pure opportunity presentation behavior

**Files:**

- Add: `src/domain/openings/presentation.ts`
- Add: `tests/domain/presentation.test.ts`

**Steps:**

1. Write failing tests for Markdown-to-plain-text excerpts, ordered unique card
   metadata, work-model extraction, supporting-tag overflow, source counts, and
   visible result ranges.
2. Run the focused test and confirm the helpers do not exist.
3. Implement small pure functions with no React, locale, or platform imports.
4. Preserve source values and structured taxonomy without inventing unavailable
   facts.
5. Run the focused test and create a presentation-logic micro-commit.

## Task 5: Rebuild the opportunity card to the web content contract

**Files:**

- Modify: `src/components/entity-avatar/index.tsx`
- Modify: `src/components/opportunity-card/index.tsx`
- Add: `tests/components/opportunity-card.test.tsx`
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/messages.ts`
- Modify: `tests/i18n/messages.test.ts`

**Steps:**

1. Write failing component tests for community identity, save state, New/stale
   and source badges, excerpt, salary/work model/location, categorized tags with
   `+N`, author/date/repository footer, explicit details copy, and nested actions
   that do not open the job.
2. Add the required typed copy to all six locales and confirm the catalog
   completeness test fails until every locale is updated.
3. Extend `EntityAvatar` with compact sizes required by community and author
   identity rows.
4. Implement the content-driven card with semantic NativeWind styles and 44-point
   nested targets. Keep comparison absent.
5. Let profile owners hide redundant community or author identity through narrow
   props while retaining all other metadata.
6. Run component and i18n tests and create a card-parity micro-commit.

## Task 6: Match the responsive Jobs workspace and result hierarchy

**Files:**

- Modify: `src/app/jobs/index.tsx`
- Modify: `src/app/jobs/components/jobs-workspace-header/index.tsx`
- Modify: `src/app/jobs/components/jobs-result-toolbar/index.tsx`
- Modify: `src/app/jobs/components/jobs-filter-modal/index.tsx`
- Modify: `tests/app/jobs-screen.test.tsx`
- Modify: `tests/app/jobs-filter-modal.test.tsx`
- Modify: `tests/app/jobs-filter-presentation.test.ts`

**Steps:**

1. Add failing tests for the visible result range, filter count, removable active
   chips, share/sort controls, rich card content, and native More sheet.
2. Confirm the focused Jobs tests fail on the new range and card contract.
3. Apply the approved compact hierarchy with 16-point gutters, labeled controls,
   intentional separators, and a results toolbar that reports
   `Showing start–end of total jobs`.
4. Keep Discover shortcuts and structured filters inside the native More sheet.
   Preserve search while clearing advanced filters.
5. Wire community and author card actions to their native profile routes.
6. Preserve incremental loading and scroll continuity while updating the visible
   range as pages are revealed.
7. Run the focused Jobs tests and create a Jobs-parity micro-commit.

## Task 7: Raise Communities and Authors to the same production system

**Files:**

- Modify: `src/components/directory-card/index.tsx`
- Modify: `src/components/screen-header/index.tsx`
- Modify: `src/app/communities/index.tsx`
- Modify: `src/app/authors/index.tsx`
- Add: `tests/components/directory-card.test.tsx`
- Modify: `tests/app/communities-screen.test.tsx`
- Modify: `tests/app/authors-screen.test.tsx`

**Steps:**

1. Add failing tests for identity, geography, job count, activity, source/handle,
   explicit open action, and accessible selected directory filters.
2. Confirm focused directory tests fail on the explicit action and metadata
   contract.
3. Rebuild the shared directory card with semantic icon rows, stronger hierarchy,
   content-driven height, and a visible destination affordance.
4. Align both screen headers, filter rows, result summaries, list gutters, empty
   states, and refresh behavior.
5. Run focused tests and create a directory-parity micro-commit.

## Task 8: Apply context-aware cards and polish native details

**Files:**

- Modify: `src/app/jobs/details/index.tsx`
- Modify: `src/app/communities/profile/index.tsx`
- Modify: `src/app/authors/profile/index.tsx`
- Modify: `tests/app/job-details.test.tsx`
- Modify: `tests/app/profile-screens.test.tsx`

**Steps:**

1. Add failing tests for rich related-job cards and removal of redundant profile
   identity while preserving navigation to the other entity.
2. Confirm profile/detail tests fail on the context-aware card contract.
3. Replace repeated compact card invocations with the production card API.
4. Keep source, save, share, community, author, and related-job actions native and
   independently accessible.
5. Normalize profile spacing and metadata hierarchy without changing remote-data
   ownership.
6. Run focused tests and create a profile-parity micro-commit.

## Task 9: Production verification and visual QA

**Files:**

- Modify only if findings require it: affected source, tests, app config, or
  knowledge documents
- Update when behavior materially changes: `.knowledge/design_system/` and
  `.knowledge/project_overview.md`

**Steps:**

1. Run `npm run check` from `mobile/`.
2. Run `npx expo config --type public` and confirm icon/splash/font/plugin fields.
3. Run iOS and Android debug builds because native configuration changed.
4. Launch compact-phone builds and capture Jobs, More filters, Communities,
   Authors, job details, and both profile screens in light and dark themes.
5. Compare screenshots against the approved mockup and responsive web hierarchy;
   fix truncation, overlap, fallback fonts, unsafe-area gaps, target sizing, and
   contrast regressions with a failing test where behavior is testable.
6. Re-run the complete check and affected native builds after fixes.
7. Review `git diff --check`, repository status, and commit history. Create final
   narrow verification/documentation micro-commits as needed, then push the
   authorized mobile `main` branch.

