# Development Setup

> Explain how to install, validate, and run the local Openings Mobile foundation.

## Repository layout

During local foundation development, the mobile repository expects two sibling
repositories:

```text
openings.dev/
├── core/                 # @openingshq/core
├── design-tokens/        # @openingshq/design-tokens
└── mobile/               # @openingshq/mobile
```

`package.json` currently uses `file:../core` and `file:../design-tokens`. Metro
watches both sibling folders. Build the public packages before installing or
starting mobile whenever their generated `dist` output changes.

## Install and check

From each public package, run:

```sh
npm install
npm run check
```

Then from `mobile`:

```sh
npm install
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
