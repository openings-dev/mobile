# Google Play Listing

## Source of truth

The localized Google Play listing lives in `fastlane/metadata/android`. The six
supported store locales are `en-US`, `pt-BR`, `es-ES`, `it-IT`, `fr-FR`, and
`de-DE`. Each locale provides title, short description, full description, release
notes for version code 1, a 512×512 icon, a 1024×500 feature graphic, and six
1080×1920 phone screenshots.

Screenshots use real light-theme Android application captures for Jobs, filters,
job details, saved state, Communities, and Authors. Localized editorial headings
frame the native UI without inventing employers, listings, ratings, rankings, or
application features.

## Store configuration

- App name: Openings
- Package: `dev.openings.mobile`
- Category: Business
- Website: `https://openings.dev`
- Support: `support@openings.dev`
- Privacy policy: `https://openings.dev/privacy`
- Pricing: free, with no advertising or in-app purchases
- Access: unrestricted and without an account
- Audience: adults 18 and over; not directed to children
- Availability: every Google Play country and region

Openings is not a news, government, finance, health, or social-network product and
does not host user-generated content. Public GitHub listing links can lead to
third-party content outside Openings.

## Data safety contract

Saved jobs, viewed state, locale, appearance, discovery preferences, and consent
choices remain local to the device. Crashlytics can collect crash logs and related
technical device or app information. Sentry can collect sanitized diagnostics.
After explicit consent, Mixpanel can collect the allowlisted app interactions and
device or installation information needed to operate analytics, with IP-based
geolocation disabled. After explicit consent and system permission, OneSignal can
process a device or installation identifier plus notification delivery and
interaction data.

The app does not intentionally collect names, email addresses, search text,
precise location, messages, photos, videos, audio, contacts, files, payment data,
health data, or authentication credentials. Network traffic uses encrypted HTTPS.
The public privacy policy must be updated before this contract expands.

## Delivery safety

`make android-store-listing ANDROID_VERSION_CODE=<code>` uploads only listing
metadata, images, screenshots, and the explicit version's release notes. It skips
APK and AAB upload and does not promote a track. Binary delivery and production
promotion remain separate, explicit lanes.
