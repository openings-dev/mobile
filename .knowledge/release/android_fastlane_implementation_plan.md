# Android Fastlane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add a credential-safe Android Fastlane and manual GitHub Actions release
flow adapted from Troco for the `dev.openings.mobile` application.

**Architecture:** Gradle builds and signs the binary, Fastlane coordinates Gradle
and Google Play, and GitHub Actions preserves one signed internal-test artifact for
explicit production promotion. Public sibling packages are checked out beside the
mobile repository in CI to satisfy the current `file:` dependency layout.

**Tech Stack:** Expo SDK 57 bare workflow, Gradle, Ruby 3.3, Bundler, Fastlane,
Google Play service accounts, GitHub Actions, Jest.

---

### Task 1: Define the Android release contract

**Files:**

- Create: `tests/contracts/android-release.test.ts`
- Modify: `tests/contracts/makefile.test.ts`

- [ ] **Step 1: Write the failing release contract**

Create assertions that read missing files as an empty string, then require:

```ts
expect(appfile).toContain('package_name("dev.openings.mobile")');
expect(fastfile).toMatch(/lane :bundle_release/);
expect(fastfile).toMatch(/lane :internal/);
expect(fastfile).toMatch(/lane :upload_internal/);
expect(fastfile).toMatch(/lane :production/);
expect(gradle).toContain('System.getenv("ANDROID_VERSION_CODE")');
expect(gradle).toContain('System.getenv("ANDROID_VERSION_NAME")');
expect(gradle).toContain("if (hasReleaseSigning)");
expect(internalWorkflow).toContain("openings-android-${{ inputs.version_code }}");
expect(productionWorkflow).toContain("Android production release");
expect(releaseFiles.join("\n")).not.toMatch(/troco|admob|firebase|sentry/i);
```

Extend the Makefile contract with `fastlane-install`, `android-release-check`,
`android-release-bundle`, `android-release-internal`, and
`android-release-production` targets.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```sh
npm test -- --runInBand tests/contracts/android-release.test.ts tests/contracts/makefile.test.ts
```

Expected: FAIL because the Fastlane, workflow, Gradle, and Make contracts are not
implemented.

- [ ] **Step 3: Commit the failing contract**

```sh
git add tests/contracts/android-release.test.ts tests/contracts/makefile.test.ts
git commit -m "test: define Android release contract"
```

### Task 2: Add the Fastlane and Gradle release core

**Files:**

- Create: `Gemfile`
- Create: `Gemfile.lock`
- Create: `fastlane/Appfile`
- Create: `fastlane/Fastfile`
- Modify: `android/app/build.gradle`
- Modify: `.gitignore`

- [ ] **Step 1: Pin Fastlane**

Create:

```ruby
source "https://rubygems.org"

gem "fastlane", "~> 2.228"
```

Generate `Gemfile.lock` with Bundler 2.7.2.

- [ ] **Step 2: Add the application and lane contracts**

Use `dev.openings.mobile` in both Appfile and upload actions. Implement Android
lanes for repository checks, debug build, signed bundle, internal build/upload,
existing-bundle upload, and explicit internal-to-production promotion. Reject
missing signing files, Play credentials, AAB paths, and non-positive version codes.

- [ ] **Step 3: Configure safe Gradle signing and versions**

Load `android/keystore.properties`, require `storeFile`, `storePassword`,
`keyAlias`, and `keyPassword`, and create the release signing configuration only
when all fields exist. Define:

```groovy
versionCode = (System.getenv("ANDROID_VERSION_CODE") ?: "1").toInteger()
versionName = System.getenv("ANDROID_VERSION_NAME") ?: "0.1.0"
```

Release builds must never fall back to `signingConfigs.debug`. A task-graph guard
must stop any release task when production signing is absent.

- [ ] **Step 4: Ignore all local release material**

Ignore `.bundle/`, `vendor/bundle/`, `fastlane/report.xml`, Fastlane output,
`android/keystore.properties`, `android/app/keystore.jks`,
`google-play-service-account.json`, `*.aab`, and `*.apk`.

- [ ] **Step 5: Run contract and syntax checks**

Run:

```sh
ruby -c fastlane/Fastfile
npm test -- --runInBand tests/contracts/android-release.test.ts
```

Expected: Ruby syntax PASS; contract remains RED only for workflows, script, and
Make targets not yet added.

- [ ] **Step 6: Commit the release core**

```sh
git add Gemfile Gemfile.lock fastlane/Appfile fastlane/Fastfile \
  android/app/build.gradle .gitignore
git commit -m "build: add Android Fastlane core"
```

### Task 3: Add credential restoration and manual workflows

**Files:**

- Create: `scripts/restore-google-play-service-account.mjs`
- Create: `tests/scripts/restore-google-play-service-account.test.ts`
- Create: `.github/workflows/android-internal.yml`
- Create: `.github/workflows/android-production-release.yml`

- [ ] **Step 1: Write the failing credential-restoration test**

Execute the script with `process.execPath`. A base64-encoded service-account object
with `type`, `project_id`, `client_email`, `private_key`, and `token_uri` must produce
a mode-0600 JSON file. Invalid input must exit non-zero and explain that a valid
Google Play service account is required.

- [ ] **Step 2: Run the script test and verify RED**

Run:

```sh
npm test -- --runInBand tests/scripts/restore-google-play-service-account.test.ts
```

Expected: FAIL because the script does not exist.

- [ ] **Step 3: Implement the credential restorer**

Decode up to three base64 layers, strip a BOM, validate the required service-account
shape, create the destination directory, and write normalized JSON with mode 0600.

- [ ] **Step 4: Add the internal workflow**

Accept `version_code`, `version_name`, and `validate_only`. Validate signing and Play
secrets, check out `openings-dev/core`, `openings-dev/design-tokens`, and the current
mobile repository as siblings, install/build/check them, restore ignored signing,
build one AAB, preserve `openings-android-<version_code>`, then upload that exact AAB
to the internal track.

- [ ] **Step 5: Add the production workflow**

Accept `version_code`, `version_name`, and `source_run_id`. Validate semantic inputs,
the successful source workflow, repository, artifact identity, duplicate tag, and
duplicate release. Download the existing artifact, create a draft Openings release,
promote the explicit version, then publish the release. Retain the draft on failure.

- [ ] **Step 6: Run focused tests**

Run:

```sh
npm test -- --runInBand tests/contracts/android-release.test.ts \
  tests/scripts/restore-google-play-service-account.test.ts
```

Expected: PASS for both suites.

- [ ] **Step 7: Commit scripts and workflows separately**

```sh
git add scripts/restore-google-play-service-account.mjs \
  tests/scripts/restore-google-play-service-account.test.ts
git commit -m "build: validate Google Play credentials"
git add .github/workflows/android-internal.yml \
  .github/workflows/android-production-release.yml
git commit -m "ci: add Android release workflows"
```

### Task 4: Expose commands and document operations

**Files:**

- Modify: `Makefile`
- Modify: `.knowledge/README.md`
- Modify: `.knowledge/guides/development_setup.md`
- Modify: `.knowledge/guides/testing.md`
- Modify: `.knowledge/best_practices/security.md`
- Modify: `.knowledge/release/android_fastlane.md`

- [ ] **Step 1: Add explicit Make targets**

Use `BUNDLE ?= bundle` and expose install, lane listing/check, signed bundle,
internal release, and production promotion. Internal and production commands must
fail before Fastlane when `ANDROID_VERSION_CODE` is absent; bundle and internal must
also require the ignored signing files.

- [ ] **Step 2: Update the knowledge index and operating guides**

Document the Ruby/Bundler prerequisite, ignored file paths, local commands, five CI
secrets, manual workflow order, artifact reuse guarantee, current Android-only scope,
and the fact that no store application or release has been created by this change.

- [ ] **Step 3: Run full verification**

Run:

```sh
npm run check
ruby -c fastlane/Fastfile
bundle exec fastlane lanes
make --no-print-directory -s help
cd android && ./gradlew :app:assembleDebug
git diff --check
```

Expected: all commands exit zero, Expo Doctor reports 20/20 checks, Jest reports no
failures, Fastlane lists all six Android lanes, and Gradle creates the debug APK.

- [ ] **Step 4: Commit documentation and command surface**

```sh
git add Makefile .knowledge
git commit -m "docs: document Android release operations"
```

- [ ] **Step 5: Push the verified history**

```sh
git push origin main
```
