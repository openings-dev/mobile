# Configuration Inventory

This inventory records names and delivery boundaries only. It must never contain
configuration values. Public client configuration is extractable from the installed application
and must not be treated as a credential.

| Name | Classification | Owner / consumer | Delivery |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_MIXPANEL_API_HOST` | public-client | Mobile telemetry | GitHub Actions variable; bundled into official builds |
| `EXPO_PUBLIC_MIXPANEL_TOKEN` | public-client | Mobile analytics | GitHub Actions variable; bundled into official builds |
| `EXPO_PUBLIC_ONESIGNAL_APP_ID` | public-client | Mobile notifications | GitHub Actions variable; bundled into official builds |
| `EXPO_PUBLIC_SENTRY_DSN` | public-client | Mobile error reporting | GitHub Actions variable; bundled into official builds |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | public-client | Mobile error reporting | GitHub Actions variable; bundled into official builds |
| `EXPO_PUBLIC_SENTRY_RELEASE` | public metadata | Mobile error reporting | Derived from the requested release version |
| `SENTRY_ORG` | public metadata | Sentry build integration | GitHub Actions variable |
| `SENTRY_PROJECT` | public metadata | Sentry build integration | GitHub Actions variable |
| `ANDROID_SIGNING_CERT_SHA256` | public metadata | Bundle verifier | GitHub Actions variable |
| `ANDROID_KEY_ALIAS` | privileged | Android release signing | GitHub Actions secret, scoped to preflight/signing |
| `ANDROID_KEY_PASSWORD` | privileged | Android release signing | GitHub Actions secret, scoped to preflight/signing |
| `ANDROID_KEYSTORE_BASE64` | privileged | Android release signing | GitHub Actions secret, materialized only during release |
| `ANDROID_STORE_PASSWORD` | privileged | Android release signing | GitHub Actions secret, scoped to preflight/signing |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64` | privileged | Google Play delivery | GitHub Actions secret, materialized in the runner temporary directory |
| `GOOGLE_SERVICES_JSON_BASE64` | privileged delivery input | Firebase client configuration | GitHub Actions secret, materialized only for official builds |
| `SENTRY_AUTH_TOKEN` | privileged | Sentry source-map upload | GitHub Actions secret, scoped to the release build |

`google-services.json` contains Firebase client identifiers rather than an
administrative credential, but it is delivered as a secret to preserve the current
project boundary. Google Play service-account JSON, signing material and Sentry's
authentication token are credentials and must be rotated if their fingerprints are
ever confirmed in repository history, workflow output or downloadable artifacts.

Ordinary contributor CI receives none of these names. Release jobs delete every
materialized credential and generated Firebase file under `if: always()`; runner
ephemerality is an additional safeguard, not the cleanup mechanism.
