# Android Fastlane

## Goal

Bring the reusable Android delivery structure from Troco into Openings Mobile
without creating a store application, uploading a binary, or introducing any
Troco-specific service.

## Approaches considered

1. Copy every Troco release file unchanged. This is fast but would import ad,
   observability, store-listing, and private-package assumptions that do not belong
   to Openings.
2. Adapt the Android release core and its manual workflows. This preserves the
   proven signing, internal-test, artifact-promotion, and GitHub Release flow while
   keeping unavailable integrations out. This is the selected approach.
3. Add a new cross-platform Fastlane setup for Android and iOS. This exceeds the
   reference implementation and would require App Store Connect decisions that the
   project has not made.

## Architecture

Fastlane owns repeatable Android verification, debug builds, signed Android App
Bundles, internal-track upload, and promotion of an explicit internal version to
production. Gradle remains the build authority. Fastlane supplies orchestration and
Google Play delivery only.

The local and CI signing contract uses ignored `android/keystore.properties` and
`android/app/keystore.jks` files. Google Play authentication uses either the ignored
`google-play-service-account.json` file or `GOOGLE_PLAY_JSON_KEY_FILE`. No secret or
store credential is committed.

The mobile repository currently consumes public sibling packages through `file:`
dependencies. The internal-release workflow therefore checks out `core`,
`design-tokens`, and `mobile` into one sibling layout before installation and build.

## Components

- `Gemfile` and `Gemfile.lock` pin Fastlane for reproducible local and CI execution.
- `fastlane/Appfile` declares `dev.openings.mobile` and optional Play credentials.
- `fastlane/Fastfile` defines `check`, `build_debug`, `bundle_release`, `internal`,
  `upload_internal`, and `production` Android lanes.
- `android/app/build.gradle` reads explicit version values from the environment,
  configures release signing only when local credentials exist, and refuses release
  tasks without those credentials. Debug builds keep the generated debug key.
- `scripts/restore-google-play-service-account.mjs` validates and materializes the
  base64 CI secret into a temporary file with restricted permissions.
- `.github/workflows/android-internal.yml` validates credentials, builds one signed
  artifact, and uploads that exact artifact to Google Play internal testing.
- `.github/workflows/android-production-release.yml` accepts an existing successful
  internal workflow run, downloads its artifact, creates a draft GitHub Release,
  promotes the explicit version, and publishes the release only after promotion.
- `Makefile` exposes installation, validation, build, internal-release, and
  production-promotion commands without hiding required version inputs.

## Data and release flow

For an internal release, a maintainer provides a positive Android version code and
a semantic version name. CI validates the five required secrets, restores signing
and Google Play credentials only in temporary or ignored paths, verifies the
repositories, builds the signed AAB once, stores it as
`openings-android-<version_code>`, and uploads that artifact to the internal track.

For production, a maintainer supplies the same version information plus the
successful internal workflow run ID. CI verifies the run, repository, workflow,
commit, and single non-expired artifact. It does not rebuild. Promotion operates on
the explicit internal version code. A GitHub Release remains a draft on failure and
becomes public only after Google Play accepts the promotion.

## Failure handling and safety

- Missing signing files stop release builds before Gradle can silently use the
  debug key.
- Invalid version codes, semantic versions, service-account JSON, workflow runs,
  duplicate tags, missing artifacts, and missing secrets fail with explicit errors.
- Debug builds do not require release credentials.
- Workflows are manual and dormant until the Google Play application and repository
  secrets are configured.
- The initial scope excludes iOS delivery, store-listing metadata, EAS Submit,
  advertising, analytics, Firebase, Sentry, and notification configuration.

## Testing

A Jest contract test verifies identifiers, lanes, Make targets, ignored secret
paths, environment-driven Android versions, release-signing guards, workflow names,
and the absence of Troco-specific values. A script test executes the credential
restorer with valid and invalid payloads. The final gate runs the full mobile check,
Fastlane syntax/lane discovery, Expo Doctor, and an Android debug build. A signed AAB
or store upload is intentionally not executed because signing and store credentials
do not exist yet.

## Local commands

Install and inspect the pinned release tooling:

```sh
make fastlane-install
make android-release-lanes
make android-release-check
```

Build a signed AAB without uploading it:

```sh
make android-release-bundle
```

Upload a new internal version or promote an existing internal version only when the
Google Play application and credentials exist:

```sh
ANDROID_VERSION_CODE=2 ANDROID_VERSION_NAME=0.2.0 make android-release-internal
ANDROID_VERSION_CODE=2 make android-release-production
```

`ANDROID_VERSION_CODE` must be a positive integer. `ANDROID_VERSION_NAME` must be a
semantic version without a `v` prefix. The internal lane sets both values before
Gradle builds the bundle.

## GitHub configuration

The manual workflows require these repository secrets:

- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_STORE_PASSWORD`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64`

Run `Android internal release` first with an unused version code and semantic
version name. After the internal upload succeeds, run `Android production release`
with the same values and the successful internal workflow run ID. The production
workflow accepts only the single non-expired `openings-android-<version_code>`
artifact from that run and never invokes Gradle.

No Google Play application, secret, signed bundle, store upload, or iOS delivery
configuration is created by the repository setup itself.
