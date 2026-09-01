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
