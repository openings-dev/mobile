# Native App Versioning

## Runtime policy

Production Android and iOS builds check Firebase Remote Config during application
bootstrap. Android uses `android_force_update_enabled` and
`android_minimum_version_code`; iOS uses `ios_force_update_enabled` and
`ios_minimum_build_number`. Separate keys prevent an Android rollout threshold
from blocking iPhones. Each release uses a monotonically increasing integer native
build number. Both values must come from the remote source. Missing, default, mixed,
invalid, timed-out, or unavailable values fail open so configuration trouble cannot
accidentally lock every user out.

The mandatory screen replaces the application routes, consumes all safe-area
edges, blocks the Android back action, and starts a Google Play immediate update.
If the native update flow cannot start, the screen opens the package's Play Store
page. On iOS, the same mandatory screen starts the installed SDK's StoreKit product
page, falling back to Openings' App Store URL. Apple handles installation outside
the app; an Android-style in-place update is not available. This behavior is
disabled in development and on unsupported platforms.

After the mandatory check passes, the native store may report a newer compatible
version. Android requires the flexible-update flag; iOS offers the App Store
update when a newer version exists. The app shows a dismissible safe-area-aware
notice. A dismissal is stored by store version, so a later release may be
offered again. Native update modules are dynamically loaded to keep unsupported
runtimes safe.

## Firebase configuration

Create the platform-specific Remote Config parameters in the `openingshq` Firebase project:

- `android_force_update_enabled`: Boolean, default `false`.
- `android_minimum_version_code`: Number, default `0`.
- `ios_force_update_enabled`: Boolean, default `false`.
- `ios_minimum_build_number`: Number, default `0`.

The client keeps a 12-hour fetch interval and a 2.5-second fetch timeout. The iOS
store lookup uses `AppStoreID=6834098510` from Expo configuration and returns no
update before the first public version is available.

Publish the minimum version first while forced updates remain disabled. Confirm
that the target build is available to the intended Google Play audience, then
enable the relevant platform's Boolean parameter. Do the same for iOS only after
the target version is public on the App Store. To roll back, publish the platform's
force-update parameter as `false`; clients observe that on their next successful
fetch. Repository files must never contain Firebase
credentials, service-account JSON, signing material, or private tokens.

## Verification

Policy tests cover disabled, invalid, stale, mixed-source, and mandatory cases.
Adapter tests cover unavailable native modules and Firebase failures. Context and
UI tests cover bootstrap priority, version-scoped dismissal, fallback navigation,
back blocking, safe-area padding, and all six supported locales.
