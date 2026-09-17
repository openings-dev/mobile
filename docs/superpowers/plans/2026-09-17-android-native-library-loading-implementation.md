# Android Native Library Loading Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package React Native's ARM libraries so Android 11 and OnePlus cloned runtimes can load `libreactnative.so`, and reject any release bundle that omits it.

**Architecture:** Keep the React Native new architecture and the existing ARM-only release scope. Switch Android native libraries from direct APK loading to extraction, then strengthen the existing standalone AAB verifier to inspect the ZIP entry listing for the two supported ABIs before the signed artifact can be archived or uploaded.

**Tech Stack:** Expo 57, React Native 0.86, Android Gradle Plugin, Node.js 24, Jest, Android App Bundle, GitHub Actions, Fastlane.

---

## File map

- `android/gradle.properties`: owns the checked-in Android native-library packaging mode.
- `tests/contracts/android-release.test.ts`: enforces the release packaging contract at repository-test time.
- `scripts/verify-android-aab.mjs`: validates manifest metadata, signing, digest, and required native bundle entries.
- `tests/scripts/verify-android-aab.test.ts`: exercises the standalone AAB verifier through controlled command fixtures.

### Task 1: Extract native libraries on installation

**Files:**
- Modify: `tests/contracts/android-release.test.ts`
- Modify: `android/gradle.properties`

- [ ] **Step 1: Write the failing packaging contract**

Read `android/gradle.properties` in the existing release contract and assert the selected packaging mode:

```ts
const gradleProperties = readProjectFile("android/gradle.properties");

it("extracts native libraries for Android 11 compatibility", () => {
  expect(gradleProperties).toMatch(/^expo\.useLegacyPackaging=true$/m);
  expect(gradleProperties).toMatch(/^newArchEnabled=true$/m);
});
```

- [ ] **Step 2: Run the contract and verify it fails**

Run:

```bash
npm test -- --runInBand tests/contracts/android-release.test.ts
```

Expected: FAIL because `expo.useLegacyPackaging` is still `false`.

- [ ] **Step 3: Enable extracted native-library packaging**

Change the exact Gradle property while leaving the new architecture enabled:

```properties
expo.useLegacyPackaging=true
```

- [ ] **Step 4: Run the contract and verify it passes**

Run:

```bash
npm test -- --runInBand tests/contracts/android-release.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the packaging change**

```bash
git add android/gradle.properties tests/contracts/android-release.test.ts
git commit -m "fix(android): extract native libraries on install"
```

### Task 2: Reject bundles missing React Native ARM libraries

**Files:**
- Modify: `tests/scripts/verify-android-aab.test.ts`
- Modify: `scripts/verify-android-aab.mjs`
- Modify: `tests/contracts/android-release.test.ts`

- [ ] **Step 1: Extend the verifier fixture with a bundle-entry command**

Create an executable fixture command that prints an entry list and pass it through `AAB_LIST_COMMAND`:

```ts
const listBundle = path.join(directory, "list-bundle");
writeFileSync(
  listBundle,
  `#!/bin/sh\nprintf '%s\\n' 'base/lib/armeabi-v7a/libreactnative.so' 'base/lib/arm64-v8a/libreactnative.so'\n`,
);
chmodSync(listBundle, 0o755);
return { aab, bundletool, keytool, listBundle };
```

Set `AAB_LIST_COMMAND: files.listBundle` in `verify()`.

- [ ] **Step 2: Write failing ABI coverage tests**

Allow the fixture to receive `bundleEntries`, then add:

```ts
it.each(["armeabi-v7a", "arm64-v8a"])(
  "rejects a bundle missing libreactnative.so for %s",
  (missingAbi) => {
    const entries = ["armeabi-v7a", "arm64-v8a"]
      .filter((abi) => abi !== missingAbi)
      .map((abi) => `base/lib/${abi}/libreactnative.so`);
    const result = verify(fixture({ bundleEntries: entries }));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("verification failed");
  },
);
```

- [ ] **Step 3: Run the verifier tests and confirm the new tests fail**

Run:

```bash
npm test -- --runInBand tests/scripts/verify-android-aab.test.ts
```

Expected: the missing-ABI cases FAIL because the verifier does not inspect bundle entries yet.

- [ ] **Step 4: Implement exact native-entry verification**

Add the supported ABI contract and execute either the injected command or system `unzip`:

```js
const requiredNativeEntries = [
  "base/lib/armeabi-v7a/libreactnative.so",
  "base/lib/arm64-v8a/libreactnative.so",
];

const listCommand = process.env.AAB_LIST_COMMAND?.trim();
const entryOutput = listCommand
  ? run(listCommand, [aab])
  : run("unzip", ["-Z1", aab]);
const entries = new Set(entryOutput.split("\n").filter(Boolean));
if (requiredNativeEntries.some((entry) => !entries.has(entry))) fail();
```

Keep `fail()` generic so no environment value or sensitive signing detail is printed.

- [ ] **Step 5: Require the verifier contract in release automation tests**

Add these expectations to the existing exact-bundle test:

```ts
expect(verifier).toContain("base/lib/armeabi-v7a/libreactnative.so");
expect(verifier).toContain("base/lib/arm64-v8a/libreactnative.so");
expect(verifier).toContain('run("unzip", ["-Z1", aab])');
```

- [ ] **Step 6: Run the focused tests and verify they pass**

Run:

```bash
npm test -- --runInBand tests/scripts/verify-android-aab.test.ts tests/contracts/android-release.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the AAB safeguard**

```bash
git add scripts/verify-android-aab.mjs tests/scripts/verify-android-aab.test.ts tests/contracts/android-release.test.ts
git commit -m "test(android): verify React Native libraries in AAB"
```

### Task 3: Validate and publish the corrected internal build

**Files:**
- No source changes expected.

- [ ] **Step 1: Run the complete repository verification**

Run:

```bash
npm run check
```

Expected: lint, TypeScript, Jest, and Expo Doctor all pass.

- [ ] **Step 2: Inspect the final diff and repository state**

Run:

```bash
git diff HEAD~2 --check
git status --short
```

Expected: no whitespace errors and no uncommitted files.

- [ ] **Step 3: Push the reviewed commits to `main`**

```bash
git push origin main
```

Expected: the remote `main` advances to the verified local commit.

- [ ] **Step 4: Complete the OneSignal FCM bootstrap before building**

Create a fresh short-lived OneSignal organization key from the authenticated dashboard, store it only for the bootstrap run, execute `configure-onesignal-fcm.yml`, verify the successful FCM v1 read-back, then delete the temporary GitHub secrets and revoke the temporary organization key. Update `EXPO_PUBLIC_ONESIGNAL_APP_ID` in `openings-dev/mobile` to `c49d82df-9d48-4283-b746-4afe280cda5e` only after that success.

- [ ] **Step 5: Dispatch the internal release**

Run:

```bash
gh workflow run android-internal.yml --repo openings-dev/mobile --ref main -f version_code=5 -f version_name=0.1.3 -f validate_only=false
```

Expected: preflight, build, AAB native-library verification, artifact preservation, and Google Play internal upload all succeed.

- [ ] **Step 6: Confirm delivery scope**

Verify the successful workflow conclusion and that version `0.1.3 (5)` is on the Google Play internal track. Do not trigger the production promotion workflow.
