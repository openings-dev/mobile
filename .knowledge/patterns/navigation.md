# Navigation

> Keep Expo Router entries thin and native navigation behavior predictable.

## Router root

Expo Router scans only `src/app/routes`, configured through `app.json`. The root
redirects to `/jobs`. The `(tabs)` group contains Jobs, Communities, and Authors.
Root stack routes contain job, community, and author details.

The tab navigator owns one branded application header for all three root tabs. It
contains the canonical Openings wordmark plus a menu trigger. The menu opens a
right-side native drawer with the three product destinations, project support, and
compact language and appearance popovers. Detail routes use the same wordmark with
an X close action and preserve native stack back behavior.

Route entries declare the route, receive parameters, and compose or export the
screen implementation. Screen UI,
queries, and interaction behavior remain under `src/app/<entity>/`.

## Route rules

- Use typed Expo Router APIs and validate every external parameter.
- Keep stable Openings identifiers in paths or parameters without translating them.
- Preserve direct links, refresh, back behavior, and platform-native gestures.
- Use navigation actions for destinations and `Pressable` for in-place actions.
- Do not hide product behavior inside `_layout.tsx` beyond global providers,
  navigation configuration, and recovery boundaries.
- Configure titles and accessibility labels through the active locale.

## Native behavior

Respect safe areas, status bars, hardware and predictive back, keyboard overlap,
modal dismissal, and focus restoration. A full-screen detail experience may require
a different native presentation from the web dialog while preserving the same
information hierarchy and source-of-truth action.

The job-detail action dock lives outside its `ScrollView`, reports its measured
height, and adds that height to the scroll content inset. This keeps the last source,
tag, or similar job reachable above the bottom safe area.

Deep links and outbound GitHub links are security boundaries. Internal routes encode
stable IDs, repositories, and handles. External actions accept deliberate HTTPS
destinations only. The application scheme is `openings`.
