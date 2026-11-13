# iOS integration parity

The owner requested Android/iOS feature and integration parity on November 12,
2026, using free service plans only. This supersedes the previous Android-only
delivery scope. Native compile, dashboard delivery and release acceptance remain
separate from source configuration and unit tests.

## Shared integrations

| Existing Android service | iOS source configuration |
| --- | --- |
| Firebase Crashlytics | Same RNFirebase 26.3.3 SDK and shared initializer; Firebase app plugin and dynamic SPM linkage |
| Firebase Remote Config | Same SDK/cache policy; separate `ios_force_update_enabled` and `ios_minimum_build_number` keys |
| Sentry | Same sanitized error client and DSN; existing Expo plugin for source maps/native symbols; tracing stays disabled |
| Mixpanel | Same public token, event allowlist and explicit consent flow |
| OneSignal | Same public app ID and explicit consent/permission flow; existing plugin generates APNs entitlement, background mode, NSE and app group |
| App updates | Existing `expo-in-app-updates` StoreKit implementation; correct App Store destination and localized shared update screens |

No new service, paid capability or subscription is introduced. Firebase Analytics
is an existing Remote Config peer and remains linked on both platforms; no new
analytics events or tracking calls were added.

## Native inputs

- Firebase: the real Apple app configuration for `dev.openings.mobile` in
  `openingshq` is restored locally at the ignored root `GoogleService-Info.plist`.
  Keep this source outside `ios/` so regeneration cannot erase it. Expo's Firebase
  plugin copies it into the app; `with-ios-firebase.cjs` also copies it to
  `ios/GoogleService-Info.plist` for RNFirebase 26.3.3's SPM dSYM uploader, which
  reads `${PROJECT_DIR}/GoogleService-Info.plist`.
  The private handoff copy is now organized outside this repository at the Dev
  workspace's `docs/fastlane-ios/openings/GoogleService-Info.plist`; shared Apple
  release inputs are under `docs/fastlane-ios/apple/`.
- Apple team: `VD2G3CWSCR`; app: `dev.openings.mobile`; App Store ID: `6834098510`.
- OneSignal: Apple push is active on the existing OneSignal app with the Expo SDK
  selected. Its APNs key is different from the App Store Connect API key. Register/sign
  `dev.openings.mobile.OneSignalNotificationServiceExtension` and shared group
  `group.dev.openings.mobile.onesignal` for both targets.
- Set the same `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_MIXPANEL_TOKEN`,
  `EXPO_PUBLIC_ONESIGNAL_APP_ID` and relevant public environment values used by
  Android. Sentry builds need `SENTRY_ORG`, `SENTRY_PROJECT` and a scoped
  `SENTRY_AUTH_TOKEN`; no private key belongs in `EXPO_PUBLIC_*`.

The installed RNFirebase 26.3.3 SPM integration rejects static linkage on this
React Native version. `plugins/with-ios-firebase.cjs` writes
`ios.useFrameworks=dynamic` through Expo's supported Podfile-properties mod.
OneSignal's notification extension targets iOS 16.4 to match the main app.

## Regeneration and release gates

After restoring the real Firebase configuration, run `npx expo prebuild --platform
ios --no-install` and inspect the generated Firebase startup, Sentry scripts,
OneSignal extension/entitlements, version fields and resource references. Then
install Pods and compile the actual Simulator/Release targets with Xcode.

Native sources were regenerated with the real Firebase configuration. The main
app calls `FirebaseApp.configure()`. The project contains the OneSignal extension,
production push entitlement, shared group, background notifications, Sentry
symbol/source-map scripts and dynamic frameworks. The release plugin binds the
main app and extension to `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` and removes
invalid undefined fields emitted by the installed project generator.

The prior Podfile lock and workspace are preserved. Their dependencies still need
to be reconciled on a network-enabled Mac: `pod install` reports an old
ExpoModulesCore lock, and `pod update --no-repo-update` reaches dependency download
but fails because `github.com` cannot resolve. No completed Pods manifest exists.
The Xcode project parser recognizes both targets and schemes; a native build has
not passed. The available runner also cannot connect to CoreSimulator and rejects
the incomplete workspace during the debug build attempt.

The account state was checked on November 12. OneSignal is on Free (3 MAU at the
initial check); Android is configured and Apple iOS APNs is now ACTIVE on the
correct app after the APNs credential was configured with the Expo SDK selected.
Sentry is on Developer and its local build token is present. The Mixpanel
OpeningsHQ project (4059564) is on Free; its token matches the local configuration
and the dashboard showed two existing events. These are account/configuration
checks, not acceptance of a new iOS build. No push was sent and no native build,
App Store upload or release was performed; no provider was upgraded.

Validate on an iPhone: opted-in push receipt and tap routing, denied permissions,
native Crashlytics crash after relaunch, a sanitized Sentry event, Mixpanel consent
on/off, independent iOS Remote Config keys, and mandatory/optional update actions.
Symbols/source maps must reach the dashboards for the exact signed build.

## iOS Fastlane lanes

Use the repository's Bundler-pinned Fastlane. `ios verify` runs the source checks
and an unsigned simulator build after Pods are installed. `ios archive` requires
an explicit three-part `version_name` matching both `package.json` and `app.json`,
a positive integer `build_number`, and an explicit unused `ipa_path`. It checks a
clean checkout and required SDK/signing inputs, archives both targets with the
same version/build, then inspects the exported IPA and records its SHA-256 plus
source commit in a sibling JSON file. The archive is built cleanly. The JSON is
written only after source checks, integration preflight, archive and artifact
inspection pass. Signing changes are restored afterwards.

Provide `IOS_SIGNING_IDENTITY`, `IOS_APP_PROFILE_SPECIFIER` and
`IOS_NOTIFICATION_PROFILE_SPECIFIER` for manual App Store signing. The SDK/Sentry
build values listed above are required. Store actions separately require
`ASC_KEY_ID`, `ASC_ISSUER_ID` and `ASC_KEY_FILE`; these are App Store Connect
credentials, not APNs credentials.

After device acceptance, `ios beta` requires the same explicit version, build,
IPA path and `tested_sha256`, plus the companion JSON produced by `ios archive`.
It rejects missing/stale manifests or incomplete preflight records before any
store action. The manifest binds the SHA-256, app, version/build, source commit
and successful archive checks without containing SDK tokens or build secrets.
It validates the exact artifact before uploading,
rejects a build number already present in the selected TestFlight version, and
does not distribute externally. `ios release` selects that exact version/build
without rebuilding or reuploading the binary, submits for review and leaves
release manual. It must only be invoked after APNs and the device/dashboard
acceptance checks above have passed.

The artifact validator checks the main app and expected extension, iPhoneOS
platform, matching versions, codesign integrity, team/application identities,
App Store profiles and expiration, shared OneSignal groups, production APNs for
the main app, and actual signing-certificate membership in each profile. No
wildcard or automatically discovered IPA is accepted. The Firebase plist must be
embedded in the IPA with the `openingshq` project, `dev.openings.mobile` bundle,
an Apple app ID and an API key. A manually supplied older IPA cannot bypass
integration preflight merely by satisfying the signature and version checks.

Archive preflight requires Sentry, Mixpanel and OneSignal client configuration
and the Sentry build credentials. It rejects flags that disable Sentry symbol
uploads, ignore their failures, disable Expo public environment inlining or skip
JS bundling. The manifest records that uploads were required; it does not claim
dashboard ingestion or replace the device/dashboard acceptance checks above.

Run `bundle exec ruby tests/native/ios_release_test.rb` for the fixture-based
artifact and upload/submission tests. Fixtures do not read production keys or
contact App Store Connect.

## Verification recorded on November 12, 2026

- Source regressions reproduced iOS updates being disabled and Android Remote
  Config keys being used on iOS.
- 285 tests in 70 suites passed, including installed iOS SDK resolution,
  OneSignal-generated APNs/group/background settings, Firebase dynamic linkage,
  the SPM plist copy and both native targets' version/build bindings.
- TypeScript and lint passed.
- 18 Ruby release tests / 65 assertions passed with the pinned RubyZip 2.4.1,
  including missing/stale archive manifests, absent/wrong Firebase configuration
  and disabled integration/symbol-upload inputs; Ruby syntax checks passed.
  The earlier 12-test artifact set also passed with RubyZip 3.7.0. The complete pinned
  Bundler set is unavailable locally, so the actual Fastlane execution is pending.
- `npm run check` reached Expo Doctor: 18/20 checks passed; schema and React Native
  Directory checks failed because the terminal cannot reach their services.
- Native build, signing, push delivery, crash ingestion and store upload are not
  verified by those source checks.

## Source handoff checkpoint

The local source snapshot is based on `openings-dev/mobile` commit
`340ba3e65e9e4be3362cf592273ca44d7d26683b`; all 396 original blob hashes were
verified. The sibling `ios-parity.patch` includes the six file renames from
Android-specific versioning names to shared app/store names. Its application to
the pristine baseline was checked and compared byte-for-byte with the prepared
source, including removed paths. `changed-files.json` records the complete diff.
The verified patch and checkpoint files are also copied to the Dev workspace's
`docs/fastlane-ios/openings/patches/` publication handoff folder.
Private environment files, Firebase service files, signing credentials,
dependencies and generated build outputs are excluded. This is a local handoff;
no commit, push, App Store upload or release was performed.

## Free-plan limits

Keep Firebase on Spark and the other providers on their free tiers, without
enabling overages or paid trials. As checked on November 12, 2026, OneSignal Free
has a shared organization limit of 1,000 monthly active users; Sentry Developer
includes 5,000 errors/month; Mixpanel Free includes 1 million events/month; Firebase
Remote Config Spark permits 100,000 fetches/day/project. Existing organization
usage must be checked before promising ongoing free delivery. SDK parity alone
does not change account plans or bypass their limits.

References: [RNFirebase setup](https://rnfirebase.io/),
[Expo SDK 57 config plugins](https://docs.expo.dev/config-plugins/introduction/),
[OneSignal Expo setup](https://documentation.onesignal.com/docs/en/react-native-expo-sdk-setup),
[OneSignal free-plan changes](https://onesignal.com/blog/whats-changing-on-onesignals-free-plan/).
