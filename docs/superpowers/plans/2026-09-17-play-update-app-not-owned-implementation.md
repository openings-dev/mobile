# Play update APP_NOT_OWNED Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Google Play's expected `ERROR_APP_NOT_OWNED (-10)` eligibility result from creating Sentry alerts while preserving reporting for real update failures and correctly labeling signed releases.

**Architecture:** Keep classification at the Google Play update provider boundary, where native SDK failures already become the safe no-update fallback. Add one narrow predicate for the stable Play Core error code and use it at both check sites; leave all UI and version-policy behavior unchanged. Configure signed workflow builds as `production` in Sentry through the existing GitHub variable.

**Tech Stack:** TypeScript, React Native, Expo, `expo-in-app-updates`, Jest, GitHub Actions, Sentry, Google Play internal testing.

---

### Task 1: Add failing regression coverage

**Files:**
- Modify: `tests/services/versioning/google-play-update-provider.test.ts`

- [ ] **Step 1: Add a failing test for availability checks**

Add this test after the supported-runtime test:

```ts
it("does not report APP_NOT_OWNED while checking availability", async () => {
  const sdk = createSdk();
  sdk.checkForUpdate.mockRejectedValue(
    new Error(
      'Failed to check for updates: -10: Install Error(-10): The app is not owned by any user on this device.',
    ),
  );
  const report = jest.fn();
  const provider = new GooglePlayUpdateProvider(
    async () => sdk,
    () => "android",
    () => true,
    report,
  );

  await expect(provider.checkAvailability()).resolves.toEqual({
    available: false,
    flexibleAllowed: false,
    immediateAllowed: false,
    storeVersion: null,
    updateInProgress: false,
  });
  expect(report).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Add a failing test for update starts**

Add this test beside the availability regression:

```ts
it("does not report APP_NOT_OWNED while starting an update", async () => {
  const sdk = createSdk();
  sdk.checkForUpdate.mockRejectedValue(
    new Error(
      'Failed to check for updates: -10: Install Error(-10): The app is not owned by any user on this device.',
    ),
  );
  const report = jest.fn();
  const provider = new GooglePlayUpdateProvider(
    async () => sdk,
    () => "android",
    () => true,
    report,
  );

  await expect(provider.startFlexibleUpdate()).resolves.toBe(false);
  expect(report).not.toHaveBeenCalled();
  expect(sdk.startUpdate).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
npm test -- --runInBand tests/services/versioning/google-play-update-provider.test.ts
```

Expected: both new tests fail because `report` is called once; the pre-existing tests pass.

- [ ] **Step 4: Commit the regression tests**

```bash
git add tests/services/versioning/google-play-update-provider.test.ts
git commit -m "test(versioning): cover Play ownership errors"
```

### Task 2: Classify the expected Play ownership result

**Files:**
- Modify: `src/services/versioning/google-play-update.provider.ts`
- Test: `tests/services/versioning/google-play-update-provider.test.ts`

- [ ] **Step 1: Add the narrow classifier**

Add this module-level function below `NO_UPDATE`:

```ts
function isAppNotOwnedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /(?:^|\s)Install Error\(-10\):/.test(message);
}
```

The expression intentionally recognizes only Play Core's stable `-10` code as formatted by `expo-in-app-updates`; it does not classify generic ownership wording or other install errors.

- [ ] **Step 2: Suppress reporting only at the availability boundary**

Replace the `checkAvailability` catch body with:

```ts
} catch (error) {
  if (!isAppNotOwnedError(error)) this.reportSafely(error);
  return NO_UPDATE;
}
```

- [ ] **Step 3: Suppress reporting only at the update-start boundary**

Replace the `startUpdate` catch body with:

```ts
} catch (error) {
  if (!isAppNotOwnedError(error)) this.reportSafely(error);
  return false;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npm test -- --runInBand tests/services/versioning/google-play-update-provider.test.ts
```

Expected: all provider tests pass, including both `APP_NOT_OWNED` regressions and the existing unrelated-error reporting test.

- [ ] **Step 5: Commit the implementation**

```bash
git add src/services/versioning/google-play-update.provider.ts
git commit -m "fix(versioning): ignore Play ownership eligibility"
```

### Task 3: Verify the repository

**Files:**
- Verify: `src/services/versioning/google-play-update.provider.ts`
- Verify: `tests/services/versioning/google-play-update-provider.test.ts`

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: exit code 0 with no warnings or errors.

- [ ] **Step 2: Run type checking**

```bash
npm run typecheck
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 3: Run the complete Jest suite**

```bash
npm test -- --runInBand
```

Expected: every suite and test passes with zero failures.

- [ ] **Step 4: Run Expo Doctor**

```bash
npm run doctor
```

Expected: all checks pass.

- [ ] **Step 5: Check the final diff**

```bash
git diff origin/main...HEAD --check
git status --short
```

Expected: no whitespace errors and no uncommitted implementation files.

### Task 4: Integrate through branch protection

**Files:**
- Push commits from `codex/play-update-app-not-owned`

- [ ] **Step 1: Push the feature branch**

```bash
git push -u origin codex/play-update-app-not-owned
```

Expected: the remote branch is created without modifying `main` directly.

- [ ] **Step 2: Open a pull request**

```bash
gh pr create --repo openings-dev/mobile --base main --head codex/play-update-app-not-owned --title "Fix Play update ownership alerts" --body "Treat Google Play APP_NOT_OWNED as an expected eligibility result while preserving telemetry for real failures. Includes regression coverage for availability checks and update starts."
```

Expected: GitHub returns a pull request URL.

- [ ] **Step 3: Wait for required checks**

```bash
gh pr checks --repo openings-dev/mobile --watch "$(gh pr view --repo openings-dev/mobile --json number --jq .number)"
```

Expected: all required checks pass.

- [ ] **Step 4: Squash merge the pull request**

```bash
gh pr merge "$(gh pr view --repo openings-dev/mobile --json number --jq .number)" --repo openings-dev/mobile --squash --delete-branch
```

Expected: the pull request state becomes `MERGED` and protected `main` contains the fix.

### Task 5: Correct Sentry classification and release internally

**Files:**
- External configuration: repository variable `EXPO_PUBLIC_SENTRY_ENVIRONMENT`
- Workflow: `.github/workflows/android-internal.yml`

- [ ] **Step 1: Set the signed-release Sentry environment**

```bash
gh variable set EXPO_PUBLIC_SENTRY_ENVIRONMENT --repo openings-dev/mobile --body production
gh variable get EXPO_PUBLIC_SENTRY_ENVIRONMENT --repo openings-dev/mobile
```

Expected: the read-back value is exactly `production`.

- [ ] **Step 2: Dispatch Android `0.1.4 (6)` to internal testing**

```bash
gh workflow run android-internal.yml --repo openings-dev/mobile --ref main -f version_code=6 -f version_name=0.1.4 -f validate_only=false
```

Expected: a new workflow run is queued from the merged `main` commit.

- [ ] **Step 3: Wait for the entire release workflow**

```bash
gh run watch "$(gh run list --repo openings-dev/mobile --workflow android-internal.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')" --repo openings-dev/mobile --exit-status
```

Expected: preflight, signed bundle build, bundle verification, and Google Play internal upload all pass.

- [ ] **Step 4: Verify the final run independently**

```bash
gh run view "$(gh run list --repo openings-dev/mobile --workflow android-internal.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')" --repo openings-dev/mobile --json status,conclusion,headSha,jobs,url
```

Expected: status is `completed`, conclusion is `success`, and `Upload signed bundle to Google Play internal testing` succeeded. Do not promote the release to production.
