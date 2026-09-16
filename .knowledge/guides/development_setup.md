# Development Setup

> Explain how to install, validate, and run the local Openings Mobile foundation.

## Repository layout

The mobile repository is self-contained for contributors. It installs exact public
npm releases of `@openingshq/core` and `@openingshq/design-tokens`; sibling clones,
private registry access and repository credentials are not required.

## Install and check

From `mobile`:

```sh
npm ci
npm run check
```

Use a Node.js version supported by Expo SDK 57 and the package manifests. The
repository does not yet contain the planned shared Node version pin, so verify the
active runtime before diagnosing dependency or native build failures.

## Run the app

Start Metro for the development client:

```sh
npm start
```

Run a native development build with:

```sh
npm run android
npm run ios
```

The Android application ID and iOS bundle identifier are
`dev.openings.mobile`.

## Native regeneration

`android` and `ios` are generated Expo bare-workflow projects. After changing
`app.json`, Expo plugins, fonts, or native dependencies, run prebuild deliberately,
install CocoaPods dependencies when iOS changed, inspect the generated result, and
re-run the affected native build.

The Expo Doctor `appConfigFieldsNotSyncedCheck` is disabled in `package.json`
because this repository intentionally commits native folders and synchronizes those
fields through an explicit prebuild workflow. This exception does not remove the
requirement to regenerate and inspect native projects after configuration changes.

Do not use clean regeneration as a routine fix when it would erase a deliberate
native customization. Confirm ownership first.

## Android release tooling

Android delivery uses the Bundler-pinned Fastlane version from `Gemfile.lock`.
Install a current Ruby and Bundler, then run:

```sh
make fastlane-install
make android-release-lanes
make android-release-check
```

A local signed bundle requires ignored `android/keystore.properties` and
`android/app/keystore.jks` files:

```sh
make android-release-bundle
```

Internal and production lanes additionally require Google Play credentials through
`GOOGLE_PLAY_JSON_KEY_FILE` or the ignored root-level
`google-play-service-account.json`. They require explicit version values:

```sh
ANDROID_VERSION_CODE=2 ANDROID_VERSION_NAME=0.2.0 make android-release-internal
ANDROID_VERSION_CODE=2 make android-release-production
```

These commands are prepared for the future Google Play application. Adding the
tooling does not create the application or upload a release.
