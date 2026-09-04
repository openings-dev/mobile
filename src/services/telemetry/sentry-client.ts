import * as Sentry from "@sentry/react-native";

import { sanitizeSentryBreadcrumb, sanitizeSentryEvent } from "./sanitize";

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || initialized) return;

  initialized = true;
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? "production",
    release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: (event) =>
      sanitizeSentryEvent(event as never) as unknown as typeof event,
    beforeBreadcrumb: (breadcrumb) =>
      sanitizeSentryBreadcrumb(breadcrumb as never) as unknown as typeof breadcrumb,
  });
}

export function captureSentryException(
  error: unknown,
  context: { category: string },
): void {
  if (!initialized) return;
  Sentry.captureException(error, { tags: context });
}

export function resetSentryClientForTests(): void {
  initialized = false;
}
