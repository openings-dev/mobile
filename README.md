# Openings Mobile

Private Expo bare-workflow application for native Openings discovery on iOS and Android.

The app intentionally includes three product areas only:

- Jobs: public catalog search, structured filters, sorting, saved/viewed state, and native details;
- Communities: source health, geography, discovery, and community profiles;
- Authors: publisher discovery and author profiles.

It consumes the generated public snapshot from `openings-dev/data-pipeline`. It has no backend, account system, embedded opportunity dataset, application workflow, or job comparison feature.

## Local development

The app consumes `@openingshq/core` and `@openingshq/design-tokens` from sibling local repositories. Build both packages before installing or starting the mobile application.

```sh
npm install
npm run check
npm run start
```

The application identifier is `dev.openings.mobile` on both platforms.

## Configuration boundary

Public client configuration is not secret: every `EXPO_PUBLIC_*` value can be
extracted from an installed application. Local development and pull-request checks
work with those values unset. Official Android delivery receives signing, Google
Play and build-service credentials only inside manual workflows restricted to the
trusted `main` branch. See `docs/security/configuration_inventory.md` for the
name-only inventory and ownership boundaries.
