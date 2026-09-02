# Openings Mobile Production Parity Design

## Status

Approved on 2026-09-02. The chosen direction is native parity: preserve the
web product's identity, information hierarchy, content, and visual rhythm while
using platform-native navigation, sheets, sharing, touch feedback, and safe-area
behavior.

## Problem

The current mobile implementation contains the correct product areas and much of
the required behavior, but it presents them with substantially less visual and
informational fidelity than the responsive web application. The most visible
gaps are:

- placeholder application and splash artwork;
- compressed typography and vertical rhythm;
- job cards that omit community identity, excerpts, source count, structured
  metadata, author identity, repository context, and an explicit details action;
- lightweight result and directory presentation that does not match the web
  hierarchy;
- insufficient production configuration and visual verification.

The work must correct the system rather than tune one screenshot. Jobs,
Communities, Authors, their profile/detail screens, light/dark themes, all six
locales, and both native platforms belong to the same parity contract.

## Product boundary

The application continues to contain exactly three primary destinations:

- Jobs
- Communities
- Authors

Comparison, marketing, documentation, updates, status, and other web-only areas
remain excluded. Native parity does not expand the product scope.

## Identity and application assets

The canonical stacked-pages Openings mark and the `openings.dev` wordmark remain
the only brand artwork. The mobile header renders the vector wordmark from the
same canonical geometry used by the web application.

In a native application, the requested favicon parity maps to the complete app
identity set:

- a 1024×1024 iOS application icon;
- Android legacy and adaptive icon artwork, including foreground, background,
  and monochrome variants where supported;
- a branded splash asset and matching light/dark background colors;
- Expo configuration that is reproducible by prebuild rather than relying on
  placeholder files inside generated native projects.

Artwork must preserve the safe zone at small launcher sizes and must remain
recognizable without the full wordmark. The app icon therefore uses the brand
mark, while the in-app header uses the full wordmark.

## Visual foundations

Figtree is the interface and display family on both platforms at weights 400,
500, and 600. Font registration and NativeWind family names must resolve to the
same native family; screens must not silently fall back to the system font.

The existing public design-token package remains authoritative for color,
radius, spacing, touch size, and typography. Mobile components use semantic
tokens only. The production pass adds or corrects shared tokens when the web
contract cannot be expressed with the current preset; it does not introduce a
second mobile-only palette.

The visual baseline is:

- Warm Paper canvas and Paper/Surface content layers;
- Community Ink primary text and Brand Mint for deliberate active states;
- one-pixel, low-contrast boundaries and rare elevation;
- 16-point card radius and 12-point control radius;
- minimum 44-point interactive targets;
- 16-point horizontal page gutters on compact phones, increasing where the
  available width permits;
- card titles at approximately 18–20 points, body copy at 14–15 points, and
  metadata no smaller than 12 points at the default Dynamic Type setting.

Dynamic Type may reflow content and increase card height. Essential information
must never be hidden merely to preserve a fixed card height.

## Application shell

The top header keeps the wordmark on the left and language and appearance
controls on the right. Controls retain 44-point targets even when their visible
icons are smaller. The header respects the top safe area and uses the Paper
surface with a hairline divider.

The bottom tab bar contains Jobs, Communities, and Authors only. Active color,
labels, icons, safe-area padding, and theme follow the shared semantic system.
Tab labels remain visible because the three destinations are equally important.

## Jobs workspace

The Jobs screen follows the responsive web hierarchy:

1. page title and concise description;
2. labeled search field;
3. Country and Stack / Technology selectors;
4. a full-width More control with the active advanced-filter count;
5. horizontally scrollable removable chips for active filters;
6. result count and snapshot recency;
7. share-search and sort actions;
8. the opportunity list.

Advanced discovery shortcuts and all remaining filters live in a native bottom
sheet opened by More. The sheet groups Discover, work model, freshness, salary,
saved/new state, and structured facets. Selection is reversible, announced to
assistive technology, and summarized by active-filter chips after dismissal.

The result summary states the visible range and total, for example
`Showing 1–20 of 795 jobs`, rather than displaying only a total. Loading the next
page must not destabilize scroll position.

## Opportunity card

The responsive web card is the content contract. A native card contains, when
the data exists:

- community avatar and name;
- save action;
- New, stale, and multiple-source badges;
- complete job title with controlled wrapping;
- a plain-text, three-line excerpt derived from the source description;
- salary, structured work model, and location;
- a categorized supporting-tag set with an explicit `+N` overflow;
- author avatar/handle, publication date, and repository;
- an explicit View details affordance.

The whole card opens the details screen. Nested community, author, save, and
source actions remain independently operable and must not trigger the card
navigation accidentally. Comparison is intentionally absent from mobile.

Cards have content-driven height. Visual truncation limits noisy source text but
does not remove primary metadata. Markdown syntax is reduced to readable plain
text in list excerpts; the full description retains its existing safe detail
rendering.

## Communities and Authors

Both directories use the same structural quality as the Jobs list:

- page title and description;
- labeled search;
- native filter/sort access with active state;
- visible results summary;
- entity cards with avatar, identity, geography, current job count, latest
  activity, source context where applicable, and an explicit open action.

Profile screens preserve the same identity block and surface current jobs using
the production opportunity card in a context-aware mode. A community profile
may hide redundant community identity inside its jobs; an author profile may
hide redundant author identity. It must not fall back to the earlier compressed
card presentation.

## Interaction and state

Remote data continues to come only from the generated public snapshot. Existing
search, filter, sort, progressive loading, pull-to-refresh, saved jobs, viewed
state, sharing, source opening, and native route behavior remain intact.

All controls expose role, label, selected/expanded state, and useful hints where
the action is not obvious. Modal focus, screen-reader announcements, reduced
motion, keyboard avoidance, and platform back behavior are part of acceptance,
not post-release enhancements.

Avatar failure falls back to initials. Initial and refresh failures remain
distinguishable. Empty results retain the active filter context and a clear
reset action.

## Responsiveness and performance

The compact-phone layout is the primary composition. Small screens stack or
wrap controls without shrinking editable text below 16 points. Larger phones
and tablets may widen gutters and use more horizontal space, but do not become a
desktop clone.

Long lists remain virtualized. Card render work is kept local and stable;
formatting helpers and categorized metadata are pure and tested. Images are
bounded, optional, and do not block text. Progressive catalog updates preserve
usable content and scroll continuity.

## Production configuration

The production pass completes Expo-managed icon and splash configuration,
status/navigation-bar theme integration, deterministic font configuration, and
release metadata already owned by the application. Identifiers remain
`dev.openings.mobile`.

No credentials, signing material, analytics, backend, or application-store
submission is introduced by this specification.

## Verification and acceptance

Implementation follows test-driven development. Behavioral tests cover pure
presentation helpers, categorized tags, excerpts, result ranges, accessibility
state, nested card actions, directory metadata, and empty/error behavior.

Acceptance requires:

- all six locale catalogs to remain complete;
- light and dark theme parity;
- compact-phone and larger-device visual review;
- VoiceOver/TalkBack-friendly labels, roles, and states;
- `npm run check` passing;
- Expo Doctor passing;
- successful iOS and Android debug builds after configuration and native asset
  changes;
- direct screenshot comparison against the responsive web hierarchy for Jobs,
  Communities, Authors, and their detail/profile screens.

