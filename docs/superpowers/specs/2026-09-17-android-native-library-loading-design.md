# Android native library loading compatibility

## Context

Openings Mobile `0.1.2 (4)` crashes during `MainApplication.onCreate` on physical OnePlus 8 Pro devices running Android 11. SoLoader cannot find `libreactnative.so`. Crashlytics shows an ARM64 application directory alongside `x86_64` direct-APK sources and `com.mojito.framework`, which indicates a cloned or virtualized application runtime handling Play-generated splits inconsistently.

The release currently sets `expo.useLegacyPackaging=false`, so Android loads native libraries directly from APK splits. The internal-release workflow also deliberately builds only `armeabi-v7a` and `arm64-v8a`.

## Decision

Release builds will use legacy native-library packaging. Android will extract the ARM native libraries into the application's native library directory instead of depending on direct loading from Play-generated APK splits. The React Native new architecture and the existing ARM architecture scope remain enabled.

This is preferred over adding x86 architectures because the affected hardware is ARM64 and the crash is caused by an inconsistent runtime view of the installed splits. Disabling React Native's new architecture would be a broad rollback that does not address that packaging mismatch.

## Build and release safeguards

- Set `expo.useLegacyPackaging=true` in the checked-in Android Gradle configuration.
- Extend AAB verification to inspect the bundle and require `libreactnative.so` for both supported ABIs: `armeabi-v7a` and `arm64-v8a`.
- Keep version, certificate, and digest verification unchanged.
- Run the repository verification suite before publishing.
- Publish the corrected build as `0.1.3 (5)` to Google Play internal testing only.

## Failure handling

The release must fail before upload if either supported ABI lacks `libreactnative.so`, if the bundle metadata or signing certificate is wrong, or if repository checks fail. No production promotion is part of this change.

## Verification

Automated tests will cover a valid bundle listing and missing-library cases for each supported ABI. The release workflow will execute the strengthened verifier against the exact signed AAB that is uploaded. Crashlytics validation remains observational after testers install the internal build; the existing production issue cannot be marked fixed until the corrected version runs on affected devices without recurring crashes.
