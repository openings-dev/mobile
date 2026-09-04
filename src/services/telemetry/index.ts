import { initCrashlytics } from "./crashlytics-client";
import { captureSentryException, initSentry } from "./sentry-client";

let started = false;

export function startTelemetry(): void {
  if (started) return;
  started = true;
  initSentry();
  initCrashlytics();
}

// Crashlytics only records automatic native crashes; JS errors caught here
// go to Sentry only, per the design's JS/native reporting split.
export function captureTechnicalException(
  error: unknown,
  context: { category: string },
): void {
  captureSentryException(error, context);
}

export { trackProductEvent } from "./product-events";
export type { TelemetryEventMap, TelemetryEventName } from "./contracts";
