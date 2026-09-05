# Android Versioning

## Runtime policy

Production Android builds check Firebase Remote Config during application bootstrap.
The app requires an update only when both `android_force_update_enabled` is `true`
and `android_minimum_version_code` is greater than the installed native build
number. Both values must come from the remote source. Missing, default, mixed,
invalid, timed-out, or unavailable values fail open so configuration trouble cannot
accidentally lock every user out.

The mandatory screen replaces the application routes, consumes all safe-area
edges, blocks the Android back action, and starts a Google Play immediate update.
If the native update flow cannot start, the screen opens the package's Play Store
page. This behavior is disabled in development and on non-Android runtimes.

After the mandatory check passes, Google Play may report a newer compatible build.
When a flexible update is allowed, the app shows a dismissible safe-area-aware
notice. A dismissal is stored by Play Store version, so a later release may be
offered again. Native update modules are dynamically loaded to keep unsupported
runtimes safe.

## Firebase configuration

Create the two Remote Config parameters in the `openingshq` Firebase project:

- `android_force_update_enabled`: Boolean, default `false`.
- `android_minimum_version_code`: Number, default `0`.

Publish the minimum version first while forced updates remain disabled. Confirm
that the target build is available to the intended Google Play audience, then
enable the Boolean parameter. To roll back the block immediately, publish
`android_force_update_enabled=false`. Repository files must never contain Firebase
credentials, service-account JSON, signing material, or private tokens.

## Verification

Policy tests cover disabled, invalid, stale, mixed-source, and mandatory cases.
Adapter tests cover unavailable native modules and Firebase failures. Context and
UI tests cover bootstrap priority, version-scoped dismissal, fallback navigation,
back blocking, safe-area padding, and all six supported locales.
