# OneSignal Initialization Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent notification click listeners from reaching the native OneSignal SDK before initialization while preserving cold-start click handling and cleanup.

**Architecture:** `onesignal-client.ts` will own listener lifecycle records and defer native attachment until `initOneSignal()` has invoked `OneSignal.initialize()`. Consumers keep the existing synchronous subscribe/unsubscribe interface; pending subscriptions can be cancelled without touching native APIs.

**Tech Stack:** TypeScript, React Native, OneSignal React Native SDK 5, Jest.

---

### Task 1: Reproduce the initialization race

**Files:**
- Modify: `tests/services/notifications/onesignal-client.test.ts`

- [ ] **Step 1: Add a failing deferred-registration test**

```ts
it("defers click listener registration until initialization", () => {
  const onJob = jest.fn();
  const unsubscribe = addNotificationClickListener(onJob);
  expect(mockAddEventListener).not.toHaveBeenCalled();

  process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
  expect(initOneSignal("undecided")).toBe(true);
  expect(mockAddEventListener).toHaveBeenCalledTimes(1);

  const listener = mockAddEventListener.mock.calls[0]?.[1] as (
    event: unknown,
  ) => void;
  listener({
    notification: {
      additionalData: {
        type: "openings.job",
        version: 1,
        jobId: "gh_1234567890abcdef12345678",
      },
    },
  });
  expect(onJob).toHaveBeenCalledWith("gh_1234567890abcdef12345678");

  unsubscribe();
  expect(mockRemoveEventListener).toHaveBeenCalledWith("click", listener);
});
```

- [ ] **Step 2: Add a failing cancellation test**

```ts
it("cancels a pending click listener without touching the native SDK", () => {
  const unsubscribe = addNotificationClickListener(jest.fn());
  unsubscribe();

  process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
  expect(initOneSignal("undecided")).toBe(true);
  expect(mockAddEventListener).not.toHaveBeenCalled();
  expect(mockRemoveEventListener).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Initialize the existing payload-validation test**

At the beginning of `accepts only the versioned new-job payload and removes the exact listener`, add:

```ts
process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID = "app-id";
initOneSignal("undecided");
```

- [ ] **Step 4: Run the focused suite and verify RED**

```bash
npm test -- --runInBand tests/services/notifications/onesignal-client.test.ts
```

Expected: the two new tests fail because the current client calls the native listener API immediately.

- [ ] **Step 5: Commit the regression tests**

```bash
git add tests/services/notifications/onesignal-client.test.ts
git commit -m "test(notifications): reproduce OneSignal startup race"
```

### Task 2: Defer native listener attachment

**Files:**
- Modify: `src/services/notifications/onesignal-client.ts`
- Test: `tests/services/notifications/onesignal-client.test.ts`

- [ ] **Step 1: Define the listener event and lifecycle record**

Add below `NotificationClickPayload`:

```ts
interface NotificationClickEvent {
  notification?: { additionalData?: unknown };
}

interface NotificationClickRegistration {
  active: boolean;
  attached: boolean;
  listener: (event: NotificationClickEvent) => void;
}
```

- [ ] **Step 2: Add the registration set and guarded attachment helper**

Replace the single initialization state declaration with:

```ts
let initialized = false;
const clickRegistrations = new Set<NotificationClickRegistration>();

function attachNotificationClickListener(
  registration: NotificationClickRegistration,
): void {
  if (!initialized || !registration.active || registration.attached) return;
  try {
    OneSignal.Notifications.addEventListener("click", registration.listener);
    registration.attached = true;
  } catch {
    // Listener failures never block application startup.
  }
}
```

- [ ] **Step 3: Flush pending listeners after initialization**

Immediately after `initialized = true` inside `initOneSignal`, add:

```ts
for (const registration of clickRegistrations) {
  attachNotificationClickListener(registration);
}
```

- [ ] **Step 4: Replace direct listener registration with lifecycle records**

Replace `addNotificationClickListener` with:

```ts
export function addNotificationClickListener(
  onJob: (jobId: string) => void,
): () => void {
  const registration: NotificationClickRegistration = {
    active: true,
    attached: false,
    listener: (event) => {
      const payload = parseNotificationClickPayload(
        event.notification?.additionalData,
      );
      if (payload) onJob(payload.jobId);
    },
  };
  clickRegistrations.add(registration);
  attachNotificationClickListener(registration);

  return () => {
    if (!registration.active) return;
    registration.active = false;
    clickRegistrations.delete(registration);
    if (!registration.attached) return;
    try {
      OneSignal.Notifications.removeEventListener(
        "click",
        registration.listener,
      );
    } catch {
      // Listener cleanup failure must not affect app navigation.
    }
  };
}
```

- [ ] **Step 5: Clear lifecycle state in the test reset**

```ts
export function resetOneSignalClientForTests(): void {
  initialized = false;
  clickRegistrations.clear();
}
```

- [ ] **Step 6: Run the focused suite and verify GREEN**

```bash
npm test -- --runInBand tests/services/notifications/onesignal-client.test.ts
```

Expected: all OneSignal client tests pass and early registration produces zero native calls before initialization.

- [ ] **Step 7: Commit the fix**

```bash
git add src/services/notifications/onesignal-client.ts
git commit -m "fix(notifications): defer listeners until OneSignal init"
```

### Task 3: Verify and release both fixes

**Files:**
- Verify: `src/services/notifications/onesignal-client.ts`
- Verify: `src/services/versioning/google-play-update.provider.ts`
- Verify: `tests/services/notifications/onesignal-client.test.ts`
- Verify: `tests/services/versioning/google-play-update-provider.test.ts`

- [ ] **Step 1: Run all repository checks**

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run doctor
git diff origin/main...HEAD --check
git status --short
```

Expected: lint, type checking, Jest, and Expo Doctor pass; the diff has no whitespace errors; the worktree has no uncommitted implementation files.

- [ ] **Step 2: Push and open a protected pull request**

```bash
git push -u origin codex/play-update-app-not-owned
gh pr create --repo openings-dev/mobile --base main --head codex/play-update-app-not-owned --title "Fix Android startup monitoring issues" --body "Prevent expected Play APP_NOT_OWNED alerts and defer OneSignal click listeners until native initialization. Includes regression coverage for both Android startup paths."
```

Expected: GitHub returns a pull request URL; direct writes to protected `main` are not used.

- [ ] **Step 3: Merge only after required checks**

```bash
gh pr checks --repo openings-dev/mobile --watch "$(gh pr view --repo openings-dev/mobile --json number --jq .number)"
gh pr merge "$(gh pr view --repo openings-dev/mobile --json number --jq .number)" --repo openings-dev/mobile --squash --delete-branch
```

Expected: every required check succeeds and the pull request becomes `MERGED`.

- [ ] **Step 4: Correct Sentry and publish internal version `0.1.4 (6)`**

```bash
gh variable set EXPO_PUBLIC_SENTRY_ENVIRONMENT --repo openings-dev/mobile --body production
gh variable get EXPO_PUBLIC_SENTRY_ENVIRONMENT --repo openings-dev/mobile
gh workflow run android-internal.yml --repo openings-dev/mobile --ref main -f version_code=6 -f version_name=0.1.4 -f validate_only=false
```

Expected: Sentry reads back `production`; the workflow is queued from merged `main`.

- [ ] **Step 5: Verify the complete internal release**

```bash
gh run watch "$(gh run list --repo openings-dev/mobile --workflow android-internal.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')" --repo openings-dev/mobile --exit-status
gh run view "$(gh run list --repo openings-dev/mobile --workflow android-internal.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')" --repo openings-dev/mobile --json status,conclusion,headSha,jobs,url
```

Expected: bundle verification and `Upload signed bundle to Google Play internal testing` succeed. Do not promote to production.
