# Security and Privacy

> Protect the public-data boundary, device state, native credentials, and outbound navigation.

## Public does not mean trusted

Opportunity data and source text are public, but every remote JSON payload, URL,
identifier, and text field remains untrusted input. Validate parsed structures before
use, render remote content as text, and allow outbound navigation only to deliberate
supported HTTPS destinations.

Do not execute remote HTML or JavaScript. If rich source content is added later,
use an explicitly reviewed renderer and navigation policy rather than a permissive
WebView.

## Secrets and native material

The public Openings dataset requires no credential. Do not add GitHub tokens, backend
secrets, or private listing feeds to the app bundle.

Never log or version environment secrets, service-account files, signing credentials,
keystores, certificates, provisioning profiles, API tokens, or private configuration.
Local and CI signing material must remain outside tracked source and must not appear
in screenshots, fixtures, logs, or test output.

Android release signing uses only ignored `android/keystore.properties` and
`android/app/keystore.jks` files. Google Play authentication uses an ignored
`google-play-service-account.json` file or a temporary path supplied through
`GOOGLE_PLAY_JSON_KEY_FILE`. CI reconstructs these files from secrets, validates
them before use, and removes temporary Play credentials after delivery.

## Device-local product state

Saved jobs, viewed state, search preferences, and language or theme preferences are
personal application state even when they contain public job identifiers. Store only
what the product needs, validate versioned documents when reading them, and avoid
placing sensitive values in plaintext logs or analytics.

The current application persists versioned candidate state on the device and
includes no analytics, advertising, notifications, authentication, or cloud
synchronization.

## External services

Any future analytics or monitoring integration requires an explicit event and field
contract. Do not send search terms, saved jobs, viewed jobs, outbound application
intent, locale history, or stable device identifiers by default. Integration failure
must not block opportunity discovery.

## Dependency and platform safety

Use versions compatible with the installed Expo SDK. Review Expo Doctor and native
build output after dependency changes. Prefer Expo configuration and reviewed config
plugins over undocumented native mutations. Security fixes must be evaluated for
runtime impact; do not apply broad automated dependency rewrites without verifying
Expo compatibility.
