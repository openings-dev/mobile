# Navigation

> Keep Expo Router entries thin and native navigation behavior predictable.

## Router root

Expo Router scans only `src/app/routes`, configured through `app.json`. The current
tree contains `_layout.tsx` and `index.tsx`. `src/app/routes/index.tsx` re-exports
`HomeScreen` from `src/app/home` and owns no product behavior.

Future route entries should follow the same contract: declare the route, receive
and validate parameters, and compose or export the screen implementation. Screen UI,
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

Deep links and outbound GitHub links are security boundaries. Validate recognized
internal routes and allow only deliberate supported external schemes. The current
foundation defines the `openings` application scheme but does not yet implement a
deep-link product contract.
