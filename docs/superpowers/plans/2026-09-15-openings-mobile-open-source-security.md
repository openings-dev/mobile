# Openings Mobile Open-Source Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare `openings-dev/mobile` for public visibility without exposing privileged credentials, weakening Android release provenance, or requiring private sibling repositories for contributor checks.

**Architecture:** Keep ordinary fork checks entirely secret-free and isolate Android signing/Play promotion in manual trusted-ref workflows. Build a redacted, reproducible audit that scans tracked refs and reports metadata rather than secret values; resolve confirmed findings in bounded commits. Treat the GitHub visibility change as a separate final operation after local, remote, licensing, and owner-approval gates pass.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript 6, Jest 29, Node.js 24, Gradle, Fastlane, GitHub Actions and GitHub CLI.

---

### Task 1: Align the Expo SDK 57 patch baseline

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/contracts/app-config.test.ts`

- [x] **Step 1: Write the failing patch-alignment contract**

Add a test that reads `package.json` and asserts the exact Expo Doctor-compatible patch ranges reported on September 15, 2026:

```ts
expect(manifest.dependencies).toMatchObject({
  expo: "~57.0.22",
  "expo-application": "~57.0.3",
  "expo-constants": "~57.0.18",
  "expo-dev-client": "~57.0.19",
  "expo-font": "~57.0.4",
  "expo-linking": "~57.0.10",
  "expo-localization": "~57.0.2",
  "expo-router": "~57.0.21",
  "expo-splash-screen": "~57.0.9",
  "expo-system-ui": "~57.0.4",
});
```

- [x] **Step 2: Run the test and observe RED**

Run: `npm test -- --runInBand tests/contracts/app-config.test.ts`

Expected: FAIL because the manifest contains earlier SDK 57 patch releases.

- [x] **Step 3: Apply only Expo-compatible patch updates**

Run: `npx expo install expo@~57.0.22 expo-application@~57.0.3 expo-constants@~57.0.18 expo-dev-client@~57.0.19 expo-font@~57.0.4 expo-linking@~57.0.10 expo-localization@~57.0.2 expo-router@~57.0.21 expo-splash-screen@~57.0.9 expo-system-ui@~57.0.4`

Do not accept major/minor upgrades or unrelated automated dependency rewrites.

- [x] **Step 4: Verify JavaScript and native compatibility**

Run:

```sh
npm run check
cd android && ./gradlew :app:assembleDebug
```

Expected: 60 Jest suites and 211 or more tests pass, Expo Doctor passes all checks, and Gradle creates the debug APK without release credentials.

- [ ] **Step 5: Commit the isolated baseline correction**

```sh
git add package.json package-lock.json tests/contracts/app-config.test.ts
git commit -m "chore: align Expo SDK 57 patches"
```

### Task 2: Add a redacted local repository audit

**Files:**
- Create: `scripts/audit-public-readiness.mjs`
- Create: `tests/scripts/audit-public-readiness.test.ts`
- Create: `docs/security/public_repository_audit.md`
- Modify: `package.json`

- [x] **Step 1: Write failing tests for redaction and coverage**

Test an injected command runner and fixture refs. Require paths, ref names, finding classes and SHA-256 fingerprints while forbidding matched values:

```ts
expect(report.coverage).toEqual(expect.objectContaining({
  heads: expect.any(Number),
  tags: expect.any(Number),
  trackedFiles: expect.any(Number),
}));
expect(JSON.stringify(report)).not.toContain("fixture-private-value");
expect(report.findings[0]).toMatchObject({
  classification: "credential-pattern",
  fingerprint: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
});
```

- [x] **Step 2: Run the audit tests and observe RED**

Run: `npm test -- --runInBand tests/scripts/audit-public-readiness.test.ts`

Expected: FAIL because the audit module does not exist.

- [x] **Step 3: Implement the bounded scanner**

The script must:

```js
const coverageCommands = [
  ["git", ["for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes", "refs/tags"]],
  ["git", ["ls-files", "-z"]],
  ["git", ["lfs", "ls-files"]],
  ["git", ["submodule", "status"]],
];
```

Scan blobs with size caps, never emit matching text, hash findings with Node's `crypto`, reject output paths outside `docs/security`, and distinguish `confirmed`, `review-required`, `public-client-config`, and `false-positive`. Exit nonzero only for confirmed or unresolved review-required findings.

- [x] **Step 4: Generate the first redacted report**

Run: `npm run security:audit -- --output docs/security/public_repository_audit.md`

Expected: report includes exact local ref/file/LFS/submodule coverage, inaccessible remote surfaces, finding fingerprints and no secret values.

- [x] **Step 5: Commit the audit mechanism and report**

```sh
git add package.json scripts/audit-public-readiness.mjs tests/scripts/audit-public-readiness.test.ts docs/security/public_repository_audit.md
git commit -m "feat: add redacted public readiness audit"
```

### Task 3: Inventory remote GitHub exposure and protection boundaries

**Files:**
- Create: `scripts/audit-github-surfaces.mjs`
- Create: `tests/scripts/audit-github-surfaces.test.ts`
- Create: `docs/security/github_surfaces.json`
- Modify: `docs/security/public_repository_audit.md`

- [x] **Step 1: Write failing tests for allowlisted remote metadata**

Require the report to contain only counts, names, visibility, permissions and timestamps from these endpoint classes:

```ts
expect(result).toMatchObject({
  repository: { nameWithOwner: "openings-dev/mobile", visibility: "PRIVATE" },
  surfaces: expect.objectContaining({
    branches: expect.any(Array),
    releases: expect.any(Array),
    workflows: expect.any(Array),
    artifacts: expect.any(Array),
    rulesets: expect.any(Array),
  }),
});
```

Reject response keys matching `/secret|token|credential|value/i` before serialization.

- [x] **Step 2: Run the test and observe RED**

Run: `npm test -- --runInBand tests/scripts/audit-github-surfaces.test.ts`

Expected: FAIL because the GitHub surface audit does not exist.

- [x] **Step 3: Implement read-only GitHub inventory**

Use `gh api` only with GET requests for repository visibility, branches, tags, releases, Actions permissions, workflows, artifact metadata, rulesets, environments and public-key/application metadata. Do not request Actions secret values, download artifacts, read logs, mutate settings or expose collaborator identities in the public report.

- [x] **Step 4: Record accessible and inaccessible surfaces**

Run: `node scripts/audit-github-surfaces.mjs --repository openings-dev/mobile --output docs/security/github_surfaces.json`

Expected: a redacted metadata file or an explicit `inaccessible` entry per endpoint; partial access must block public clearance rather than be reported as clean.

- [x] **Step 5: Commit the remote inventory**

```sh
git add scripts/audit-github-surfaces.mjs tests/scripts/audit-github-surfaces.test.ts docs/security/public_repository_audit.md docs/security/github_surfaces.json
git commit -m "feat: inventory public repository surfaces"
```

### Task 4: Enforce public/fork CI and trusted release separation

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `tests/contracts/public-ci.test.ts`
- Modify: `.github/workflows/android-internal.yml`
- Modify: `.github/workflows/android-production-release.yml`
- Modify: `tests/contracts/android-release.test.ts`

- [x] **Step 1: Write failing workflow security contracts**

Assert ordinary CI uses `pull_request` and `push` without secrets or write permissions; release workflows remain manual and reject untrusted provenance:

```ts
expect(ci).toContain("pull_request:");
expect(ci).toContain("contents: read");
expect(ci).not.toMatch(/pull_request_target|workflow_run|secrets\.|permissions:\s*[\s\S]*write/);
expect(internal).toContain("workflow_dispatch:");
expect(production).toContain('run.head_branch !== "main"');
```

Also require every external `uses:` reference to match `owner/repository@[a-f0-9]{40}`; local actions may use `./` paths.

- [x] **Step 2: Run workflow tests and observe RED**

Run: `npm test -- --runInBand tests/contracts/public-ci.test.ts tests/contracts/android-release.test.ts`

Expected: FAIL because no public CI exists, actions use mutable major tags, and production does not yet require the source run's `main` ref.

- [x] **Step 3: Add secret-free public CI**

The workflow must use:

```yaml
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 20
```

Checkout mobile plus the two public package repositories at reviewed immutable SHAs, install with `npm ci`, and run package checks followed by mobile `npm run check`. Do not run on a self-hosted runner or receive production environment/secrets.

- [x] **Step 4: Pin release actions and strengthen source provenance**

Resolve each currently used action tag with `git ls-remote` against its official repository, record the reviewed tag-to-SHA mapping in `docs/security/public_repository_audit.md`, replace every tag with the exact 40-character commit, and require the production source run to have `head_branch === "main"`, `event === "workflow_dispatch"`, the expected workflow path and this repository identity.

- [x] **Step 5: Verify and commit CI isolation**

Run: `npm test -- --runInBand tests/contracts/public-ci.test.ts tests/contracts/android-release.test.ts`

Expected: PASS with no mutable action reference and no privileged PR path.

```sh
git add .github/workflows tests/contracts docs/security/public_repository_audit.md
git commit -m "ci: isolate public checks from Android release"
```

### Task 5: Classify configuration and narrow privileged delivery

**Files:**
- Create: `docs/security/configuration_inventory.md`
- Create: `tests/contracts/configuration-boundary.test.ts`
- Modify: `.github/workflows/android-internal.yml`
- Modify: `fastlane/Fastfile`
- Modify: `.env.example`
- Modify: `README.md`

- [x] **Step 1: Write failing configuration-boundary tests**

Create an allowlist classifying every configured name without values:

```ts
const publicClient = [
  "EXPO_PUBLIC_MIXPANEL_API_HOST",
  "EXPO_PUBLIC_MIXPANEL_TOKEN",
  "EXPO_PUBLIC_ONESIGNAL_APP_ID",
  "EXPO_PUBLIC_SENTRY_DSN",
  "EXPO_PUBLIC_SENTRY_ENVIRONMENT",
];
const privileged = [
  "ANDROID_KEY_PASSWORD",
  "ANDROID_KEYSTORE_BASE64",
  "ANDROID_STORE_PASSWORD",
  "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64",
  "GOOGLE_SERVICES_JSON_BASE64",
  "SENTRY_AUTH_TOKEN",
];
```

Assert privileged names appear only under `secrets`, public client inputs are documented as extractable, release credentials are scoped to their consuming steps/jobs, and generated files are deleted under `if: always()`.

- [x] **Step 2: Run configuration tests and observe RED**

Run: `npm test -- --runInBand tests/contracts/configuration-boundary.test.ts`

Expected: FAIL until the inventory and cleanup guarantees exist.

- [x] **Step 3: Implement the inventory and cleanup contract**

Document owner, consumer, privilege, delivery path and classification for every name. Keep client configuration out of ordinary contributor CI. Add an unconditional cleanup step for the keystore, `keystore.properties`, Firebase configuration and Play JSON. Keep `ANDROID_SIGNING_CERT_SHA256`, Sentry organization/project names and package identity classified as public metadata unless the audit proves a different risk.

- [x] **Step 4: Handle confirmed exposure safely**

If the redacted audit finds a privileged value in Git history, logs or artifacts, stop this task before repository visibility, rotate/revoke the exact credential through its owner, preserve signing continuity, and record only the credential name, fingerprint and rotation result. Any history rewrite or release deletion requires a separate explicit approval.

- [x] **Step 5: Verify and commit configuration boundaries**

Run: `npm test -- --runInBand tests/contracts/configuration-boundary.test.ts tests/contracts/android-release.test.ts`

```sh
git add docs/security/configuration_inventory.md tests/contracts/configuration-boundary.test.ts .github/workflows/android-internal.yml fastlane/Fastfile .env.example README.md
git commit -m "security: classify mobile configuration boundaries"
```

### Task 6: Replace private sibling dependencies with public package releases

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `metro.config.js`
- Modify: `.knowledge/guides/development_setup.md`
- Modify: `.knowledge/integrations/shared_packages.md`
- Modify: `tests/contracts/shared-packages.test.ts`

- [ ] **Step 1: Write the failing public-install contract**

```ts
expect(manifest.dependencies["@openingshq/core"]).toBe("0.1.0");
expect(manifest.dependencies["@openingshq/design-tokens"]).toBe("0.1.0");
expect(JSON.stringify(lockfile)).not.toContain('"file:../core"');
expect(JSON.stringify(lockfile)).not.toContain('"file:../design-tokens"');
```

Also assert Metro does not require sibling paths for the default contributor build.

- [ ] **Step 2: Run the contract and observe RED**

Run: `npm test -- --runInBand tests/contracts/shared-packages.test.ts`

Expected: FAIL because both dependencies resolve through sibling `file:` paths.

- [ ] **Step 3: Verify and install public versions**

Run `npm view @openingshq/core@0.1.0 dist.integrity version` and the equivalent command for `@openingshq/design-tokens`. Continue only if both public packages and expected exports are available. Then run:

```sh
npm install --save-exact @openingshq/core@0.1.0 @openingshq/design-tokens@0.1.0
```

Do not make sibling repositories public or use a private registry token.

- [ ] **Step 4: Prove a fresh secret-free install**

From a temporary clone with no sibling repositories and no `.env`, run `npm ci` and `npm run check`.

Expected: installation and all checks pass using the public npm registry only.

- [ ] **Step 5: Commit public dependency resolution**

```sh
git add package.json package-lock.json metro.config.js .knowledge/guides/development_setup.md .knowledge/integrations/shared_packages.md tests/contracts/shared-packages.test.ts
git commit -m "build: use public Openings packages"
```

### Task 7: Add open-source policy and asset-rights gates

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `docs/security/asset_inventory.md`
- Create: `tests/contracts/open-source-readiness.test.ts`
- Modify: `README.md`
- Modify after owner choice: `LICENSE`

- [ ] **Step 1: Write failing documentation contracts**

Assert README includes secret-free setup and the official-release boundary, contributing guidance forbids secrets in reports, SECURITY documents a private reporting route without inventing an address, and every tracked redistributable asset has an owner/rights classification.

```ts
expect(readme).toContain("npm ci");
expect(readme).toContain("Forks cannot publish the official Openings app");
expect(security).not.toContain("security@example.invalid");
expect(assetInventory).toContain("fastlane/metadata/android");
```

- [ ] **Step 2: Run documentation tests and observe RED**

Run: `npm test -- --runInBand tests/contracts/open-source-readiness.test.ts`

Expected: FAIL because these public policy files and the rights inventory do not exist.

- [ ] **Step 3: Inventory and document redistributable material**

Record source/owner/license or `owner-review-required` for app icons, screenshots, feature graphics, fonts and store text. A missing right blocks visibility; it does not authorize deleting or replacing an asset silently.

- [ ] **Step 4: Obtain the owner's explicit source-license choice**

Present the verified existing dependency licenses and repository goals. Add `LICENSE` only after the owner selects its terms. Brand/trademark permission must be documented separately from source-code licensing.

- [ ] **Step 5: Verify and commit open-source documentation**

Run: `npm test -- --runInBand tests/contracts/open-source-readiness.test.ts`

```sh
git add README.md CONTRIBUTING.md SECURITY.md LICENSE docs/security/asset_inventory.md tests/contracts/open-source-readiness.test.ts
git commit -m "docs: prepare public mobile contribution policy"
```

### Task 8: Validate the complete private candidate

**Files:**
- Modify: `docs/security/public_repository_audit.md`

- [ ] **Step 1: Re-run local redacted scans over every available ref**

Run: `npm run security:audit -- --output docs/security/public_repository_audit.md`

Expected: no `confirmed` or unresolved `review-required` privileged finding; public client identifiers remain classified as extractable configuration.

- [ ] **Step 2: Run complete application and release checks**

Run:

```sh
npm ci
npm run check
ruby -c fastlane/Fastfile
bundle exec fastlane lanes
cd android && ./gradlew :app:assembleDebug
```

Expected: all commands exit zero without release credentials or a Play upload.

- [ ] **Step 3: Verify the candidate from a fresh isolated clone**

Clone the candidate branch into a temporary directory, confirm there are no sibling Openings repositories or production environment files, then run `npm ci`, `npm run check` and the Android debug build.

- [ ] **Step 4: Review diff and remote coverage**

Review every changed file, re-run the GitHub surface inventory, verify the repository remains private, and record inaccessible surfaces as blockers. Do not download or expose logs/artifacts merely to make the report appear complete.

- [ ] **Step 5: Commit final audit evidence**

```sh
git add docs/security/public_repository_audit.md docs/security/github_surfaces.json
git commit -m "docs: record mobile public readiness evidence"
```

### Task 9: Change visibility only after explicit final approval

**Files:**
- Modify after successful operation: `docs/security/public_repository_audit.md`
- Modify: `/Users/guilherme/Workspace/Dev/repositories/docs/checklist.md`
- Modify: `/Users/guilherme/Workspace/Dev/repositories/docs/specs/execution-checklist.md`

- [ ] **Step 1: Present the final gate to the owner**

Report license choice, asset rights, secret/history scan coverage, remote inaccessible surfaces, fork CI, release provenance, fresh-clone result and residual risks. Ask explicit confirmation immediately before making `openings-dev/mobile` public because public clones cannot be recalled.

- [ ] **Step 2: Re-read repository identity and visibility**

Run: `gh repo view openings-dev/mobile --json nameWithOwner,visibility,url,defaultBranchRef`

Expected: exact repository `openings-dev/mobile`, default branch `main`, visibility `PRIVATE`.

- [ ] **Step 3: Change only the target repository visibility**

Run after explicit approval: `gh repo edit openings-dev/mobile --visibility public --accept-visibility-change-consequences`

Do not change sibling repositories, Pages projects, package visibility, application IDs or Play settings.

- [ ] **Step 4: Recheck public surfaces without secrets**

Verify anonymous access to the default branch, tags, release metadata, workflows, README, CONTRIBUTING, SECURITY and license. Confirm privileged workflows remain manual and ordinary CI remains secret-free. Do not print Actions secret/configuration values.

- [ ] **Step 5: Record acceptance and update shared checklists**

Record the public verification timestamp, final commit, coverage and residual risks. Update the shared workspace checklists without erasing historical evidence. No Play release is required for acceptance.
