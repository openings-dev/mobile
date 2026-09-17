# OneSignal initialization order

## Context

Android release `0.1.3 (5)` can crash while mounting notification navigation with `IllegalStateException: Must call 'initWithContext' before use`. The native stack ends at `RNOneSignal.addNotificationClickListener`.

The application starts notifications at module load, but `startNotifications()` first awaits consent from asynchronous storage. React can mount `NotificationNavigation` during that wait. Its effect calls `OneSignal.Notifications.addEventListener` before `initOneSignal()` has invoked `OneSignal.initialize()`. A JavaScript `try/catch` cannot contain this failure because the React Native bridge invokes the native method asynchronously.

## Decision

Make listener registration initialization-aware inside the OneSignal client. Calls made before successful initialization will create pending registrations without touching `OneSignal.Notifications`. Immediately after `OneSignal.initialize()` succeeds, the client will attach every active pending registration.

This keeps SDK lifecycle rules at the service boundary and protects current and future consumers without coupling screen rendering to notification startup.

## Listener lifecycle

Each registration owns one stable native listener reference and an attached flag.

1. `addNotificationClickListener()` creates the registration.
2. If OneSignal is initialized, it attaches immediately.
3. Otherwise, it remains in a pending set without calling the native notifications API.
4. Successful initialization attaches all still-active registrations.
5. Unsubscribing before initialization removes the pending registration and never calls the native API.
6. Unsubscribing after attachment removes the exact listener reference and makes repeated cleanup a no-op.
7. Test reset clears both initialization state and pending registrations.

If listener attachment throws synchronously after initialization, the registration remains unattached and the application continues. Notification failures must not block startup or navigation.

## Alternatives rejected

- Gating `NotificationNavigation` rendering on initialization would work but would couple presentation to SDK lifecycle and leave other future callers exposed.
- Dropping early listener registrations would avoid the crash but break cold-start notification navigation.
- Relying on the existing `try/catch` is insufficient because the fatal exception occurs later on the native bridge thread.

## Testing

- Reproduce registration before initialization and assert that the native listener method is not called.
- Initialize afterward and assert that the pending listener attaches once.
- Unsubscribe before initialization and assert that initialization does not attach it.
- Preserve payload validation and exact-listener cleanup coverage.
- Run notification tests, lint, type checking, the complete Jest suite, and Expo Doctor.

## Release

Integrate this change with the pending Play ownership fix through a protected pull request. Correct the Sentry release environment to `production`, then publish Android `0.1.4 (6)` only to Google Play internal testing. Do not promote to production.
