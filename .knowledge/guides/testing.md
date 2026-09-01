# Testing

> Define the evidence required for behavior, package integration, and native compatibility.

## Test strategy

Write a failing behavioral test before production behavior. Prefer externally
observable outcomes over private implementation details.

The current Jest suite covers:

- six-locale catalog completeness and key parity;
- exact, regional, Portuguese, and fallback locale resolution;
- runtime loading of both public sibling packages;
- semantic token and NativeWind preset contracts;
- localized home-screen rendering;
- error-boundary recovery through an accessible retry action.

## JavaScript verification

`npm run check` runs lint, strict TypeScript, Jest in band, and Expo Doctor. Run it
from `mobile` after application changes. Public packages have their own `npm run
check` pipelines for lint, types, Vitest, and distributable builds.

When a failure appears, diagnose its source before changing versions or suppressing
rules. A package peer mismatch, stale generated native project, test environment
limitation, and application defect require different fixes.

## Native verification

JavaScript tests do not prove that Expo modules, CocoaPods, Gradle, fonts, bundle
identifiers, or generated native code are compatible. After native-impacting work,
run the affected debug build:

```sh
cd android && ./gradlew :app:assembleDebug
xcodebuild -workspace ios/Openings.xcworkspace \
  -scheme Openings \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO build
```

Warnings emitted by third-party native dependencies should be reviewed, but a
successful process exit is the build result. Do not describe the app as release
ready until release configuration, signing, device behavior, and distribution have
their own approved verification scope.
