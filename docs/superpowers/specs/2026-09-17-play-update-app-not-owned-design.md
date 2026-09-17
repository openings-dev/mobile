# Play update APP_NOT_OWNED handling

## Context

The signed Android `0.1.3` build checks Google Play for an in-app update at startup. When that build is sideloaded, or when the active Play account has never acquired the app, Play Core rejects the check with `Install Error(-10) / ERROR_APP_NOT_OWNED`. The provider already fails open and keeps the app usable, but it reports this expected eligibility outcome to Sentry as a technical exception.

The internal release workflow also embeds the repository variable `EXPO_PUBLIC_SENTRY_ENVIRONMENT`. That variable is currently `development`, so signed internal releases are mislabeled even though they run with production behavior.

## Decision

Treat only Play Core `ERROR_APP_NOT_OWNED` (`-10`) as a non-actionable update eligibility result. The Google Play update provider will return its existing no-update response without reporting the error. Every other SDK loading, update-check, or update-start failure remains reportable and continues to fail open.

Signed Android releases will use the Sentry environment `production`. Development builds remain excluded from Google Play update checks by the existing `!__DEV__` runtime guard.

## Boundaries

- Keep the handling inside `GooglePlayUpdateProvider`; UI and versioning context behavior do not change.
- Recognize the stable native error code from the rejected error text emitted by `expo-in-app-updates`.
- Do not suppress generic Play errors or all errors from sideloaded builds.
- Do not attempt to infer install origin, because the current runtime does not expose a reliable ownership signal before calling Play Core.
- Do not promote the Android release to production.

## Data flow

1. The versioning context requests update availability.
2. The provider calls `expo-in-app-updates.checkForUpdate()` on an Android release build.
3. A successful result is mapped as today.
4. `ERROR_APP_NOT_OWNED` maps to the existing no-update result and is not sent to telemetry.
5. Any other rejection maps to no-update and is sent to telemetry once.

The same classification applies when the provider rechecks availability before starting a flexible or immediate update.

## Testing

- Add regression coverage showing that `Install Error(-10)` returns the safe fallback and is not reported.
- Cover both availability checking and update starting so the two SDK call sites cannot regress independently.
- Preserve the existing assertion that an unrelated native failure is reported.
- Run the focused versioning tests, then lint, type checking, the complete Jest suite, and Expo Doctor before integration.

## Release and observation

Ship the change through a protected pull request. After merge, update the GitHub Sentry environment variable to `production` and publish the next version only to Google Play internal testing. The Sentry issue can be considered prevented for new builds once a sideloaded build produces no new `APP_NOT_OWNED` event; existing events remain historical.
