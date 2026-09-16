# Openings Mobile

Expo bare-workflow application for native Openings discovery on iOS and Android.
The repository is currently private while its open-source readiness gates are being
completed.

The app intentionally includes three product areas only:

- Jobs: public catalog search, structured filters, sorting, saved/viewed state, and native details;
- Communities: source health, geography, discovery, and community profiles;
- Authors: publisher discovery and author profiles.

It consumes the generated public snapshot from `openings-dev/data-pipeline`. It has no backend, account system, embedded opportunity dataset, application workflow, or job comparison feature.

## Local development

The app consumes exact public npm releases of `@openingshq/core` and
`@openingshq/design-tokens`. No sibling repositories or private registry token are
required.

```sh
npm ci
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

## Contributions and official releases

Forks cannot publish the official Openings app. Pull requests run only the
secret-free checks; signing, Sentry upload and Google Play delivery remain manual,
trusted-branch operations controlled by the project owners. See `CONTRIBUTING.md`
for the development workflow, `SECURITY.md` for private vulnerability reporting and
`docs/security/asset_inventory.md` for the outstanding redistribution-rights gate.
